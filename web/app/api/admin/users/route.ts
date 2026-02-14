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

// Gemini 2.0 Flash blended rate: ~$0.16/1M tokens
const GEMINI_COST_PER_TOKEN = 0.16 / 1_000_000;

/** GET /api/admin/users?q=keyword&page=1&limit=50 — list/search users with enriched data */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q") || "";
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "50", 10)));
  const offset = (page - 1) * limit;

  const sb = getClient();

  // Build user query
  let userQuery = sb
    .from("users")
    .select(
      "id, display_name, line_user_id, subscription_tier, subscription_expires_at, current_streak, last_review_date, created_at, vocab_cards(count)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q.trim()) {
    const pattern = `%${q.trim()}%`;
    userQuery = userQuery.or(`display_name.ilike.${pattern},line_user_id.ilike.${pattern}`);
  }

  const { data: users, count: totalCount, error } = await userQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ users: [], total: 0, page, limit });
  }

  // Fetch activity and cost data for these users in parallel
  const userIds = users.map((u: { id: string }) => u.id);

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [activityResult, costResult] = await Promise.all([
    // Recent activity: count of api_logs events in last 7 days per user
    sb
      .from("api_logs")
      .select("user_id, created_at")
      .in("user_id", userIds)
      .gte("created_at", sevenDaysAgo),
    // Cost: sum tokens from gemini_call events per user (all-time)
    sb
      .from("api_logs")
      .select("user_id, token_count")
      .in("user_id", userIds)
      .eq("event_type", "gemini_call")
      .not("token_count", "is", null),
  ]);

  // Aggregate activity per user: events in last 7 days + last active date
  const activityMap = new Map<string, { count7d: number; lastActive: string | null }>();
  for (const row of activityResult.data || []) {
    const r = row as { user_id: string; created_at: string };
    const existing = activityMap.get(r.user_id) || { count7d: 0, lastActive: null };
    existing.count7d++;
    if (!existing.lastActive || r.created_at > existing.lastActive) {
      existing.lastActive = r.created_at;
    }
    activityMap.set(r.user_id, existing);
  }

  // Aggregate cost per user
  const costMap = new Map<string, { totalTokens: number; callCount: number }>();
  for (const row of costResult.data || []) {
    const r = row as { user_id: string; token_count: number };
    const existing = costMap.get(r.user_id) || { totalTokens: 0, callCount: 0 };
    existing.totalTokens += r.token_count || 0;
    existing.callCount++;
    costMap.set(r.user_id, existing);
  }

  // Enrich user data
  const enrichedUsers = users.map((u: Record<string, unknown>) => {
    const uid = u.id as string;
    const activity = activityMap.get(uid) || { count7d: 0, lastActive: null };
    const cost = costMap.get(uid) || { totalTokens: 0, callCount: 0 };
    const vocabCards = u.vocab_cards as { count: number }[] | undefined;

    return {
      id: uid,
      display_name: u.display_name as string | null,
      line_user_id: u.line_user_id as string,
      subscription_tier: u.subscription_tier as string | null,
      subscription_expires_at: u.subscription_expires_at as string | null,
      current_streak: (u.current_streak as number) ?? 0,
      last_review_date: u.last_review_date as string | null,
      created_at: u.created_at as string,
      card_count: vocabCards?.[0]?.count ?? 0,
      activity_7d: activity.count7d,
      last_active: activity.lastActive,
      total_tokens: cost.totalTokens,
      api_calls: cost.callCount,
      cost_usd: Math.round(cost.totalTokens * GEMINI_COST_PER_TOKEN * 10000) / 10000,
    };
  });

  return NextResponse.json({
    users: enrichedUsers,
    total: totalCount ?? 0,
    page,
    limit,
  });
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
