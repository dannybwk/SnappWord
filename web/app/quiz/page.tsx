"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { quizQuestions } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Link from "next/link";

type QuizState = "playing" | "answered" | "finished";

function ConfettiPiece({ index }: { index: number }) {
  const colors = ["#06C755", "#FFB7C5", "#FFE66D", "#74B9FF", "#A8E6CF"];
  const randomX = Math.random() * 100;
  const randomDelay = Math.random() * 0.5;
  const randomDuration = 1.5 + Math.random() * 1;

  return (
    <motion.div
      initial={{ y: -20, x: `${randomX}vw`, opacity: 1, rotate: 0 }}
      animate={{
        y: "100vh",
        rotate: 360 + Math.random() * 360,
        opacity: 0,
      }}
      transition={{ duration: randomDuration, delay: randomDelay, ease: "easeIn" }}
      className="fixed top-0 w-3 h-3 rounded-sm z-50 pointer-events-none"
      style={{ background: colors[index % colors.length], left: 0 }}
    />
  );
}

function ResultScreen({
  score,
  total,
  onRestart,
}: {
  score: number;
  total: number;
  onRestart: () => void;
}) {
  const percentage = Math.round((score / total) * 100);
  const emoji = percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "💪";
  const message =
    percentage >= 80
      ? "太厲害了！你的記憶力超強！"
      : percentage >= 50
        ? "不錯喔！繼續努力！"
        : "別灰心，多複習幾次就會進步的！";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      {/* Confetti */}
      {percentage >= 50 &&
        Array.from({ length: 30 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}

      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 10, delay: 0.2 }}
        className="text-7xl block"
      >
        {emoji}
      </motion.span>

      <div>
        <h2 className="font-heading font-extrabold text-3xl text-earth">測驗完成！</h2>
        <p className="text-earth-light mt-2">{message}</p>
      </div>

      {/* Score circle */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#DFE6E9" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r="42"
              fill="none" stroke="#06C755" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - percentage / 100) }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="45" textAnchor="middle" fontSize="22" fontWeight="800" fill="#2D3436">
              {score}
            </text>
            <text x="50" y="60" textAnchor="middle" fontSize="10" fill="#636e72">
              / {total}
            </text>
          </svg>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onRestart} icon={<span>🔄</span>}>
          再測一次
        </Button>
        <Link href="/dashboard">
          <Button variant="outline">回到 Dashboard</Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function QuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<QuizState>("playing");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const question = quizQuestions[currentIndex];
  const progress = ((currentIndex + (state === "answered" ? 1 : 0)) / quizQuestions.length) * 100;

  const handleAnswer = useCallback(
    (answer: string) => {
      if (state === "answered") return;
      setSelectedAnswer(answer);
      setState("answered");

      const isCorrect = answer === question.correctAnswer;
      if (isCorrect) setScore((s) => s + 1);

      setTimeout(() => {
        if (currentIndex < quizQuestions.length - 1) {
          setCurrentIndex((i) => i + 1);
          setSelectedAnswer(null);
          setState("playing");
        } else {
          setState("finished");
        }
      }, 1500);
    },
    [state, question.correctAnswer, currentIndex]
  );

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setState("playing");
    setSelectedAnswer(null);
  }, []);

  return (
    <div className="min-h-screen bg-cloud flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-mist/50 px-4 py-3 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-earth-light hover:text-earth transition-colors text-sm"
        >
          ✕
        </Link>

        {/* Progress bar */}
        <div className="flex-1 h-3 bg-mist rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-seed rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <span className="text-xs text-earth-light font-mono">
          {currentIndex + 1}/{quizQuestions.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {state === "finished" ? (
            <ResultScreen score={score} total={quizQuestions.length} onRestart={restart} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Language tag */}
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-sky-light text-sky rounded-full text-xs font-bold mb-4">
                    {question.language}
                  </span>
                  <h2 className="font-heading font-extrabold text-4xl sm:text-5xl text-earth">
                    {question.word}
                  </h2>
                  <p className="text-earth-light mt-2 text-sm">這個詞是什麼意思？</p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options.map((option) => {
                    const isCorrect = option === question.correctAnswer;
                    const isSelected = option === selectedAnswer;
                    const isAnswered = state === "answered";

                    let bgColor = "bg-white border-mist hover:border-seed hover:shadow-md";
                    if (isAnswered && isCorrect) {
                      bgColor = "bg-sprout-light border-seed ring-2 ring-seed/30";
                    } else if (isAnswered && isSelected && !isCorrect) {
                      bgColor = "bg-bloom-light border-bloom ring-2 ring-bloom/30";
                    } else if (isAnswered) {
                      bgColor = "bg-white border-mist opacity-50";
                    }

                    return (
                      <motion.button
                        key={option}
                        whileHover={!isAnswered ? { scale: 1.02 } : undefined}
                        whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                        animate={
                          isAnswered && isSelected && !isCorrect
                            ? { x: [0, -8, 8, -4, 4, 0] }
                            : isAnswered && isCorrect
                              ? { scale: [1, 1.05, 1] }
                              : undefined
                        }
                        transition={{ duration: 0.4 }}
                        onClick={() => handleAnswer(option)}
                        disabled={isAnswered}
                        className={`
                          p-4 rounded-2xl border-2 text-left
                          transition-all duration-200
                          ${bgColor}
                        `}
                      >
                        <span className="text-sm font-medium text-earth">{option}</span>
                        {isAnswered && isCorrect && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="float-right text-seed"
                          >
                            ✓
                          </motion.span>
                        )}
                        {isAnswered && isSelected && !isCorrect && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="float-right text-bloom"
                          >
                            ✗
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
