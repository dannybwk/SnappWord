"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LeafDoodle } from "@/components/ui/DoodleSVG";
import { createClient } from "@/lib/supabase";

function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // Login page and callback bypass auth check
    if (pathname === "/admin/login" || pathname.startsWith("/admin/auth/")) {
      setAuthed(true);
      return;
    }

    async function checkAuth() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setAuthed(false);
        return;
      }

      // Verify token + email whitelist server-side
      const res = await fetch("/api/admin/auth", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      setAuthed(res.ok);
    }

    checkAuth();
  }, [pathname]);

  // Login page renders directly without shell
  if (pathname === "/admin/login" || pathname.startsWith("/admin/auth/")) {
    return <>{children}</>;
  }

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud">
        <div className="text-center space-y-3">
          <LeafDoodle className="text-seed w-10 h-10 mx-auto animate-pulse" />
          <p className="text-earth-light text-sm">驗證中...</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    router.push("/admin/login");
    return null;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-cloud">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 md:px-8 h-14 bg-white border-b border-mist/50">
        <Link href="/admin" className="flex items-center gap-2">
          <LeafDoodle className="text-seed w-7 h-7" />
          <span className="font-heading font-extrabold text-base text-earth">
            Snapp<span className="text-seed">Word</span>
          </span>
          <span className="text-xs text-earth-light bg-cloud px-2 py-0.5 rounded-lg font-medium ml-1">
            Admin
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-earth-light hover:text-earth transition-colors"
        >
          登出
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
