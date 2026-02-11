"use client";

import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import { motion } from "framer-motion";
import Link from "next/link";

export default function TermsPage() {
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
            服務條款
          </h1>
          <p className="text-earth-light text-sm mb-10">最後更新日期：2025 年 2 月 11 日</p>

          <div className="prose prose-sm max-w-none space-y-8 text-earth leading-relaxed">
            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">一、服務概述</h2>
              <p className="text-earth-light">
                SnappWord 截詞（以下簡稱「本服務」）由 T+STUDIO 梯加創造（以下簡稱「我們」）提供。本服務透過 LINE Bot 及網頁平台，為使用者提供截圖辨識、單字卡生成、複習管理及測驗等語言學習功能。使用本服務即表示您同意遵守本服務條款。
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">二、帳號與使用</h2>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li>您需透過 LINE 帳號使用本服務，並確保帳號資訊的正確性。</li>
                <li>您須對帳號下的所有活動負責，請妥善保管您的帳號。</li>
                <li>每個 LINE 帳號僅能註冊一個 SnappWord 帳號。</li>
                <li>您必須年滿 13 歲（或您所在地區的最低法定年齡）方可使用本服務。</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">三、服務內容與限制</h2>
              <p className="text-earth-light mb-3">本服務提供以下功能：</p>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li>截圖上傳與 AI 自動辨識單字</li>
                <li>單字卡自動生成與 LINE 推送</li>
                <li>單字雲端儲存與管理</li>
                <li>間隔複習（SRS）排程</li>
                <li>測驗模式</li>
                <li>資料匯出（CSV / Anki）</li>
              </ul>
              <p className="text-earth-light mt-3">
                各方案的功能與使用限額請參考<Link href="/pricing" className="text-seed hover:underline">方案定價頁面</Link>。我們保留隨時調整服務內容與限額的權利。
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">四、使用規範</h2>
              <p className="text-earth-light mb-3">使用本服務時，您同意不進行以下行為：</p>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li>上傳含有違法、色情、暴力、仇恨言論或侵害他人權利的內容</li>
                <li>利用本服務進行非語言學習目的的大量自動化操作</li>
                <li>嘗試破解、逆向工程或干擾本服務的正常運作</li>
                <li>冒用他人身份或偽造資訊</li>
                <li>轉售或未經授權共享付費帳號</li>
              </ul>
              <p className="text-earth-light mt-3">
                違反上述規範者，我們有權暫停或終止您的帳號，且不予退費。
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">五、智慧財產權</h2>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li>本服務的介面設計、程式碼、商標及其他智慧財產權歸 T+STUDIO 梯加創造所有。</li>
                <li>您上傳的截圖內容之智慧財產權歸原著作權人所有。您保證擁有上傳截圖的合法使用權。</li>
                <li>AI 生成的單字卡內容（翻譯、例句等）僅供個人學習使用。</li>
                <li><strong className="text-earth">第三方商標聲明：</strong>本服務及網站中提及的所有第三方品牌名稱、商標及服務標誌（包括但不限於 Duolingo、Netflix、Anki、LINE、Google 等），其智慧財產權均歸各該公司或權利人所有。本服務與上述品牌無任何隸屬、贊助、授權或合作關係，所有提及僅為說明本服務適用情境之示意用途，不構成任何商業上的關聯或背書。</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">六、付費方案與退費</h2>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li>付費方案以月為單位計費，於每月自動續約扣款。</li>
                <li>您可隨時取消訂閱，取消後服務將持續至該計費週期結束。</li>
                <li>已收取的費用原則上不予退還，除非法律另有規定。</li>
                <li>我們保留調整方案價格的權利，價格變更前會提前 30 日通知。</li>
                <li>免費方案使用者的資料保留期限為最後使用日起 12 個月。</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">七、免責聲明</h2>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li>本服務以「現況」提供，我們不保證服務不中斷或完全無錯誤。</li>
                <li>AI 辨識結果可能存在誤差，翻譯與例句僅供參考，不保證完全正確。</li>
                <li>因不可抗力（如天災、網路中斷、第三方服務故障）導致的服務中斷，我們不承擔責任。</li>
                <li>因使用者自身原因（如帳號外洩、裝置遺失）造成的損失，我們不承擔責任。</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">八、服務變更與終止</h2>
              <ul className="list-disc pl-5 space-y-2 text-earth-light">
                <li>我們保留隨時修改、暫停或終止部分或全部服務的權利。</li>
                <li>重大變更將提前通知使用者。</li>
                <li>服務終止時，我們將提供合理期間讓使用者匯出資料。</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">九、條款修訂</h2>
              <p className="text-earth-light">
                我們可能不定期修訂本服務條款。修訂後的條款將公告於本頁面並更新「最後更新日期」。繼續使用本服務即表示您同意修訂後的條款。重大變更時，我們會透過 LINE 通知您。
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">十、準據法與管轄</h2>
              <p className="text-earth-light">
                本服務條款受中華民國法律管轄。因本條款引起的爭議，雙方同意以臺灣臺北地方法院為第一審管轄法院。
              </p>
            </section>

            <section>
              <h2 className="font-heading font-bold text-xl text-earth mb-3">十一、聯絡我們</h2>
              <p className="text-earth-light">
                如對本服務條款有任何疑問，請聯繫：
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
