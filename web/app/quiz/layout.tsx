"use client";

import AuthProvider from "@/components/auth/AuthProvider";

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
