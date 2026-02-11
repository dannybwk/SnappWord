import Link from "next/link";
import { LeafDoodle, PlantRow } from "./DoodleSVG";

export default function Footer() {
  return (
    <footer className="bg-earth text-white">
      <PlantRow className="text-earth opacity-30 -mb-1" />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <LeafDoodle className="text-seed" />
              <span className="font-heading font-extrabold text-xl">
                Snapp<span className="text-seed">Word</span>
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              截圖變單字卡，AI 幫你記憶整理。
              <br />
              讓語言學習更簡單。
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-bold text-sm text-white/40 uppercase tracking-wider mb-4">
              導覽
            </h4>
            <div className="flex flex-col gap-3">
              <Link href="#features" className="text-white/70 hover:text-seed transition-colors text-sm">
                功能介紹
              </Link>
              <Link href="#demo" className="text-white/70 hover:text-seed transition-colors text-sm">
                線上試用
              </Link>
              <Link href="/pricing" className="text-white/70 hover:text-seed transition-colors text-sm">
                方案定價
              </Link>
              <Link href="/dashboard" className="text-white/70 hover:text-seed transition-colors text-sm">
                我的單字
              </Link>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading font-bold text-sm text-white/40 uppercase tracking-wider mb-4">
              聯繫我們
            </h4>
            <div className="flex flex-col gap-3">
              <span className="text-white/70 text-sm">T+STUDIO 梯加創造</span>
              <a href="mailto:tplusstudio@gmail.com" className="text-white/70 hover:text-seed transition-colors text-sm">
                tplusstudio@gmail.com
              </a>
              <span className="text-white/70 text-sm">LINE 官方帳號：@snappword</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white/40 text-xs">
            © 2025 T+STUDIO 梯加創造. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-white/40 hover:text-white/60 text-xs transition-colors">
              隱私權政策
            </Link>
            <Link href="/terms" className="text-white/40 hover:text-white/60 text-xs transition-colors">
              服務條款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
