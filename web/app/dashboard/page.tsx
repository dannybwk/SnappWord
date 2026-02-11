"use client";

import { motion } from "framer-motion";
import { dashboardUser } from "@/lib/constants";
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

export default function DashboardPage() {
  const greeting = getGreeting();

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
              🌿 {greeting}，{dashboardUser.name}！
            </h1>
            <p className="text-earth-light mt-1">
              你已經收集了 <span className="font-bold text-seed">{dashboardUser.totalWords}</span> 個單字
              {dashboardUser.dueForReview > 0 && (
                <>
                  ，今天有{" "}
                  <span className="font-bold text-bloom">{dashboardUser.dueForReview}</span>{" "}
                  個單字需要複習
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
        <ReviewQueue />
      </section>

      {/* Stats */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3 flex items-center gap-2">
          <span className="text-sky">📊</span> 學習統計
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <WeeklyChart />
          <LanguagePieChart />
          <MasteryRing />
        </div>
      </section>

      {/* Vocab table */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3 flex items-center gap-2">
          <span className="text-seed">📚</span> 我的單字
        </h2>
        <VocabTable />
      </section>

      {/* Export */}
      <section className="max-w-sm">
        <h2 className="font-heading font-bold text-lg text-earth mb-3 flex items-center gap-2">
          <span className="text-sun">📦</span> 匯出
        </h2>
        <ExportPanel />
      </section>
    </div>
  );
}
