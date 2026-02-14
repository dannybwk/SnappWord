"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";

interface EnrichedUser {
  id: string;
  display_name: string | null;
  line_user_id: string;
  subscription_tier: string | null;
  subscription_expires_at: string | null;
  current_streak: number;
  created_at: string;
  card_count: number;
  activity_7d: number;
  last_active: string | null;
  total_tokens: number;
  api_calls: number;
  cost_usd: number;
}

const tierLabels: Record<string, string> = {
  free: "免費",
  sprout: "🌱 嫩芽",
  bloom: "🌸 綻放",
};

const tierColors: Record<string, string> = {
  free: "bg-cloud text-earth-light",
  sprout: "bg-green-50 text-green-700",
  bloom: "bg-purple-50 text-purple-700",
};

const tierOptions = ["free", "sprout", "bloom"] as const;

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return `${Math.floor(days / 30)} 個月前`;
}

function activityLevel(count7d: number): { label: string; color: string } {
  if (count7d === 0) return { label: "沈默", color: "text-earth-light/50" };
  if (count7d <= 3) return { label: "低", color: "text-earth-light" };
  if (count7d <= 10) return { label: "中", color: "text-sun" };
  if (count7d <= 30) return { label: "高", color: "text-seed" };
  return { label: "超高", color: "text-bloom" };
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0";
  if (usd < 0.01) return "<$0.01";
  return `$${usd.toFixed(2)}`;
}

