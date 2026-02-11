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
  title: "SnappWord 截詞 — 截圖變單字卡，AI 幫你記憶整理",
  description:
    "用 LINE 傳送截圖，AI 幫你生成精美單字卡。支援 Duolingo、Netflix 等 6 種語言學習場景。",
  keywords: ["單字卡", "LINE Bot", "AI", "語言學習", "Duolingo", "截圖", "背單字"],
  openGraph: {
    title: "SnappWord 截詞 — 截圖變單字卡，AI 幫你記憶整理",
    description: "用 LINE 傳送截圖，AI 幫你生成精美單字卡。3 秒搞定。",
    type: "website",
    locale: "zh_TW",
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
        {children}
      </body>
    </html>
  );
}
