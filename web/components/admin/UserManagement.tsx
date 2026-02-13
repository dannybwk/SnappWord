"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";

interface UserRow {
  id: string;
  display_name: string;
  line_user_id: string;
  subscription_tier: string | null;
  created_at: string;
  vocab_cards: { count: number }[];
}

const tierLabels: Record<string, string> = {
  free: "免費",
  sprout: "嫩芽",
  bloom: "綻放",
};

const tierOptions = ["free", "sprout", "bloom"] as const;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function truncateId(id: string, len = 10): string {
  return id.length > len ? id.slice(0, len) + "..." : id;
}

export default function UserManagement() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [editingTier, setEditingTier] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveResult, setSaveResult] = useState<Record<string, "ok" | "fail">>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUsers([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q.trim())}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  async function handleSave(userId: string) {
    const tier = editingTier[userId];
    if (!tier) return;

    setSaving((s) => ({ ...s, [userId]: true }));
    setSaveResult((s) => {
      const next = { ...s };
      delete next[userId];
      return next;
    });

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
        setEditingTier((s) => {
          const next = { ...s };
          delete next[userId];
          return next;
        });
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

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-3">用戶管理</h3>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋名稱或 LINE ID..."
          className="w-full sm:w-80 px-4 py-2 rounded-xl border border-mist/60 text-sm text-earth placeholder:text-earth-light/50 focus:outline-none focus:border-seed/50 focus:ring-1 focus:ring-seed/20 transition-colors"
        />
      </div>

      {searching && (
        <div className="text-earth-light text-sm py-4">搜尋中...</div>
      )}

      {!searching && query.trim() && users.length === 0 && (
        <div className="text-earth-light text-sm py-4">找不到符合的用戶</div>
      )}

      {users.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {users.map((u) => {
              const currentTier = editingTier[u.id] ?? (u.subscription_tier || "free");
              const changed = u.id in editingTier;
              const isSaving = saving[u.id];
              const result = saveResult[u.id];

              return (
                <div key={u.id} className="p-3 rounded-xl bg-cloud/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-heading font-bold text-earth text-sm truncate">
                        {u.display_name || "—"}
                      </div>
                      <div className="text-earth-light text-[10px] mt-0.5">
                        {truncateId(u.line_user_id)}
                      </div>
                      <div className="text-earth-light text-xs mt-0.5">
                        {u.vocab_cards?.[0]?.count ?? 0} 張卡片 · {formatDate(u.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={currentTier}
                      onChange={(e) =>
                        setEditingTier((s) => {
                          if (e.target.value === (u.subscription_tier || "free")) {
                            const next = { ...s };
                            delete next[u.id];
                            return next;
                          }
                          return { ...s, [u.id]: e.target.value };
                        })
                      }
                      className="flex-1 px-2 py-1.5 rounded-lg border border-mist/60 text-xs text-earth bg-white focus:outline-none focus:border-seed/50"
                    >
                      {tierOptions.map((t) => (
                        <option key={t} value={t}>
                          {tierLabels[t]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSave(u.id)}
                      disabled={!changed || isSaving}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-seed disabled:opacity-40 disabled:cursor-not-allowed hover:bg-seed-dark transition-colors"
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
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">LINE ID</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">方案</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">卡片數</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">加入日期</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const currentTier = editingTier[u.id] ?? (u.subscription_tier || "free");
                  const changed = u.id in editingTier;
                  const isSaving = saving[u.id];
                  const result = saveResult[u.id];

                  return (
                    <tr key={u.id} className="border-b border-mist/30 hover:bg-cloud/50 transition-colors">
                      <td className="py-2.5 px-2 font-medium text-earth">
                        {u.display_name || "—"}
                      </td>
                      <td className="py-2.5 px-2 text-earth-light text-xs font-mono">
                        {truncateId(u.line_user_id)}
                      </td>
                      <td className="py-2.5 px-2">
                        <select
                          value={currentTier}
                          onChange={(e) =>
                            setEditingTier((s) => {
                              if (e.target.value === (u.subscription_tier || "free")) {
                                const next = { ...s };
                                delete next[u.id];
                                return next;
                              }
                              return { ...s, [u.id]: e.target.value };
                            })
                          }
                          className="px-2 py-1 rounded-lg border border-mist/60 text-xs text-earth bg-white focus:outline-none focus:border-seed/50"
                        >
                          {tierOptions.map((t) => (
                            <option key={t} value={t}>
                              {tierLabels[t]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-2 text-earth-light">
                        {u.vocab_cards?.[0]?.count ?? 0}
                      </td>
                      <td className="py-2.5 px-2 text-earth-light text-xs">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave(u.id)}
                            disabled={!changed || isSaving}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-seed disabled:opacity-40 disabled:cursor-not-allowed hover:bg-seed-dark transition-colors"
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
        </>
      )}
    </div>
  );
}
