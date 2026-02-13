import { NextRequest, NextResponse } from "next/server";
import { getUsersExpiringIn, logEvent } from "@/lib/server/supabase-server";
import { pushMessage } from "@/lib/server/line-client";
import { buildErrorMessage } from "@/lib/server/flex-messages";

/**
 * Daily cron job: remind users whose subscription expires in 3 days.
 * Vercel Cron schedule: 0 1 * * * (every day at 01:00 UTC)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this header for cron jobs)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiringUsers = await getUsersExpiringIn(3);

    let sent = 0;
    for (const user of expiringUsers) {
      try {
        const expiryDate = new Date(user.subscription_expires_at);
        const dateStr = `${expiryDate.getFullYear()}/${expiryDate.getMonth() + 1}/${expiryDate.getDate()}`;

        await pushMessage(user.line_user_id, [
          buildErrorMessage(
            `⏰ 你的方案將在 ${dateStr} 到期\n\n` +
              "如需續約，請至 snappword.com/pricing 選擇方案並付款，" +
              "完成後輸入「升級」並傳送付款截圖即可 🌱"
          ),
        ]);

        await logEvent(user.id, "expiry_reminder_sent", {
          payload: { expires_at: user.subscription_expires_at },
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send reminder to ${user.id}:`, err);
      }
    }

    return NextResponse.json({
      status: "ok",
      found: expiringUsers.length,
      sent,
    });
  } catch (err) {
    console.error("Expiry reminder cron error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
