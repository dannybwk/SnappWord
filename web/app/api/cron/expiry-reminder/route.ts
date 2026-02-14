import { NextRequest, NextResponse } from "next/server";
import { getUsersExpiringIn, getUsersWithDueCards, logEvent } from "@/lib/server/supabase-server";
import { pushMessage } from "@/lib/server/line-client";
import { buildErrorMessage } from "@/lib/server/flex-messages";

/**
 * Daily cron job (UTC 00:00 = Taiwan 08:00):
 * 1. Remind users whose subscription expires in 3 days
 * 2. Remind users with due cards who have streak 1~3 (habit-building phase)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ── 1. Expiry reminders (unchanged) ──
    const expiringUsers = await getUsersExpiringIn(3);
    let expirySent = 0;

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

        expirySent++;
      } catch (err) {
        console.error(`Failed to send expiry reminder to ${user.id}:`, err);
      }
    }

    // ── 2. Review reminders (only streak 1~3 users) ──
    const usersWithDueCards = await getUsersWithDueCards();
    let reviewSent = 0;

    for (const user of usersWithDueCards) {
      // Only push to users in the habit-building phase (streak 1~3)
      // streak=0: inactive, don't spam
      // streak>3: habit formed, don't need reminder
      if (user.current_streak >= 1 && user.current_streak <= 3) {
        try {
          await pushMessage(user.line_user_id, [
            buildErrorMessage(
              `🔥 連續第 ${user.current_streak} 天！你有 ${user.due_count} 張卡等你複習\n\n` +
                "👉 snappword.com/flashcard"
            ),
          ]);

          await logEvent(user.id, "review_reminder_sent", {
            payload: { streak: user.current_streak, due_count: user.due_count },
          });

          reviewSent++;
        } catch (err) {
          console.error(`Failed to send review reminder to ${user.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      status: "ok",
      expiry: { found: expiringUsers.length, sent: expirySent },
      review: { found: usersWithDueCards.length, sent: reviewSent },
    });
  } catch (err) {
    console.error("Daily cron error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
