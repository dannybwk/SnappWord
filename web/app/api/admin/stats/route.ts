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

export async function GET(request: NextRequest) {
  // Verify Supabase token + email whitelist
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

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
    recentUsers,
    recentErrors,
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

    // Distributions
    sb.from("vocab_cards").select("target_lang"),
    sb.from("vocab_cards").select("source_app"),
    sb.from("users").select("subscription_tier"),

    // Tables
    sb.from("users").select("*, vocab_cards(count)").order("created_at", { ascending: false }).limit(20),
    sb.from("api_logs").select("*, users(display_name)").eq("event_type", "parse_fail").order("created_at", { ascending: false }).limit(20),
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
      tiers: countField(tierDist.data as Record<string, string>[] | null, "subscription_tier"),
    },
    tables: {
      recentUsers: recentUsers.data || [],
      recentErrors: recentErrors.data || [],
    },
  });
}
