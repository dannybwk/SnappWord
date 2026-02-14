"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import Button from "@/components/ui/Button";
import TtsButton from "@/components/ui/TtsButton";
import Link from "next/link";
import { LeafDoodle } from "@/components/ui/DoodleSVG";

interface WordList {
  id: string;
  name: string;
  emoji: string;
  card_count: number;
}

interface LanguageGroup {
  lang: string;
  count: number;
}

interface VocabCard {
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  target_lang: string;
  review_status: number;
  list_id: string | null;
}

const LANG_EMOJI: Record<string, string> = {
  en: "🇬🇧",
  ja: "🇯🇵",
  ko: "🇰🇷",
  zh: "🇨🇳",
  fr: "🇫🇷",
  de: "🇩🇪",
  es: "🇪🇸",
  pt: "🇧🇷",
  it: "🇮🇹",
  th: "🇹🇭",
  vi: "🇻🇳",
};

const LANG_NAME: Record<string, string> = {
  en: "English",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
  it: "Italiano",
  th: "ภาษาไทย",
  vi: "Tiếng Việt",
};

const EMOJI_OPTIONS = ["📁", "📗", "📘", "📕", "🎯", "⭐", "💼", "🎓", "🎬", "🍽️", "✈️", "💻"];

export default function WordListsPage() {
  const { user } = useAuth();
  const [lists, setLists] = useState<WordList[]>([]);
  const [languageGroups, setLanguageGroups] = useState<LanguageGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Expanded section state
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<VocabCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  const fetchLists = useCallback(async () => {
    if (!user?.dbUserId) return;
    try {
      const res = await fetch(`/api/word-lists?userId=${user.dbUserId}`);
      if (res.ok) {
        const data = await res.json();
        setLists(data.lists || []);
        setLanguageGroups(data.languageGroups || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user?.dbUserId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleCreate = async () => {
    if (!newName.trim() || !user?.dbUserId) return;
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/word-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.dbUserId,
          name: newName.trim(),
          emoji: newEmoji,
        }),
      });

      if (res.status === 403) {
        setError("免費用戶最多建立 3 個自訂清單，升級即可解鎖無限清單");
        return;
      }

      if (res.ok) {
        setShowModal(false);
        setNewName("");
        setNewEmoji("📁");
        fetchLists();
      }
    } catch {
      setError("建立失敗，請稍後再試");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (listId: string) => {
    if (!user?.dbUserId || !confirm("確定要刪除這個清單嗎？清單內的卡片不會被刪除。")) return;

    try {
      await fetch("/api/word-lists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.dbUserId, listId }),
      });
      fetchLists();
      if (expandedList === listId) {
        setExpandedList(null);
        setExpandedCards([]);
      }
    } catch {
      // ignore
    }
  };

  const loadCardsForLang = async (lang: string) => {
    if (expandedLang === lang) {
      setExpandedLang(null);
      setExpandedCards([]);
      return;
    }
    setExpandedLang(lang);
    setExpandedList(null);
    setLoadingCards(true);

    try {
      const res = await fetch(`/api/vocab?userId=${user!.dbUserId}`);
      if (res.ok) {
        const data = await res.json();
        setExpandedCards(
          (data.cards || []).filter((c: VocabCard) => c.target_lang === lang)
        );
      }
    } catch {
      setExpandedCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  const loadCardsForList = async (listId: string) => {
    if (expandedList === listId) {
      setExpandedList(null);
      setExpandedCards([]);
      return;
    }
    setExpandedList(listId);
    setExpandedLang(null);
    setLoadingCards(true);

    try {
      const res = await fetch(`/api/vocab?userId=${user!.dbUserId}`);
      if (res.ok) {
        const data = await res.json();
        setExpandedCards(
          (data.cards || []).filter((c: VocabCard) => c.list_id === listId)
        );
      }
    } catch {
      setExpandedCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud">
        <div className="text-center space-y-3">
          <LeafDoodle className="text-seed w-10 h-10 mx-auto animate-pulse" />
          <p className="text-earth-light text-sm">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-extrabold text-2xl text-earth flex items-center gap-2">
          📚 單字本
        </h1>
        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          icon={<span>+</span>}
        >
          新增清單
        </Button>
      </div>

      {/* Language groups (auto) */}
      {languageGroups.length > 0 && (
        <section>
          <h2 className="font-heading font-bold text-lg text-earth mb-3">
            依語言分類
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {languageGroups.map((g) => (
              <div key={g.lang}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => loadCardsForLang(g.lang)}
                  className={`w-full p-4 rounded-2xl border text-left transition-colors
                    ${expandedLang === g.lang
                      ? "bg-sprout-light border-seed"
                      : "bg-white border-mist/50 hover:border-seed/30"
                    }`}
                >
                  <div className="text-2xl mb-1">
                    {LANG_EMOJI[g.lang] || "🌐"}
                  </div>
                  <div className="font-medium text-earth text-sm">
                    {LANG_NAME[g.lang] || g.lang}
                  </div>
                  <div className="text-earth-light text-xs">
                    {g.count} 張卡片
                  </div>
                </motion.button>

                {/* Expanded card list for this language */}
                <AnimatePresence>
                  {expandedLang === g.lang && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="col-span-full overflow-hidden"
                    >
                      <CardList cards={expandedCards} loading={loadingCards} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Custom lists */}
      <section>
        <h2 className="font-heading font-bold text-lg text-earth mb-3">
          自訂清單
        </h2>
        {lists.length === 0 ? (
          <div className="text-center py-8 text-earth-light">
            <p>還沒有自訂清單</p>
            <p className="text-sm mt-1">點擊上方按鈕建立第一個清單</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {lists.map((list) => (
              <div key={list.id}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-2xl border transition-colors relative group
                    ${expandedList === list.id
                      ? "bg-sprout-light border-seed"
                      : "bg-white border-mist/50 hover:border-seed/30"
                    }`}
                >
                  <button
                    onClick={() => loadCardsForList(list.id)}
                    className="w-full text-left"
                  >
                    <div className="text-2xl mb-1">{list.emoji}</div>
                    <div className="font-medium text-earth text-sm">
                      {list.name}
                    </div>
                    <div className="text-earth-light text-xs">
                      {list.card_count ?? 0} 張卡片
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 text-bloom text-xs
                      opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="刪除清單"
                  >
                    ✕
                  </button>
                </motion.div>

                <AnimatePresence>
                  {expandedList === list.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <CardList cards={expandedCards} loading={loadingCards} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Back link */}
      <div className="pt-4">
        <Link href="/dashboard" className="text-seed hover:underline text-sm">
          ← 回到總覽
        </Link>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading font-bold text-lg text-earth mb-4">
                新增清單
              </h3>

              {/* Emoji picker */}
              <div className="flex flex-wrap gap-2 mb-4">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all
                      ${newEmoji === e
                        ? "bg-sprout-light ring-2 ring-seed scale-110"
                        : "bg-mist/20 hover:bg-mist/40"
                      }`}
                  >
                    {e}
                  </button>
                ))}
              </div>

              {/* Name input */}
              <input
                type="text"
                placeholder="清單名稱"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-mist/50 text-earth
                  focus:outline-none focus:ring-2 focus:ring-seed/30 focus:border-seed mb-4"
                maxLength={30}
                autoFocus
              />

              {error && (
                <p className="text-bloom text-sm mb-3">
                  {error}{" "}
                  <Link href="/pricing" className="underline font-bold">
                    升級方案 →
                  </Link>
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  fullWidth
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  fullWidth
                >
                  {creating ? "建立中..." : "建立"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CardList({ cards, loading }: { cards: VocabCard[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="py-4 text-center text-earth-light text-sm">
        載入卡片中...
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="py-4 text-center text-earth-light text-sm">
        這個分類還沒有卡片
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      {cards.slice(0, 20).map((card) => (
        <div
          key={card.id}
          className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-mist/30"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium text-earth text-sm truncate">
                {card.word}
              </span>
              <TtsButton text={card.word} lang={card.target_lang} className="w-6 h-6 text-sm" />
            </div>
            <span className="text-earth-light text-xs truncate block">
              {card.translation}
            </span>
          </div>
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              card.review_status === 2
                ? "bg-seed"
                : card.review_status === 1
                  ? "bg-sun"
                  : "bg-mist"
            }`}
            title={
              card.review_status === 2
                ? "已掌握"
                : card.review_status === 1
                  ? "學習中"
                  : "新卡片"
            }
          />
        </div>
      ))}
      {cards.length > 20 && (
        <p className="text-center text-earth-light text-xs py-2">
          還有 {cards.length - 20} 張卡片...
        </p>
      )}
    </div>
  );
}
