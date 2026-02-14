"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LeafDoodle } from "@/components/ui/DoodleSVG";
import { motion } from "framer-motion";
import AuthProvider, { useAuth } from "@/components/auth/AuthProvider";
import LoginScreen from "@/components/auth/LoginScreen";

const sidebarLinks = [
  { href: "/dashboard", label: "總覽", icon: "🏠" },
  { href: "/flashcard", label: "翻卡複習", icon: "🃏" },
  { href: "/quiz", label: "測驗", icon: "🎯" },
  { href: "/word-lists", label: "單字本", icon: "📚" },
  { href: "/pricing", label: "方案", icon: "💎" },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud">
        <div className="text-center space-y-3">
          <LeafDoodle className="text-seed w-10 h-10 mx-auto animate-pulse" />
          <p className="text-earth-light text-sm">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex bg-cloud">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-white border-r border-mist/50 p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 px-3 mb-8 group">
          <LeafDoodle className="text-seed transition-transform group-hover:rotate-12" />
          <span className="font-heading font-extrabold text-lg text-earth">
            Snapp<span className="text-seed">Word</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? "bg-sprout-light text-seed"
                    : "text-earth-light hover:bg-cloud hover:text-earth"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-sprout-light rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <span className="relative z-10 text-lg">{link.icon}</span>
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile + logout */}
        <div className="mt-auto pt-4 border-t border-mist/50 space-y-3">
          <div className="flex items-center gap-2 px-3">
            {user.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={user.displayName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sprout-light flex items-center justify-center text-seed text-sm font-bold">
                {user.displayName.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-earth truncate">
              {user.displayName}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-earth-light hover:text-earth transition-colors w-full"
          >
            登出
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-mist/50">
          <Link href="/" className="flex items-center gap-2">
            <LeafDoodle className="text-seed w-7 h-7" />
            <span className="font-heading font-extrabold text-base text-earth">
              Snapp<span className="text-seed">Word</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  px-2 py-1 rounded-lg text-sm
                  ${pathname === link.href
                    ? "bg-sprout-light text-seed font-bold"
                    : "text-earth-light"
                  }
                `}
              >
                {link.icon}
              </Link>
            ))}
            {user.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt=""
                className="w-7 h-7 rounded-full ml-1"
                onClick={logout}
              />
            ) : (
              <button
                onClick={logout}
                className="w-7 h-7 rounded-full bg-sprout-light flex items-center justify-center text-seed text-xs font-bold ml-1"
              >
                {user.displayName.charAt(0)}
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
