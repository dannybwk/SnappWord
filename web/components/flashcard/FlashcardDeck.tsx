"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import TtsButton from "@/components/ui/TtsButton";

export interface FlashcardData {
  id: string;
  word: string;
  pronunciation: string;
  translation: string;
  original_sentence: string;
  context_trans: string;
  ai_example: string;
  target_lang: string;
  source_app: string;
  tags: string[];
}

interface FlashcardDeckProps {
  cards: FlashcardData[];
  onAnswer: (cardId: string, known: boolean) => void;
  current: number;
}

function FlashCard({
  card,
  onSwipe,
  isTop,
  stackIndex,
}: {
  card: FlashcardData;
  onSwipe: (known: boolean) => void;
  isTop: boolean;
  stackIndex: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Swipe indicator colors
  const greenOpacity = useTransform(x, [0, 100], [0, 1]);
  const redOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) {
      animate(x, 500, { duration: 0.3 });
      setTimeout(() => onSwipe(true), 200);
    } else if (info.offset.x < -100) {
      animate(x, -500, { duration: 0.3 });
      setTimeout(() => onSwipe(false), 200);
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  };

  if (!isTop) {
    return (
      <motion.div
        className="absolute inset-0"
        style={{
          scale: 1 - stackIndex * 0.05,
          y: stackIndex * 8,
          zIndex: 10 - stackIndex,
        }}
      >
        <div className="w-full h-full bg-white rounded-3xl shadow-lg border border-mist/50" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity, zIndex: 20 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
    >
      {/* Swipe indicators */}
      <motion.div
        className="absolute top-6 right-6 bg-seed text-white px-4 py-2 rounded-xl font-bold text-lg z-30 pointer-events-none"
        style={{ opacity: greenOpacity }}
      >
        ✓ 記得
      </motion.div>
      <motion.div
        className="absolute top-6 left-6 bg-bloom text-white px-4 py-2 rounded-xl font-bold text-lg z-30 pointer-events-none"
        style={{ opacity: redOpacity }}
      >
        ✗ 忘了
      </motion.div>

      <div
        className="w-full h-full [perspective:1200px]"
        onClick={() => setFlipped(!flipped)}
      >
        <motion.div
          className="w-full h-full relative [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Front: word + pronunciation + TTS */}
          <div className="absolute inset-0 [backface-visibility:hidden] bg-white rounded-3xl shadow-xl border border-mist/50 flex flex-col items-center justify-center p-8">
            <div className="text-earth-light/60 text-sm mb-2 font-medium">
              {card.source_app}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-heading font-extrabold text-4xl text-earth">
                {card.word}
              </h2>
              <TtsButton text={card.word} lang={card.target_lang} />
            </div>
            {card.pronunciation && (
              <p className="text-earth-light text-lg mb-4">{card.pronunciation}</p>
            )}
            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {card.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-sprout-light text-seed text-xs rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-earth-light/50 text-sm mt-auto">
              點擊翻轉查看答案
            </p>
          </div>

          {/* Back: translation + example + context */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white rounded-3xl shadow-xl border border-mist/50 flex flex-col p-8 overflow-y-auto">
            <div className="text-earth-light/60 text-sm mb-4 font-medium text-center">
              翻譯
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-seed text-center mb-6">
              {card.translation}
            </h2>

            {card.original_sentence && (
              <div className="mb-4">
                <p className="text-earth-light/60 text-xs font-medium mb-1">語境</p>
                <p className="text-earth text-sm">{card.original_sentence}</p>
                {card.context_trans && (
                  <p className="text-earth-light text-xs mt-1">{card.context_trans}</p>
                )}
              </div>
            )}

            {card.ai_example && (
              <div className="mb-4">
                <p className="text-earth-light/60 text-xs font-medium mb-1">例句</p>
                <p className="text-earth text-sm italic">{card.ai_example}</p>
              </div>
            )}

            <p className="text-earth-light/50 text-sm mt-auto text-center">
              滑動或點按鈕回答
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function FlashcardDeck({ cards, onAnswer, current }: FlashcardDeckProps) {
  const handleSwipe = (known: boolean) => {
    if (current < cards.length) {
      onAnswer(cards[current].id, known);
    }
  };

  const visibleCards = cards.slice(current, current + 3);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-sm text-earth-light mb-2">
          <span>{current + 1} / {cards.length}</span>
        </div>
        <div className="h-2 bg-mist/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-seed rounded-full"
            initial={false}
            animate={{ width: `${((current + 1) / cards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="relative w-full max-w-sm h-[420px]">
        {visibleCards.map((card, i) => (
          <FlashCard
            key={card.id}
            card={card}
            onSwipe={handleSwipe}
            isTop={i === 0}
            stackIndex={i}
          />
        ))}
      </div>

      {/* Fallback buttons */}
      <div className="flex gap-4 w-full max-w-sm">
        <button
          onClick={() => handleSwipe(false)}
          className="flex-1 py-3 rounded-2xl bg-red-50 text-bloom font-bold text-lg
            hover:bg-red-100 transition-colors"
        >
          ✗ 忘了
        </button>
        <button
          onClick={() => handleSwipe(true)}
          className="flex-1 py-3 rounded-2xl bg-green-50 text-seed font-bold text-lg
            hover:bg-green-100 transition-colors"
        >
          ✓ 記得
        </button>
      </div>
    </div>
  );
}
