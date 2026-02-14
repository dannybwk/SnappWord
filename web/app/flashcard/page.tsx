"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import FlashcardDeck, { type FlashcardData } from "@/components/flashcard/FlashcardDeck";
import FlashcardSummary from "@/components/flashcard/FlashcardSummary";
import StreakBadge from "@/components/dashboard/StreakBadge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { LeafDoodle } from "@/components/ui/DoodleSVG";

type PageState = "loading" | "empty" | "limit_reached" | "playing" | "finished";

export default function FlashcardPage() {
  const { user } = useAuth();
  const [state, setState] = useState<PageState>("loading");
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [current, setCurrent] = useState(0);
  const [known, setKnown] = useState(0);
  const [forgot, setForgot] = useState(0);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!user?.dbUserId) return;

    async function fetchDeck() {
      try {
        const res = await fetch(`/api/flashcard?userId=${user!.dbUserId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        setStreak(data.streak);
        setRemaining(data.remaining);

        if (data.limitReached) {
          setState("limit_reached");
        } else if (!data.cards || data.cards.length === 0) {
          setState("empty");
        } else {
          setCards(data.cards as FlashcardData[]);
          setState("playing");
        }
      } catch {
        setState("empty");
      }
    }

    fetchDeck();
  }, [user?.dbUserId]);

  const handleAnswer = useCallback(
    async (cardId: string, isKnown: boolean) => {
      if (isKnown) {
        setKnown((k) => k + 1);
      } else {
        setForgot((f) => f + 1);
      }

      // Fire and forget — don't block UI
      fetch("/api/flashcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.dbUserId,
          cardId,
          known: isKnown,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.streak) setStreak(data.streak);
        })
        .catch(() => {});

      const next = current + 1;
      if (next >= cards.length) {
        setState("finished");
      } else {
        setCurrent(next);
      }
    },
    [current, cards.length, user?.dbUserId]
  );

  // Loading
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud">
        <div className="text-center space-y-3">
          <LeafDoodle className="text-seed w-10 h-10 mx-auto animate-pulse" />
          <p className="text-earth-light text-sm">載入卡片中...</p>
        </div>
      </div>
    );
  }

  // Empty
  if (state === "empty") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-sm"
        >
          <div className="text-6xl">🎉</div>
          <h1 className="font-heading font-extrabold text-2xl text-earth">
            今天都複習完了！
          </h1>
          <StreakBadge
            currentStreak={streak.current_streak}
            longestStreak={streak.longest_streak}
          />
          <p className="text-earth-light">
            明天會有新的卡片等你複習，保持每天學習的好習慣！
          </p>
          <Link href="/dashboard">
            <Button variant="primary" icon={<span>🏠</span>}>
              回到首頁
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Limit reached
  if (state === "limit_reached") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-sm"
        >
          <div className="text-6xl">🔒</div>
          <h1 className="font-heading font-extrabold text-2xl text-earth">
            今日免費額度已用完
          </h1>
          <p className="text-earth-light">
            免費版每天可複習 10 張卡片，升級後無限複習！
          </p>
          <StreakBadge
            currentStreak={streak.current_streak}
            longestStreak={streak.longest_streak}
          />
          <div className="flex flex-col gap-3">
            <Link href="/pricing">
              <Button variant="primary" fullWidth icon={<span>💎</span>}>
                升級方案
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" fullWidth>
                回到首頁
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Finished
  if (state === "finished") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud p-4">
        <FlashcardSummary known={known} forgot={forgot} streak={streak} />
      </div>
    );
  }

  // Playing
  return (
    <div className="min-h-screen bg-cloud flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-mist/50">
        <Link href="/dashboard" className="text-earth-light hover:text-earth transition-colors">
          ← 返回
        </Link>
        <h1 className="font-heading font-bold text-earth">翻卡複習</h1>
        <StreakBadge
          currentStreak={streak.current_streak}
          longestStreak={streak.longest_streak}
        />
      </header>

      {/* Deck */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <FlashcardDeck
            cards={cards}
            onAnswer={handleAnswer}
            current={current}
          />
          {remaining !== Infinity && remaining > 0 && (
            <p className="text-center text-earth-light/60 text-xs mt-4">
              今日剩餘 {remaining - (current + 1) > 0 ? remaining - (current + 1) : 0} 張免費額度
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
