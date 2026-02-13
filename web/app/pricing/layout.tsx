import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "方案與價格",
  description:
    "SnappWord 截詞方案與價格：免費方案每日 3 張單字卡、標準方案每月 30 張、Pro 方案無限使用。選擇最適合你的語言學習方案。",
  alternates: {
    canonical: "https://snappword.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
