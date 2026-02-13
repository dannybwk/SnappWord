"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Check email whitelist server-side
      const checkRes = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!checkRes.ok) {
        const data = await checkRes.json();
        setError(data.error === "Unauthorized email" ? "此 Email 無管理權限" : data.error);
        setLoading(false);
        return;
      }

      // 2. Send magic link via Supabase Auth
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
        },
      });

      if (otpError) {
        setError(otpError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("連線失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-mist/60 p-6 space-y-4">
        <div className="text-center">
          <h1 className="font-heading font-extrabold text-xl text-earth">
            Admin Login
          </h1>
          <p className="text-earth-light text-sm mt-1">SnappWord 管理後台</p>
        </div>

        {sent ? (
          <div className="text-center space-y-2 py-4">
            <p className="text-3xl">📬</p>
            <p className="text-earth font-medium">登入連結已寄出</p>
            <p className="text-earth-light text-sm">
              請到 <span className="font-bold">{email}</span> 信箱點擊登入連結
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="管理員 Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl bg-cloud border border-mist/60 text-sm text-earth placeholder:text-earth-light/60 focus:outline-none focus:border-seed transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" fullWidth disabled={loading || !email}>
              {loading ? "傳送中..." : "寄送登入連結"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
