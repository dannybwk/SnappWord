import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

const TIER_PRICES: Record<string, number> = { sprout: 99, bloom: 249 };
// Gemini 2.0 Flash blended rate: $0.10/1M input, $0.40/1M output
// ~80% input / 20% output for image screenshots → $0.16/1M tokens
const GEMINI_COST_PER_TOKEN = 0.16 / 1_000_000;

export async function GET(request: NextRequest) {
  // Verify Supabase token + email whitelist
  const token = extractToken(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sbAuth = getClient();
  const { data: { user }, error: authError } = await sbAuth.auth.getUser(token);

  if (authError || !user?.email || !getAdminEmails().includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000).toISOString();

  const [
    totalUsers,
    totalCards,
    todayUsers,
    todayCards,
    todayScreenshots,
    geminiCalls7d,
    parseFails7d,
    latencyAvg7d,
    dailyUsersRaw,
    dailyCardsRaw,
    dailyGeminiRaw,
    dailyFailsRaw,
    langDist,
    sourceDist,
    tierDist,
    recentErrors,
    // Revenue & expiring & retention queries
    monthlyUpgrades,
    allUpgrades,
    activePaidUsers,
    expiringUsersRaw,
    usersRegistered30dAgo,
    allImageEvents,
    // Cost queries
    todayTokens,
    monthTokens,
    allTokens,
  ] = await Promise.all([
    // KPIs
    sb.from("users").select("*", { count: "exact", head: true }),
    sb.from("vocab_cards").select("*", { count: "exact", head: true }),
    sb.from("users").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    sb.from("vocab_cards").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    sb.from("api_logs").select("*", { count: "exact", head: true }).eq("event_type", "image_received").gte("created_at", todayStart),
    sb.from("api_logs").select("*", { count: "exact", head: true }).eq("event_type", "gemini_call").gte("created_at", sevenDaysAgo),
    sb.from("api_logs").select("*", { count: "exact", head: true }).eq("event_type", "parse_fail").gte("created_at", sevenDaysAgo),
    sb.from("api_logs").select("latency_ms").eq("event_type", "gemini_call").gte("created_at", sevenDaysAgo).not("latency_ms", "is", null),

    // Time series (30 days) — raw data, aggregated client-side
    sb.from("users").select("created_at").gte("created_at", thirtyDaysAgo),
    sb.from("vocab_cards").select("created_at").gte("created_at", thirtyDaysAgo),
    sb.from("api_logs").select("created_at").eq("event_type", "gemini_call").gte("created_at", thirtyDaysAgo),
    sb.from("api_logs").select("created_at").eq("event_type", "parse_fail").gte("created_at", thirtyDaysAgo),

    // Distributions — use select("*") so missing columns don't crash the query
    sb.from("vocab_cards").select("target_lang"),
    sb.from("vocab_cards").select("source_app"),
    sb.from("users").select("*"),

    // Tables
    sb.from("api_logs").select("*, users(display_name)").eq("event_type", "parse_fail").order("created_at", { ascending: false }).limit(20),

    // Revenue: this month approved upgrades (column is approved_tier, not tier)
    sb.from("upgrade_requests").select("approved_tier, months_paid").eq("status", "approved").gte("created_at", monthStart),
    // Revenue: all-time approved upgrades
    sb.from("upgrade_requests").select("approved_tier, months_paid"),
    // Paid users with active subscription — may return error if columns don't exist (degrades to 0)
    sb.from("users").select("*", { count: "exact", head: true }).neq("subscription_tier", "free").gt("subscription_expires_at", now.toISOString()),
    // Users expiring within 7 days — use select("*") so missing columns don't crash
    sb.from("users").select("*").neq("subscription_tier", "free").gt("subscription_expires_at", now.toISOString()).lte("subscription_expires_at", sevenDaysFromNow).order("subscription_expires_at", { ascending: true }),
    // Users registered around 30 days ago (window: 28-32 days) for retention
    sb.from("users").select("line_user_id, created_at").lte("created_at", thirtyDaysAgo),
    // All image_received events for retention calculation
    sb.from("api_logs").select("user_id, created_at").eq("event_type", "image_received"),
    // Cost: token usage today
    sb.from("api_logs").select("token_count").eq("event_type", "gemini_call").gte("created_at", todayStart).not("token_count", "is", null),
    // Cost: token usage this month
    sb.from("api_logs").select("token_count").eq("event_type", "gemini_call").gte("created_at", monthStart).not("token_count", "is", null),
    // Cost: token usage all-time
    sb.from("api_logs").select("token_count").eq("event_type", "gemini_call").not("token_count", "is", null),
  ]);

  // Compute average latency
  const latencyData = latencyAvg7d.data || [];
  const avgLatency = latencyData.length > 0
    ? Math.round(latencyData.reduce((sum: number, r: { latency_ms: number }) => sum + r.latency_ms, 0) / latencyData.length)
    : 0;

  // Compute error rate
  const geminiCount = geminiCalls7d.count ?? 0;
  const failCount = parseFails7d.count ?? 0;
  const errorRate = geminiCount > 0 ? Math.round((failCount / geminiCount) * 1000) / 10 : 0;

  // Aggregate time series into daily buckets
  function toDailyBuckets(rows: { created_at: string }[] | null): { date: string; count: number }[] {
    const buckets: Record<string, number> = {};
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }
    (rows || []).forEach((r) => {
      const key = r.created_at.slice(0, 10);
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }

  const dailyUsers = toDailyBuckets(dailyUsersRaw.data);
  const dailyCards = toDailyBuckets(dailyCardsRaw.data);

  // Daily error rate
  const geminiByDay: Record<string, number> = {};
  const failsByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const key = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
    geminiByDay[key] = 0;
    failsByDay[key] = 0;
  }
  (dailyGeminiRaw.data || []).forEach((r: { created_at: string }) => {
    const key = r.created_at.slice(0, 10);
    if (key in geminiByDay) geminiByDay[key]++;
  });
  (dailyFailsRaw.data || []).forEach((r: { created_at: string }) => {
    const key = r.created_at.slice(0, 10);
    if (key in failsByDay) failsByDay[key]++;
  });
  const dailyErrorRate = Object.keys(geminiByDay).map((date) => ({
    date,
    rate: geminiByDay[date] > 0
      ? Math.round((failsByDay[date] / geminiByDay[date]) * 1000) / 10
      : 0,
  }));

  // Revenue computation (column is approved_tier in upgrade_requests table)
  function computeRevenue(rows: { approved_tier: string; months_paid: number | null }[] | null): number {
    return (rows || []).reduce((sum, r) => {
      const price = TIER_PRICES[r.approved_tier] || 0;
      return sum + price * (r.months_paid || 1);
    }, 0);
  }

  const monthlyRevenue = computeRevenue(monthlyUpgrades.data as { approved_tier: string; months_paid: number | null }[] | null);
  const totalRevenue = computeRevenue(allUpgrades.data as { approved_tier: string; months_paid: number | null }[] | null);
  const paidUserCount = activePaidUsers.count ?? 0;
  const totalUserCount = totalUsers.count ?? 0;
  const conversionRate = totalUserCount > 0
    ? Math.round((paidUserCount / totalUserCount) * 1000) / 10
    : 0;

  // Expiring users — columns may not exist if migration 002/005 not applied
  const expiringUsers = (expiringUsersRaw.data || []).map((u: Record<string, unknown>) => {
    const expiresAt = u.subscription_expires_at as string | undefined;
    const daysLeft = expiresAt
      ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 86400000))
      : 0;
    return {
      id: u.id as string,
      displayName: (u.display_name as string) || "—",
      tier: (u.subscription_tier as string) || (u.is_premium ? "premium" : "free"),
      expiresAt: expiresAt || "",
      daysLeft,
    };
  });

  // Retention computation
  function computeRetention(
    users: { line_user_id: string; created_at: string }[] | null,
    events: { user_id: string; created_at: string }[] | null,
    days: number
  ): { rate: number; retained: number; eligible: number } {
    const eligible = (users || []).filter((u) => {
      const age = (now.getTime() - new Date(u.created_at).getTime()) / 86400000;
      return age >= days;
    });
    if (eligible.length === 0) return { rate: 0, retained: 0, eligible: 0 };

    const eligibleIds = new Set(eligible.map((u) => u.line_user_id));
    const retained = new Set<string>();

    (events || []).forEach((e) => {
      if (!eligibleIds.has(e.user_id)) return;
      const user = eligible.find((u) => u.line_user_id === e.user_id);
      if (!user) return;
      const daysSinceReg = (new Date(e.created_at).getTime() - new Date(user.created_at).getTime()) / 86400000;
      if (daysSinceReg >= days) retained.add(e.user_id);
    });

    return {
      rate: Math.round((retained.size / eligible.length) * 1000) / 10,
      retained: retained.size,
      eligible: eligible.length,
    };
  }

  const retentionD1 = computeRetention(
    usersRegistered30dAgo.data as { line_user_id: string; created_at: string }[] | null,
    allImageEvents.data as { user_id: string; created_at: string }[] | null,
    1
  );
  const retentionD7 = computeRetention(
    usersRegistered30dAgo.data as { line_user_id: string; created_at: string }[] | null,
    allImageEvents.data as { user_id: string; created_at: string }[] | null,
    7
  );
  const retentionD30 = computeRetention(
    usersRegistered30dAgo.data as { line_user_id: string; created_at: string }[] | null,
    allImageEvents.data as { user_id: string; created_at: string }[] | null,
    30
  );

  // Cost computation
  function sumTokens(rows: { token_count: number }[] | null): number {
    return (rows || []).reduce((sum, r) => sum + (r.token_count || 0), 0);
  }
  function tokensToCost(tokens: number): number {
    return Math.round(tokens * GEMINI_COST_PER_TOKEN * 10000) / 10000;
  }

  const todayTokenTotal = sumTokens(todayTokens.data as { token_count: number }[] | null);
  const monthTokenTotal = sumTokens(monthTokens.data as { token_count: number }[] | null);
  const allTokenTotal = sumTokens(allTokens.data as { token_count: number }[] | null);
  const allCallCount = (allTokens.data || []).length;
  const avgTokensPerCall = allCallCount > 0 ? Math.round(allTokenTotal / allCallCount) : 0;

  // Aggregate distributions
  function countField(rows: Record<string, string>[] | null, field: string): { name: string; value: number }[] {
    const counts: Record<string, number> = {};
    (rows || []).forEach((r) => {
      const val = r[field] || "unknown";
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  // Tier distribution — handle missing subscription_tier by falling back to is_premium
  function computeTierDist(rows: Record<string, unknown>[] | null): { name: string; value: number }[] {
    const counts: Record<string, number> = {};
    (rows || []).forEach((r) => {
      const val = (r.subscription_tier as string)
        || (r.is_premium ? "premium" : "free");
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  return NextResponse.json({
    kpis: {
      totalUsers: totalUsers.count ?? 0,
      totalCards: totalCards.count ?? 0,
      todayUsers: todayUsers.count ?? 0,
      todayCards: todayCards.count ?? 0,
      todayScreenshots: todayScreenshots.count ?? 0,
      errorRate,
      avgLatency,
    },
    timeSeries: {
      dailyUsers,
      dailyCards,
      dailyErrorRate,
    },
    distributions: {
      languages: countField(langDist.data as Record<string, string>[] | null, "target_lang"),
      sourceApps: countField(sourceDist.data as Record<string, string>[] | null, "source_app"),
      tiers: computeTierDist(tierDist.data as Record<string, unknown>[] | null),
    },
    tables: {
      recentErrors: recentErrors.data || [],
    },
    revenue: {
      monthly: monthlyRevenue,
      total: totalRevenue,
      paidUsers: paidUserCount,
      conversionRate,
    },
    expiringUsers,
    retention: {
      d1: retentionD1,
      d7: retentionD7,
      d30: retentionD30,
    },
    apiCost: {
      todayCost: tokensToCost(todayTokenTotal),
      monthlyCost: tokensToCost(monthTokenTotal),
      totalCost: tokensToCost(allTokenTotal),
      todayTokens: todayTokenTotal,
      monthlyTokens: monthTokenTotal,
      totalTokens: allTokenTotal,
      totalCalls: allCallCount,
      avgTokensPerCall,
    },
  });
}
