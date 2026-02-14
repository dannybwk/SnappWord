import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import LiveDemo from "@/components/landing/LiveDemo";
import Features from "@/components/landing/Features";
import Testimonials from "@/components/landing/Testimonials";
import FinalCTA from "@/components/landing/FinalCTA";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "SnappWord 截詞是什麼？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SnappWord 截詞是一款 AI LINE Bot，只要傳送語言學習的截圖，AI 就會自動辨識並生成精美的單字卡。還有翻卡複習、連續天數追蹤、單字本分類、真人發音等功能，幫助你高效記憶單字。",
      },
    },
    {
      "@type": "Question",
      name: "SnappWord 支援哪些語言？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "目前支援英文、日文、韓文、法文、德文、西班牙文共 6 種語言的單字辨識與翻譯。",
      },
    },
    {
      "@type": "Question",
      name: "SnappWord 可以免費使用嗎？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "可以！免費方案每日可生成 3 張單字卡，適合輕度學習者。需要更多用量可升級標準方案或 Pro 方案。",
      },
    },
    {
      "@type": "Question",
      name: "支援哪些截圖來源？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "支援 Duolingo、Netflix 字幕、電子書、網頁文章等任何含有文字的學習畫面截圖。",
      },
    },
    {
      "@type": "Question",
      name: "如何開始使用 SnappWord？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "只需加入 SnappWord 截詞的 LINE 官方帳號，傳送截圖即可開始使用，無需額外安裝 App。",
      },
    },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "如何使用 SnappWord 截詞生成單字卡",
  description:
    "透過 LINE 傳送截圖，AI 自動辨識並生成單字卡的完整步驟。",
  step: [
    {
      "@type": "HowToStep",
      name: "截圖",
      text: "在 Duolingo、Netflix 字幕、電子書、網頁文章等任何 App 看到生字就截圖。",
    },
    {
      "@type": "HowToStep",
      name: "傳送到 LINE",
      text: "把截圖傳送到 SnappWord 截詞的官方 LINE 帳號。",
    },
    {
      "@type": "HowToStep",
      name: "AI 解析",
      text: "AI 在 7 秒內辨識截圖內容，自動抓取生字、生成翻譯和例句。",
    },
    {
      "@type": "HowToStep",
      name: "收到單字卡",
      text: "精美單字卡直接推送到 LINE 聊天室，一鍵收藏到筆記本、隨時複習。",
    },
  ],
};

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
        <Hero />
        <HowItWorks />
        <LiveDemo />
        <Features />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
