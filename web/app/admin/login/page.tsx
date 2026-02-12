"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        setError("密碼錯誤");
      }
    } catch {
      setError("連線失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl border border-mist/60 p-6 space-y-4"
      >
        <div className="text-center">
          <h1 className="font-heading font-extrabold text-xl text-earth">
            Admin Login
          </h1>
          <p className="text-earth-light text-sm mt-1">SnappWord 管理後台</p>
        </div>

        <div>
          <input
            type="password"
            placeholder="請輸入管理密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-cloud border border-mist/60 text-sm text-earth placeholder:text-earth-light/60 focus:outline-none focus:border-seed transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <Button type="submit" fullWidth disabled={loading || !password}>
          {loading ? "驗證中..." : "登入"}
        </Button>
      </form>
    </div>
  );
}
