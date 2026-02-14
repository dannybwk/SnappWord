"use client";

import AuthProvider from "@/components/auth/AuthProvider";

export default function FlashcardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
