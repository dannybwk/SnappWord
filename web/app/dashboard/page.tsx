"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import ReviewQueue from "@/components/dashboard/ReviewQueue";
import { WeeklyChart, LanguagePieChart, MasteryRing } from "@/components/dashboard/StatsCharts";
import VocabTable from "@/components/dashboard/VocabTable";
import ExportPanel from "@/components/dashboard/ExportPanel";
import Button from "@/components/ui/Button";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.dbUserId) return;

    async function fetchCards() {
      try {
        const res = await fetch(`/api/vocab?userId=${user!.dbUserId}`);
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards || []);
        }
      } catch {
        // fallback to empty
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [user?.dbUserId]);

  const totalWords = cards.length;
  const dueForReview = cards.filter((c) => c.review_status < 2).length;
  const displayName = user?.displayName || "學習者";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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
          </div>
          <Link href="/quiz">
            <Button size="md" icon={<span>🎯</span>}>
              開始複習
            </Button>
          </Link>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <WeeklyChart cards={cards} />
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
