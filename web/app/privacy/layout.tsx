import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隱私權政策",
  description:
    "SnappWord 截詞隱私權政策：了解我們如何收集、使用及保護您的個人資料與截圖內容。",
  alternates: {
    canonical: "https://snappword.com/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
