"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

interface UpgradeRequestRow {
  id: string;
  user_id: string;
  payment_image_url: string | null;
  status: string;
  approved_tier: string | null;
  created_at: string;
  reviewed_at: string | null;
  users: {
    display_name: string;
    subscription_tier: string | null;
    subscription_expires_at: string | null;
  };
}

const tierLabels: Record<string, string> = {
  free: "免費",
  sprout: "嫩芽",
  bloom: "綻放",
};

const tierOptions = ["sprout", "bloom"] as const;

const statusLabels: Record<string, string> = {
  waiting_image: "等待截圖",
  pending: "待審核",
  approved: "已核准",
  rejected: "已拒絕",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatExpiry(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function UpgradeRequests() {
  const [requests, setRequests] = useState<UpgradeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<Record<string, string>>({});
  const [selectedMonths, setSelectedMonths] = useState<Record<string, number>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<Record<string, "ok" | "fail">>({});
  const [imageModal, setImageModal] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/admin/upgrade-requests?status=pending", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleReview(requestId: string, action: "approve" | "reject") {
    setProcessing((s) => ({ ...s, [requestId]: true }));
    setResult((s) => {
      const next = { ...s };
      delete next[requestId];
      return next;
    });

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const body: Record<string, string | number> = { requestId, action };
      if (action === "approve") {
        body.tier = selectedTier[requestId] || "sprout";
        body.months = selectedMonths[requestId] || 1;
      }

      const res = await fetch("/api/admin/upgrade-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setResult((s) => ({ ...s, [requestId]: "ok" }));
        setTimeout(() => {
          setRequests((prev) => prev.filter((r) => r.id !== requestId));
        }, 1000);
      } else {
        setResult((s) => ({ ...s, [requestId]: "fail" }));
      }
    } catch {
      setResult((s) => ({ ...s, [requestId]: "fail" }));
    } finally {
      setProcessing((s) => ({ ...s, [requestId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
        <h3 className="font-heading font-bold text-sm text-earth mb-3">升級申請</h3>
        <div className="text-earth-light text-sm py-4">載入中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-heading font-bold text-sm text-earth">升級申請</h3>
        {requests.length > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
            {requests.length}
          </span>
        )}
      </div>

      {requests.length === 0 && (
        <div className="text-earth-light text-sm py-4">沒有待審核的升級申請</div>
      )}

      {requests.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {requests.map((r) => {
              const isProcessing = processing[r.id];
              const res = result[r.id];

              return (
                <div key={r.id} className="p-3 rounded-xl bg-cloud/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-heading font-bold text-earth text-sm truncate">
                        {r.users?.display_name || "—"}
                      </div>
                      <div className="text-earth-light text-xs mt-0.5">
                        目前方案：{tierLabels[r.users?.subscription_tier || "free"] || "免費"}
                      </div>
                      {r.users?.subscription_expires_at && (
                        <div className="text-earth-light text-[10px] mt-0.5">
                          到期：{formatExpiry(r.users.subscription_expires_at)}
                        </div>
                      )}
                      <div className="text-earth-light text-[10px] mt-0.5">
                        申請：{formatDate(r.created_at)}
                      </div>
                    </div>
                    {r.payment_image_url && (
                      <button
                        onClick={() => setImageModal(r.payment_image_url)}
                        className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-mist/60"
                      >
                        <img
                          src={r.payment_image_url}
                          alt="付款截圖"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <select
                      value={selectedTier[r.id] || "sprout"}
                      onChange={(e) =>
                        setSelectedTier((s) => ({ ...s, [r.id]: e.target.value }))
                      }
                      className="px-2 py-1.5 rounded-lg border border-mist/60 text-xs text-earth bg-white focus:outline-none focus:border-seed/50"
                    >
                      {tierOptions.map((t) => (
                        <option key={t} value={t}>
                          {tierLabels[t]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedMonths[r.id] || 1}
                      onChange={(e) =>
                        setSelectedMonths((s) => ({ ...s, [r.id]: Number(e.target.value) }))
                      }
                      className="px-2 py-1.5 rounded-lg border border-mist/60 text-xs text-earth bg-white focus:outline-none focus:border-seed/50"
                    >
                      {[1, 2, 3, 6, 12].map((m) => (
                        <option key={m} value={m}>
                          {m} 個月
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleReview(r.id, "approve")}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-seed disabled:opacity-40 hover:bg-seed-dark transition-colors"
                    >
                      {isProcessing ? "..." : "核准"}
                    </button>
                    <button
                      onClick={() => handleReview(r.id, "reject")}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 disabled:opacity-40 hover:bg-red-100 transition-colors"
                    >
                      拒絕
                    </button>
                    {res === "ok" && <span className="text-seed text-xs">✓</span>}
                    {res === "fail" && <span className="text-red-500 text-xs">✗</span>}
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
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">用戶</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">目前方案</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">到期日</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">截圖</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">申請時間</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">升級至</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">月數</th>
                  <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">操作</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const isProcessing = processing[r.id];
                  const res = result[r.id];

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-mist/30 hover:bg-cloud/50 transition-colors"
                    >
                      <td className="py-2.5 px-2 font-medium text-earth">
                        {r.users?.display_name || "—"}
                      </td>
                      <td className="py-2.5 px-2 text-earth-light text-xs">
                        {tierLabels[r.users?.subscription_tier || "free"] || "免費"}
                      </td>
                      <td className="py-2.5 px-2 text-earth-light text-xs">
                        {formatExpiry(r.users?.subscription_expires_at)}
                      </td>
                      <td className="py-2.5 px-2">
                        {r.payment_image_url ? (
                          <button
                            onClick={() => setImageModal(r.payment_image_url)}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-mist/60 hover:border-seed/50 transition-colors"
                          >
                            <img
                              src={r.payment_image_url}
                              alt="付款截圖"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <span className="text-earth-light text-xs">
                            {statusLabels[r.status] || r.status}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-earth-light text-xs">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="py-2.5 px-2">
                        <select
                          value={selectedTier[r.id] || "sprout"}
                          onChange={(e) =>
                            setSelectedTier((s) => ({ ...s, [r.id]: e.target.value }))
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
                      <td className="py-2.5 px-2">
                        <select
                          value={selectedMonths[r.id] || 1}
                          onChange={(e) =>
                            setSelectedMonths((s) => ({
                              ...s,
                              [r.id]: Number(e.target.value),
                            }))
                          }
                          className="px-2 py-1 rounded-lg border border-mist/60 text-xs text-earth bg-white focus:outline-none focus:border-seed/50"
                        >
                          {[1, 2, 3, 6, 12].map((m) => (
                            <option key={m} value={m}>
                              {m} 個月
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReview(r.id, "approve")}
                            disabled={isProcessing}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-seed disabled:opacity-40 hover:bg-seed-dark transition-colors"
                          >
                            {isProcessing ? "..." : "核准"}
                          </button>
                          <button
                            onClick={() => handleReview(r.id, "reject")}
                            disabled={isProcessing}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-red-500 bg-red-50 disabled:opacity-40 hover:bg-red-100 transition-colors"
                          >
                            拒絕
                          </button>
                          {res === "ok" && <span className="text-seed text-xs">✓</span>}
                          {res === "fail" && <span className="text-red-500 text-xs">✗</span>}
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

      {/* Image modal */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <div
            className="max-w-lg max-h-[80vh] bg-white rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageModal}
              alt="付款截圖"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
