import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getUpgradeRequests,
  reviewUpgradeRequest,
} from "@/lib/server/supabase-server";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

async function verifyAdmin(request: NextRequest): Promise<string | false> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);

  const sb = getClient();
  const {
    data: { user },
    error,
  } = await sb.auth.getUser(token);

  if (
    error ||
    !user?.email ||
    !getAdminEmails().includes(user.email.toLowerCase())
  ) {
    return false;
  }

  return user.email;
}

/** GET /api/admin/upgrade-requests?status=pending */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status") || "pending";

  try {
    const requests = await getUpgradeRequests(status);
    return NextResponse.json({ requests });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH /api/admin/upgrade-requests — approve or reject */
export async function PATCH(request: NextRequest) {
  const adminEmail = await verifyAdmin(request);
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { requestId, action, tier, months } = body as {
    requestId?: string;
    action?: "approve" | "reject";
    tier?: string;
    months?: number;
  };

  if (!requestId || !action) {
    return NextResponse.json(
      { error: "Missing requestId or action" },
      { status: 400 }
    );
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "approve" && tier) {
    const validTiers = ["free", "sprout", "bloom"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
  }

  if (months !== undefined && (months < 1 || months > 12)) {
    return NextResponse.json({ error: "Months must be 1-12" }, { status: 400 });
  }

  try {
    await reviewUpgradeRequest(requestId, action === "approve", tier, months);

    // Audit log
    const sb = getClient();
    await sb.from("api_logs").insert({
      event_type: "admin_upgrade_review",
      payload: { request_id: requestId, action, tier, months, admin_email: adminEmail },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
