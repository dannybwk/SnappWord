import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateUserTier } from "@/lib/server/supabase-server";

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

function extractToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

async function verifyAdmin(request: NextRequest): Promise<string | false> {
  const token = extractToken(request.headers.get("authorization"));
  if (!token) return false;

  const sb = getClient();
  const { data: { user }, error } = await sb.auth.getUser(token);

  if (error || !user?.email || !getAdminEmails().includes(user.email.toLowerCase())) {
    return false;
  }

  return user.email;
}

/** GET /api/admin/users?q=keyword — search users */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q") || "";
  if (!q.trim() || q.length > 100) {
    return NextResponse.json({ users: [] });
  }

  const sb = getClient();
  const pattern = `%${q.trim()}%`;

  const { data, error } = await sb
    .from("users")
    .select("id, display_name, line_user_id, subscription_tier, created_at, vocab_cards(count)")
    .or(`display_name.ilike.${pattern},line_user_id.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}

/** PATCH /api/admin/users — update user tier */
export async function PATCH(request: NextRequest) {
  const adminEmail = await verifyAdmin(request);
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, tier } = body as { userId?: string; tier?: string };

  if (!userId || !tier) {
    return NextResponse.json({ error: "Missing userId or tier" }, { status: 400 });
  }

  const validTiers = ["free", "sprout", "bloom"];
  if (!validTiers.includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  try {
    await updateUserTier(userId, tier);

    // Audit log
    const sb = getClient();
    await sb.from("api_logs").insert({
      user_id: userId,
      event_type: "admin_tier_change",
      payload: { tier, admin_email: adminEmail },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
