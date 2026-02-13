import type { Metadata } from "next";
import { Nunito, Inter, Noto_Sans_TC, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://snappword.com"),
  title: {
    default: "SnappWord 截詞 — 截圖變單字卡，AI 幫你記憶整理",
    template: "%s | SnappWord 截詞",
  },
  description:
    "用 LINE 傳送截圖，AI 自動辨識並生成精美單字卡。支援 Duolingo、Netflix 等多種語言學習場景，涵蓋英日韓法德西 6 種語言。Screenshot to flashcard in 3 seconds.",
  keywords: [
    "單字卡", "LINE Bot", "AI", "語言學習", "Duolingo", "截圖", "背單字",
    "flashcard", "vocabulary", "language learning", "screenshot", "AI flashcard",
    "截詞", "SnappWord", "LINE 單字卡", "AI 單字卡",
  ],
  authors: [{ name: "SnappWord" }],
  creator: "SnappWord",
  openGraph: {
    title: "SnappWord 截詞 — 截圖變單字卡，AI 幫你記憶整理",
    description:
      "用 LINE 傳送截圖，AI 自動辨識並生成精美單字卡。7 秒搞定，支援 6 種語言。",
    url: "https://snappword.com",
    siteName: "SnappWord 截詞",
    images: [
      {
        url: "/image/SnappWord OG.png",
        width: 1200,
        height: 630,
        alt: "SnappWord 截詞 — 截圖變單字卡",
      },
    ],
    type: "website",
    locale: "zh_TW",
  },
  twitter: {
    card: "summary_large_image",
    title: "SnappWord 截詞 — 截圖變單字卡，AI 幫你記憶整理",
    description:
      "用 LINE 傳送截圖，AI 自動辨識並生成精美單字卡。7 秒搞定，支援 6 種語言。",
    images: ["/image/SnappWord OG.png"],
  },
  alternates: {
    canonical: "https://snappword.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`
          ${nunito.variable} ${inter.variable} ${notoSansTC.variable}
          ${jetbrainsMono.variable} ${caveat.variable}
          antialiased
        `}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "SnappWord 截詞",
              url: "https://snappword.com",
              logo: "https://snappword.com/icon.png",
              description:
                "AI 驅動的語言學習工具，透過 LINE 截圖自動生成單字卡。",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                url: "https://snappword.com",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "SnappWord 截詞",
              applicationCategory: "EducationalApplication",
              operatingSystem: "LINE",
              url: "https://snappword.com",
              description:
                "截圖變單字卡的 AI LINE Bot，支援英日韓法德西 6 種語言。Screenshot to flashcard in 3 seconds.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "TWD",
                description: "免費方案每日 3 張單字卡",
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
