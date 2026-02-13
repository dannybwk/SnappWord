"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { LeafDoodle } from "@/components/ui/DoodleSVG";

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud">
      <div className="text-center space-y-3">
        <LeafDoodle className="text-seed w-10 h-10 mx-auto animate-pulse" />
        <p className="text-earth-light text-sm">登入中...</p>
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConfirmInner />
    </Suspense>
  );
}

function ConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    async function exchangeCode() {
      const code = searchParams.get("code");
      if (!code) {
        setError("Missing auth code");
        return;
      }

      const supabase = createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }

      // Session is now stored in browser — redirect to admin
      router.replace("/admin");
    }

    exchangeCode();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud p-4">
        <div className="text-center space-y-3">
          <p className="text-red-500 text-sm">{error}</p>
          <a href="/admin/login" className="text-seed text-sm hover:underline">
            返回登入
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud">
      <div className="text-center space-y-3">
        <LeafDoodle className="text-seed w-10 h-10 mx-auto animate-pulse" />
        <p className="text-earth-light text-sm">登入中...</p>
      </div>
    </div>
  );
}
