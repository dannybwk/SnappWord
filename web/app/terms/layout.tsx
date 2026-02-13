import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "服務條款",
  description:
    "SnappWord 截詞服務條款：使用本服務前請詳閱相關條款與使用規範。",
  alternates: {
    canonical: "https://snappword.com/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