export default function UserManagement() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveResult, setSaveResult] = useState<Record<string, "ok" | "fail">>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFetchDone = useRef(false);
  const limit = 50;

  const fetchUsers = useCallback(async (q: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("未登入或 session 已過期");
        return;
      }

      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `API 錯誤 (${res.status})`);
        return;
      }

      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search — also handles initial load
  useEffect(() => {
    // On mount (first render), fetch immediately without delay
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      setPage(1);
      fetchUsers(query, 1);
      return;
    }

    // Subsequent query changes are debounced
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(query, 1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchUsers]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers(query, newPage);
  };

  async function handleSave(userId: string) {
    const tier = editingTier[userId];
    if (!tier) return;

    setSaving((s) => ({ ...s, [userId]: true }));
    setSaveResult((s) => { const next = { ...s }; delete next[userId]; return next; });

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, tier }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, subscription_tier: tier } : u
          )
        );
        setEditingTier((s) => { const next = { ...s }; delete next[userId]; return next; });
        setSaveResult((s) => ({ ...s, [userId]: "ok" }));
      } else {
        setSaveResult((s) => ({ ...s, [userId]: "fail" }));
      }
    } catch {
      setSaveResult((s) => ({ ...s, [userId]: "fail" }));
    } finally {
      setSaving((s) => ({ ...s, [userId]: false }));
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      {/* Header with search and count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-heading font-bold text-sm text-earth">所有用戶</h3>
          <span className="text-earth-light text-xs bg-cloud/80 px-2 py-0.5 rounded-full">
            共 {total} 人
          </span>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋名稱或 LINE ID..."
          className="w-full sm:w-72 px-4 py-2 rounded-xl border border-mist/60 text-sm text-earth
            placeholder:text-earth-light/50 focus:outline-none focus:border-seed/50 focus:ring-1
            focus:ring-seed/20 transition-colors"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm py-4 text-center bg-red-50 rounded-xl mb-3">
          <div className="font-medium">載入失敗</div>
          <div className="text-red-400 text-xs mt-1">{error}</div>
          <button
            onClick={() => fetchUsers(query, page)}
            className="mt-2 px-3 py-1 rounded-lg text-xs font-medium text-white bg-red-400 hover:bg-red-500 transition-colors"
          >
            重試
          </button>
        </div>
      )}

      {!error && loading && users.length === 0 && (
        <div className="text-earth-light text-sm py-8 text-center">載入用戶中...</div>
      )}

      {!error && !loading && users.length === 0 && (
        <div className="text-earth-light text-sm py-8 text-center">
          {query.trim() ? "找不到符合的用戶" : "尚無用戶"}
        </div>
      )}

      {users.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {users.map((u) => {
              const tier = u.subscription_tier || "free";
              const activity = activityLevel(u.activity_7d);
              const currentTier = editingTier[u.id] ?? tier;
              const changed = u.id in editingTier;
              const isSaving = saving[u.id];
              const result = saveResult[u.id];

              return (
                <div key={u.id} className="p-3 rounded-xl bg-cloud/50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-heading font-bold text-earth text-sm truncate">
                        {u.display_name || "—"}
                      </div>
                      <div className="text-earth-light text-[10px]">
                        加入 {formatDateTime(u.created_at)}
                      </div>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${tierColors[tier]}`}>
                      {tierLabels[tier]}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-earth-light/70">卡片</div>
                      <div className="font-medium text-earth">{u.card_count}</div>
                    </div>
                    <div>
                      <div className="text-earth-light/70">活躍度</div>
                      <div className={`font-medium ${activity.color}`}>{activity.label}</div>
                    </div>
                    <div>
                      <div className="text-earth-light/70">成本</div>
                      <div className="font-medium text-earth">{formatCost(u.cost_usd)}</div>
                    </div>
                  </div>

                  {u.subscription_expires_at && tier !== "free" && (
                    <div className="text-[10px] text-earth-light/70">
                      到期 {formatDate(u.subscription_expires_at)}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <select
                      value={currentTier}
                      onChange={(e) =>
                        setEditingTier((s) => {
                          if (e.target.value === tier) {
                            const next = { ...s }; delete next[u.id]; return next;
                          }
                          return { ...s, [u.id]: e.target.value };
                        })
                      }
                      className="flex-1 px-2 py-1.5 rounded-lg border border-mist/60 text-xs text-earth bg-white focus:outline-none focus:border-seed/50"
                    >
                      {tierOptions.map((t) => (
                        <option key={t} value={t}>{tierLabels[t]}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSave(u.id)}
                      disabled={!changed || isSaving}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-seed
                        disabled:opacity-40 disabled:cursor-not-allowed hover:bg-seed-dark transition-colors"
                    >
                      {isSaving ? "..." : "儲存"}
                    </button>
                    {result === "ok" && <span className="text-seed text-xs">✓</span>}
                    {result === "fail" && <span className="text-red-500 text-xs">✗</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist/50">
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">名稱</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">加入日期</th>
                  <th className="text-right py-2 px-2 text-earth-light font-medium text-xs">卡片數</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">活躍度</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">最後活動</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">方案</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">到期日</th>
                  <th className="text-right py-2 px-2 text-earth-light font-medium text-xs">成本</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const tier = u.subscription_tier || "free";
                  const activity = activityLevel(u.activity_7d);
                  const currentTier = editingTier[u.id] ?? tier;
                  const changed = u.id in editingTier;
                  const isSaving = saving[u.id];
                  const result = saveResult[u.id];

                  return (
                    <tr key={u.id} className="border-b border-mist/30 hover:bg-cloud/50 transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="font-medium text-earth">{u.display_name || "—"}</div>
                        {u.current_streak > 0 && (
                          <span className="text-[10px] text-orange-500">🔥 {u.current_streak} 天</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-earth-light text-xs whitespace-nowrap">
                        {formatDateTime(u.created_at)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-medium text-earth tabular-nums">
                        {u.card_count}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`font-medium text-xs ${activity.color}`}>
                          {activity.label}
                        </span>
                        <span className="text-earth-light/50 text-[10px] ml-1">
                          ({u.activity_7d}/7d)
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-earth-light text-xs whitespace-nowrap">
                        {timeAgo(u.last_active)}
                      </td>
                      <td className="py-2.5 px-2">
                        <select
                          value={currentTier}
                          onChange={(e) =>
                            setEditingTier((s) => {
                              if (e.target.value === tier) {
                                const next = { ...s }; delete next[u.id]; return next;
                              }
                              return { ...s, [u.id]: e.target.value };
                            })
                          }
                          className="px-2 py-1 rounded-lg border border-mist/60 text-xs text-earth bg-white focus:outline-none focus:border-seed/50"
                        >
                          {tierOptions.map((t) => (
                            <option key={t} value={t}>{tierLabels[t]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-2 text-earth-light text-xs whitespace-nowrap">
                        {tier !== "free" && u.subscription_expires_at
                          ? formatDate(u.subscription_expires_at)
                          : "—"}
                      </td>
                      <td className="py-2.5 px-2 text-right font-medium text-earth text-xs tabular-nums whitespace-nowrap">
                        {formatCost(u.cost_usd)}
                        {u.api_calls > 0 && (
                          <span className="text-earth-light/50 ml-1">
                            ({u.api_calls} 次)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSave(u.id)}
                            disabled={!changed || isSaving}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-seed
                              disabled:opacity-40 disabled:cursor-not-allowed hover:bg-seed-dark transition-colors"
                          >
                            {isSaving ? "..." : "儲存"}
                          </button>
                          {result === "ok" && <span className="text-seed text-xs">✓</span>}
                          {result === "fail" && <span className="text-red-500 text-xs">✗</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-mist/30">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-earth-light
                  hover:text-earth hover:bg-cloud disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← 上一頁
              </button>
              <span className="text-earth-light text-xs">
                第 {page} / {totalPages} 頁
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-earth-light
                  hover:text-earth hover:bg-cloud disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                下一頁 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
