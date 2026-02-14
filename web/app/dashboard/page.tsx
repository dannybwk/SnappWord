"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import ReviewQueue from "@/components/dashboard/ReviewQueue";
import { WeeklyChart, LanguagePieChart, MasteryRing } from "@/components/dashboard/StatsCharts";
import VocabTable from "@/components/dashboard/VocabTable";
import ExportPanel from "@/components/dashboard/ExportPanel";
import Button from "@/components/ui/Button";
import StreakBadge from "@/components/dashboard/StreakBadge";
import Link from "next/link";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "早安";
  if (hour < 18) return "午安";
  return "晚安";
}

export interface VocabCard {
  id: string;
  user_id: string;
  word: string;
  translation: string;
  pronunciation: string;
  original_sentence: string;
  context_trans: string;
  ai_example: string;
  image_url: string;
  source_app: string;
  target_lang: string;
  tags: string[];
  review_status: number; // 0=New, 1=Learning, 2=Mastered
  next_review_at: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const greeting = getGreeting();
  const { user } = useAuth();
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [quota, setQuota] = useState<{ used: number; limit: number; tier?: string; expiresAt?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });

  useEffect(() => {
    if (!user?.dbUserId) return;

    async function fetchCards() {
      try {
        const res = await fetch(`/api/vocab?userId=${user!.dbUserId}`);
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards || []);
          if (data.quota) setQuota(data.quota);
        }
      } catch {
        // fallback to empty
      } finally {
        setLoading(false);
      }
    }

    async function fetchStreak() {
      try {
        const res = await fetch(`/api/flashcard?userId=${user!.dbUserId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.streak) setStreak(data.streak);
        }
      } catch {
        // ignore
      }
    }

    fetchCards();
    fetchStreak();
  }, [user?.dbUserId]);

  const totalWords = cards.length;
  const now = Date.now();
  const dueForReview = cards.filter((c) => {
    if (c.review_status === 0) return true;
    if (c.next_review_at && new Date(c.next_review_at).getTime() <= now) return true;
    return false;
  }).length;
  const displayName = user?.displayName || "學習者";

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Greeting header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-sprout-light to-sky-light rounded-3xl p-6 md:p-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-earth">
              🌿 {greeting}，{displayName}！
            </h1>
            <p className="text-earth-light mt-1">
              {loading ? (
                "載入中..."
              ) : totalWords === 0 ? (
                "還沒有單字，快去 LINE 傳截圖吧！"
              ) : (
                <>
                  你已經收集了{" "}
                  <span className="font-bold text-seed">{totalWords}</span> 個單字
                  {dueForReview > 0 && (
                    <>
                      ，有{" "}
                      <span className="font-bold text-bloom">{dueForReview}</span>{" "}
                      個單字待複習
                    </>
                  )}
                </>
              )}
            </p>
            {quota && !loading && (
              <>
                <p className="text-earth-light/80 text-sm mt-1">
                  📸 本月截圖額度：{quota.used}/{quota.limit === Infinity ? "∞" : quota.limit}
                  {quota.tier && quota.tier !== "free" && (
                    <span className="text-seed font-bold ml-2">
                      {quota.tier === "sprout" ? "🌱 嫩芽" : "🌸 綻放"}
                    </span>
                  )}
                  {quota.limit !== Infinity && quota.used >= quota.limit && (
                    <Link href="/pricing" className="text-bloom font-bold ml-2 hover:underline">
                      升級方案 →
                    </Link>
                  )}
                </p>
                {quota.expiresAt && quota.tier && quota.tier !== "free" && (
                  <p className="text-earth-light/80 text-sm mt-0.5">
                    📅 方案到期日：{new Date(quota.expiresAt).getFullYear()}/{new Date(quota.expiresAt).getMonth() + 1}/{new Date(quota.expiresAt).getDate()}
                    {(() => {
                      const daysLeft = Math.ceil((new Date(quota.expiresAt).getTime() - Date.now()) / 86400000);
                      if (daysLeft <= 0) return <span className="text-red-500 font-bold ml-2">已過期</span>;
                      if (daysLeft <= 7) return <span className="text-bloom font-bold ml-2">剩 {daysLeft} 天</span>;
                      return null;
                    })()}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StreakBadge
              currentStreak={streak.current_streak}
              longestStreak={streak.longest_streak}
            />
            <Link href="/flashcard">
              <Button size="md" icon={<span>🃏</span>}>
                開始複習
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Review queue */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3 flex items-center gap-2">
          <span className="text-bloom">🔥</span> 待複習
        </h2>
        <ReviewQueue cards={cards} loading={loading} />
      </section>

      {/* Stats */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3 flex items-center gap-2">
          <span className="text-sky">📊</span> 學習統計
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="col-span-2 lg:col-span-1">
            <WeeklyChart cards={cards} />
          </div>
          <LanguagePieChart cards={cards} />
          <MasteryRing cards={cards} />
        </div>
      </section>

      {/* Vocab table */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3 flex items-center gap-2">
          <span className="text-seed">📚</span> 我的單字
        </h2>
        <VocabTable cards={cards} loading={loading} />
      </section>

      {/* Export */}
      <section className="max-w-sm">
        <h2 className="font-heading font-bold text-lg text-earth mb-3 flex items-center gap-2">
          <span className="text-sun">📦</span> 匯出
        </h2>
        <ExportPanel cards={cards} />
      </section>
    </div>
  );
}
