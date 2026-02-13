"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import KpiCards from "@/components/admin/KpiCards";
import RevenueCards from "@/components/admin/RevenueCards";
import ExpiringUsersTable from "@/components/admin/ExpiringUsersTable";
import RetentionCards from "@/components/admin/RetentionCards";
import { UserGrowthChart, DailyCardsChart, ErrorRateChart } from "@/components/admin/TimeSeriesCharts";
import DistributionCharts from "@/components/admin/DistributionCharts";
import AdminTables from "@/components/admin/AdminTables";
import UserManagement from "@/components/admin/UserManagement";
import UpgradeRequests from "@/components/admin/UpgradeRequests";

interface StatsData {
  kpis: {
    totalUsers: number;
    totalCards: number;
    todayUsers: number;
    todayCards: number;
    todayScreenshots: number;
    errorRate: number;
    avgLatency: number;
  };
  timeSeries: {
    dailyUsers: { date: string; count: number }[];
    dailyCards: { date: string; count: number }[];
    dailyErrorRate: { date: string; rate: number }[];
  };
  distributions: {
    languages: { name: string; value: number }[];
    sourceApps: { name: string; value: number }[];
    tiers: { name: string; value: number }[];
  };
  tables: {
    recentUsers: never[];
    recentErrors: never[];
  };
  revenue: {
    monthly: number;
    total: number;
    paidUsers: number;
    conversionRate: number;
  };
  expiringUsers: {
    id: string;
    displayName: string;
    tier: string;
    expiresAt: string;
    daysLeft: number;
  }[];
  retention: {
    d1: { rate: number; retained: number; eligible: number };
    d7: { rate: number; retained: number; eligible: number };
    d30: { rate: number; retained: number; eligible: number };
  };
}

export default function AdminPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("未登入");
        return;
      }

      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load stats");
      setData(await res.json());
    }

    load().catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-mist/60 p-8 text-center text-red-500 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-mist/60 p-8 text-center text-earth-light text-sm">
          載入統計資料中...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl text-earth">
          營運儀表板
        </h1>
        <p className="text-earth-light text-sm mt-1">SnappWord 管理後台總覽</p>
      </div>

      {/* KPI Cards */}
      <section>
        <KpiCards data={data.kpis} />
      </section>

      {/* Revenue */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3">營收總覽</h2>
        <RevenueCards data={data.revenue} />
      </section>

      {/* Expiring Users */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3">即將到期用戶</h2>
        <ExpiringUsersTable users={data.expiringUsers} />
      </section>

      {/* Retention */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3">留存率</h2>
        <RetentionCards data={data.retention} />
      </section>

      {/* User Management */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3">用戶管理</h2>
        <UserManagement />
      </section>

      {/* Upgrade Requests */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3">升級申請</h2>
        <UpgradeRequests />
      </section>

      {/* Time Series */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3">趨勢</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UserGrowthChart data={data.timeSeries.dailyUsers} />
          <DailyCardsChart data={data.timeSeries.dailyCards} />
          <ErrorRateChart data={data.timeSeries.dailyErrorRate} />
        </div>
      </section>

      {/* Distributions */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3">分佈</h2>
        <DistributionCharts
          languages={data.distributions.languages}
          sourceApps={data.distributions.sourceApps}
          tiers={data.distributions.tiers}
        />
      </section>

      {/* Tables */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3">資料</h2>
        <AdminTables
          recentUsers={data.tables.recentUsers}
          recentErrors={data.tables.recentErrors}
        />
      </section>
    </div>
  );
}
