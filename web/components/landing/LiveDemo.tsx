"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { demoCards } from "@/lib/constants";

type DemoState = "idle" | "dragging" | "analyzing" | "result";

const screenshots = demoCards.map((c) => ({
  id: c.id,
  label: `${c.languageFlag} ${c.source}`,
  preview: c.word,
  card: c,
}));

function VocabCardBubble({ card }: { card: (typeof demoCards)[number] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="self-start max-w-[85%]"
    >
      <div className="bg-white rounded-2xl rounded-bl-sm shadow-lg overflow-hidden border border-mist/50">
        <div className="bg-seed px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-white font-bold">{card.languageFlag} {card.language}</span>
          <span className="text-[10px] text-white/70 bg-white/20 px-2 py-0.5 rounded-full">
            {card.partOfSpeech}
          </span>
        </div>
        <div className="px-4 py-3">
          <div className="font-heading font-extrabold text-xl text-earth">{card.word}</div>
          <div className="text-xs text-earth-light mt-0.5">{card.reading}</div>
          <div className="text-sm text-seed font-bold mt-2">{card.translation}</div>
          <div className="mt-3 pt-3 border-t border-mist/50">
            <p className="text-xs text-earth-light italic">&ldquo;{card.example}&rdquo;</p>
            <p className="text-xs text-earth-light mt-1">{card.exampleTranslation}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="text-[10px] bg-sprout-light text-seed px-2.5 py-1 rounded-full font-medium">
              記住了 ✓
            </span>
            <span className="text-[10px] bg-bloom-light text-bloom px-2.5 py-1 rounded-full font-medium">
              再看看
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LiveDemo() {
  const [state, setState] = useState<DemoState>("idle");
  const [selectedCard, setSelectedCard] = useState<(typeof demoCards)[number] | null>(null);
  const [chatHistory, setChatHistory] = useState<
    { type: "user" | "bot"; content: (typeof demoCards)[number] | string }[]
  >([]);

  const handleDrop = useCallback(
    (card: (typeof demoCards)[number]) => {
      setState("analyzing");
      setChatHistory((prev) => [...prev, { type: "user", content: `📸 ${card.source} 截圖` }]);

      setTimeout(() => {
        setState("result");
        setSelectedCard(card);
        setChatHistory((prev) => [...prev, { type: "bot", content: card }]);
        setTimeout(() => setState("idle"), 500);
      }, 2000);
    },
    []
  );

  const handleScreenshotClick = useCallback(
    (screenshot: (typeof screenshots)[number]) => {
      if (state === "analyzing") return;
      handleDrop(screenshot.card);
    },
    [handleDrop, state]
  );

  return (
    <section id="demo" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-cloud via-sprout-light/20 to-cloud pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-seed font-heading font-bold text-sm uppercase tracking-widest">
            Live Demo
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-earth mt-3">
            試試看
          </h2>
          <p className="text-earth-light mt-3">
            點選左邊的截圖，看看 AI 會變出什麼魔法
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Screenshot panel */}
          <div className="space-y-3">
            <p className="text-xs text-earth-light font-medium uppercase tracking-wider mb-2">
              選擇一張截圖
            </p>
            {screenshots.map((s) => (
              <motion.button
                key={s.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleScreenshotClick(s)}
                disabled={state === "analyzing"}
                className={`
                  w-full p-4 rounded-2xl border-2 text-left
                  transition-all duration-200 cursor-pointer
                  ${state === "analyzing"
                    ? "opacity-50 cursor-not-allowed border-mist"
                    : "border-mist hover:border-seed hover:shadow-md hover:shadow-seed/10"
                  }
                  bg-white
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-cloud rounded-xl flex items-center justify-center text-2xl shrink-0">
                    📸
                  </div>
                  <div>
                    <div className="font-heading font-bold text-sm text-earth">
                      {s.label}
                    </div>
                    <div className="text-xs text-earth-light mt-0.5">
                      包含「{s.preview}」
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Chat simulation */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border border-mist/50 overflow-hidden h-[480px] flex flex-col">
              {/* Chat header */}
              <div className="bg-seed px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
                  🌱
                </div>
                <div>
                  <div className="text-white font-heading font-bold text-sm">SnappWord 截詞</div>
                  <div className="text-white/60 text-[10px]">AI 語言學習助手</div>
                </div>
              </div>

              {/* Chat body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#E8ECF0]/30">
                {/* Welcome message */}
                <div className="self-start">
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm max-w-[80%]">
                    <p className="text-sm text-earth">👋 嗨！傳一張截圖給我，我幫你做單字卡！</p>
                  </div>
                </div>

                {/* Chat history */}
                <AnimatePresence mode="popLayout">
                  {chatHistory.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={msg.type === "user" ? "flex justify-end" : ""}
                    >
                      {msg.type === "user" ? (
                        <div className="bg-seed/90 rounded-2xl rounded-br-sm px-4 py-2 max-w-[70%]">
                          <p className="text-sm text-white">{msg.content as string}</p>
                        </div>
                      ) : (
                        <VocabCardBubble card={msg.content as (typeof demoCards)[number]} />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {state === "analyzing" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="self-start"
                    >
                      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm inline-flex gap-1.5">
                        {[0, 1, 2].map((dot) => (
                          <motion.span
                            key={dot}
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.8,
                              delay: dot * 0.15,
                            }}
                            className="w-2 h-2 bg-earth-light/50 rounded-full block"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat input */}
              <div className="border-t border-mist/50 px-4 py-3 flex items-center gap-2 bg-white">
                <div className="flex-1 bg-cloud rounded-full px-4 py-2 text-sm text-earth-light">
                  ← 點選左邊的截圖來試試
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
