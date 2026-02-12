"use client";

import { useAuth } from "./AuthProvider";
import { LeafDoodle } from "@/components/ui/DoodleSVG";
import Button from "@/components/ui/Button";

export default function LoginScreen() {
  const { login, loading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud p-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center space-y-6">
        <div className="flex justify-center">
          <LeafDoodle className="text-seed w-12 h-12" />
        </div>

        <div>
          <h1 className="font-heading font-extrabold text-2xl text-earth">
            Snapp<span className="text-seed">Word</span> 截詞
          </h1>
          <p className="text-earth-light text-sm mt-2">
            登入後查看你的單字筆記、學習統計和複習進度
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={login}
          disabled={loading}
          className="w-full"
        >
          {loading ? "載入中..." : "使用 LINE 帳號登入"}
        </Button>

        <p className="text-xs text-earth-light">
          登入即表示你同意我們的
          <a href="/terms" className="text-seed hover:underline">使用條款</a>
          和
          <a href="/privacy" className="text-seed hover:underline">隱私政策</a>
        </p>
      </div>
    </div>
  );
}
