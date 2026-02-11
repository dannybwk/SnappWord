"use client";

import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto px-6"
        >
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-earth mb-2">
            隱私權政策
          </h1>
          <p className="text-earth-light text-sm mb-10">最後更新日期：2025 年 2 月 11 日</p>

          <div className="prose prose-sm max-w-none space-y-8 text-earth leading-relaxed">
            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">一、前言</h2>
              <p className="text-earth-light">
                SnappWord 截詞（以下簡稱「本服務」）由 T+STUDIO 梯加創造（以下簡稱「我們」）開發與營運。我們重視您的隱私權，本政策說明我們如何蒐集、使用及保護您的個人資料。使用本服務即表示您同意本隱私權政策的內容。
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">二、蒐集的資料類型</h2>
              <p className="text-earth-light mb-3">我們可能蒐集以下類型的資料：</p>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li><strong className="text-earth">LINE 帳號資訊：</strong>當您透過 LINE 使用本服務時，我們會取得您的 LINE 使用者 ID、顯示名稱及大頭貼（經您授權）。</li>
                <li><strong className="text-earth">截圖內容：</strong>您傳送至本服務的截圖圖片，用於 AI 辨識與單字卡生成。</li>
                <li><strong className="text-earth">學習紀錄：</strong>您的單字卡、複習進度、測驗成績等學習相關資料。</li>
                <li><strong className="text-earth">使用紀錄：</strong>服務使用頻率、功能操作紀錄等，用於改善服務體驗。</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">三、資料使用目的</h2>
              <p className="text-earth-light mb-3">我們蒐集的資料僅用於以下目的：</p>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li>提供、維護及改善本服務功能</li>
                <li>透過 AI 辨識截圖內容並生成單字卡</li>
                <li>個人化您的學習體驗（如間隔複習排程）</li>
                <li>傳送服務相關通知與更新</li>
                <li>進行匿名化的統計分析以改善服務</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">四、資料儲存與安全</h2>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li>您的資料儲存於 Supabase 雲端資料庫，採用業界標準的加密技術保護。</li>
                <li>截圖圖片在 AI 辨識完成後，將於 30 日內從伺服器刪除。</li>
                <li>我們不會將您的個人資料出售或出租給第三方。</li>
                <li>僅在法律要求或經您明確同意的情況下，才會向第三方揭露您的資料。</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">五、第三方服務</h2>
              <p className="text-earth-light mb-3">本服務使用以下第三方服務，各有其隱私權政策：</p>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li><strong className="text-earth">LINE Messaging API：</strong>用於接收訊息與傳送單字卡</li>
                <li><strong className="text-earth">Google Gemini API：</strong>用於 AI 圖片辨識與文字解析</li>
                <li><strong className="text-earth">Supabase：</strong>用於資料儲存</li>
                <li><strong className="text-earth">Vercel：</strong>用於服務部署與運行</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">六、您的權利</h2>
              <p className="text-earth-light mb-3">您享有以下權利：</p>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li><strong className="text-earth">查閱權：</strong>您可以要求查閱我們持有的您的個人資料。</li>
                <li><strong className="text-earth">更正權：</strong>您可以要求更正不正確的個人資料。</li>
                <li><strong className="text-earth">刪除權：</strong>您可以要求刪除您的帳號及所有相關資料。</li>
                <li><strong className="text-earth">匯出權：</strong>您可以透過匯出功能下載您的學習資料。</li>
              </ul>
              <p className="text-earth-light mt-3">
                如需行使上述權利，請透過以下方式聯繫我們。
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">七、Cookie 與追蹤技術</h2>
              <p className="text-earth-light">
                本網站可能使用必要的 Cookie 以維持正常運作（如登入狀態）。我們不使用第三方廣告追蹤 Cookie。
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">八、政策修訂</h2>
              <p className="text-earth-light">
                我們可能不定期修訂本隱私權政策。修訂後的政策將公告於本頁面，並更新「最後更新日期」。重大變更時，我們會透過 LINE 通知您。
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">九、聯絡我們</h2>
              <p className="text-earth-light">
                如對本隱私權政策有任何疑問，請聯繫：
              </p>
              <div className="bg-cloud rounded-2xl p-5 mt-3 space-y-2">
                <p className="text-earth font-heading font-bold">T+STUDIO 梯加創造</p>
                <p className="text-earth-light text-sm">
                  Email：<a href="mailto:tplusstudio@gmail.com" className="text-seed hover:underline">tplusstudio@gmail.com</a>
                </p>
                <p className="text-earth-light text-sm">
                  LINE 官方帳號：@snappword
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
