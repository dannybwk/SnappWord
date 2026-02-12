"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initLiff, isLoggedIn, login, logout, getProfile } from "@/lib/liff";

interface User {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  dbUserId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await initLiff();

        if (isLoggedIn()) {
          const profile = await getProfile();
          if (profile) {
            // Look up DB user id
            const res = await fetch(
              `/api/auth/me?lineUserId=${encodeURIComponent(profile.userId)}`
            );
            const data = res.ok ? await res.json() : null;

            setUser({
              lineUserId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              dbUserId: data?.id || undefined,
            });
          }
        }
      } catch (err) {
        console.error("LIFF init error:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
