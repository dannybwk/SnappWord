// ── Brand colors ──
export const colors = {
  seed: "#06C755",
  seedDark: "#05a847",
  sprout: "#A8E6CF",
  sproutLight: "#d4f5e4",
  bloom: "#FFB7C5",
  bloomLight: "#ffe0e6",
  sun: "#FFE66D",
  sunLight: "#fff4b8",
  sky: "#74B9FF",
  skyLight: "#b8d8ff",
  earth: "#2D3436",
  earthLight: "#636e72",
  cloud: "#F8F9FA",
  mist: "#DFE6E9",
} as const;

// ── Navigation links ──
export const navLinks = [
  { label: "功能", href: "#features" },
  { label: "試用", href: "#demo" },
  { label: "方案", href: "/pricing" },
] as const;

// ── Demo data: screenshot → vocab card pairs ──
export const demoCards = [
  {
    id: 1,
    screenshot: "duolingo-spanish.png",
    word: "mariposa",
    reading: "ma·ri·po·sa",
    translation: "蝴蝶",
    language: "西班牙語",
    languageFlag: "🇪🇸",
    example: "La mariposa vuela en el jardín.",
    exampleTranslation: "蝴蝶在花園裡飛舞。",
    partOfSpeech: "名詞",
    source: "Duolingo",
  },
  {
    id: 2,
    screenshot: "netflix-japanese.png",
    word: "懐かしい",
    reading: "なつかしい",
    translation: "令人懷念的",
    language: "日語",
    languageFlag: "🇯🇵",
    example: "この歌は懐かしいですね。",
    exampleTranslation: "這首歌真令人懷念。",
    partOfSpeech: "形容詞",
    source: "Netflix",
  },
  {
    id: 3,
    screenshot: "article-english.png",
    word: "serendipity",
    reading: "ser·en·dip·i·ty",
    translation: "意外的驚喜發現",
    language: "英語",
    languageFlag: "🇺🇸",
    example: "Finding that book was pure serendipity.",
    exampleTranslation: "找到那本書純屬意外的驚喜。",
    partOfSpeech: "名詞",
    source: "閱讀文章",
  },
  {
    id: 4,
    screenshot: "duolingo-korean.png",
    word: "사랑",
    reading: "sa·rang",
    translation: "愛",
    language: "韓語",
    languageFlag: "🇰🇷",
    example: "사랑은 아름다운 것입니다.",
    exampleTranslation: "愛是美麗的東西。",
    partOfSpeech: "名詞",
    source: "Duolingo",
  },
] as const;

// ── Testimonials ──
export const testimonials = [
  {
    name: "小安",
    avatar: "🧑‍🎓",
    message: "天啊這也太方便了吧！我之前 Duolingo 截圖都存在相簿裡根本不會回去看",
  },
  {
    name: "Danny",
    avatar: "👨‍💻",
    message: "看 Netflix 日劇的時候截個圖就有單字卡，太讚了",
  },
  {
    name: "Mia",
    avatar: "👩‍🏫",
    message: "推薦給我的學生用了，他們超愛的！比手動抄寫省好多時間",
  },
  {
    name: "阿翔",
    avatar: "🧑‍🍳",
    message: "學西班牙文用的，AI 連例句都幫你生好 👍",
  },
  {
    name: "Lisa",
    avatar: "👩‍🎨",
    message: "介面好可愛，單字卡做得很漂亮，會想一直用",
  },
] as const;

// ── Stats (for landing page trust badges) ──
export const stats = {
  screenshotsProcessed: "12,000+",
  languagesSupported: 6,
  activeUsers: "2,400+",
} as const;

// ── Supported languages ──
export const supportedLanguages = [
  { name: "英語", flag: "🇺🇸" },
  { name: "日語", flag: "🇯🇵" },
  { name: "韓語", flag: "🇰🇷" },
  { name: "西班牙語", flag: "🇪🇸" },
  { name: "法語", flag: "🇫🇷" },
  { name: "德語", flag: "🇩🇪" },
] as const;

// ── LINE Official Account ──
export const lineAddFriendUrl = "https://lin.ee/pFkAWMI";

// ── Payment info (manual transfer) ──
export const paymentInfo = {
  jkoPay: {
    name: "街口支付",
    account: "900348041",
    url: "https://service.jkopay.com/r/transfer?j=Transfer:900348041",
  },
  paypal: {
    name: "PayPal",
    email: "smallbe@gmail.com",
    url: "https://paypal.me/smallbe",
  },
  bankTransfer: {
    name: "銀行轉帳",
    bank: "國泰世華銀行(013)",
    branch: "雙和分行",
    account: "069-03-500840-3",
    holder: "梯加有限公司",
  },
  contactLine: "@snappword",
} as const;

// ── Pricing plans ──
export const pricingPlans = [
  {
    name: "免費種子",
    nameEn: "Seed",
    tierId: "free" as const,
    price: 0,
    period: "永久免費",
    description: "開始你的語言花園之旅",
    features: [
      "每月 30 張截圖解析",
      "3 種語言支援",
      "每日 10 張翻卡複習",
      "連續天數追蹤",
      "3 個自訂單字本",
    ],
    cta: "免費開始",
    highlighted: false,
  },
  {
    name: "成長嫩芽",
    nameEn: "Sprout",
    tierId: "sprout" as const,
    price: 99,
    period: "每月",
    description: "讓你的花園加速成長",
    features: [
      "每月 200 張截圖解析",
      "6 種語言全支援",
      "無限翻卡複習",
      "AI 例句 + 真人發音",
      "無限自訂單字本",
      "匯出 Anki / CSV",
      "測驗模式",
    ],
    cta: "開始成長",
    highlighted: true,
  },
  {
    name: "綻放花園",
    nameEn: "Bloom",
    tierId: "bloom" as const,
    price: 249,
    period: "每月",
    description: "語言學習的終極花園",
    features: [
      "無限截圖解析",
      "6 種語言全支援",
      "無限翻卡複習",
      "AI 例句 + 語境解析 + 真人發音",
      "無限自訂單字本",
      "匯出所有格式",
      "測驗模式 + 學習統計",
    ],
    cta: "全面綻放",
    highlighted: false,
  },
] as const;
