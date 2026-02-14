"use client";

import { useState } from "react";

const langMap: Record<string, string> = {
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-TW",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-BR",
  it: "it-IT",
  th: "th-TH",
  vi: "vi-VN",
};

interface TtsButtonProps {
  text: string;
  lang: string;
  className?: string;
}

export default function TtsButton({ text, lang, className = "" }: TtsButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMap[lang] || "en-US";
    utterance.rate = 0.9;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={speak}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full
        hover:bg-sprout-light transition-colors text-lg
        ${speaking ? "animate-pulse bg-sprout-light" : ""}
        ${className}`}
      aria-label={`播放 ${text} 的發音`}
      type="button"
    >
      🔊
    </button>
  );
}
