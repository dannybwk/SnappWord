"use client";

import AuthProvider from "@/components/auth/AuthProvider";

export default function WordListsLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
