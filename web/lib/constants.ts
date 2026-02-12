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

// ── Quiz mock data ──
export const quizQuestions = [
  {
    id: 1,
    word: "serendipity",
    language: "英語",
    correctAnswer: "意外的驚喜發現",
    options: ["意外的驚喜發現", "悲傷的情緒", "快速移動", "深度思考"],
  },
  {
    id: 2,
    word: "mariposa",
    language: "西班牙語",
    correctAnswer: "蝴蝶",
    options: ["蝴蝶", "花朵", "海洋", "星星"],
  },
  {
    id: 3,
    word: "懐かしい",
    language: "日語",
    correctAnswer: "令人懷念的",
    options: ["令人懷念的", "開心的", "困難的", "美味的"],
  },
  {
    id: 4,
    word: "사랑",
    language: "韓語",
    correctAnswer: "愛",
    options: ["愛", "夢", "友情", "希望"],
  },
  {
    id: 5,
    word: "ephemeral",
    language: "英語",
    correctAnswer: "短暫的",
    options: ["短暫的", "永恆的", "巨大的", "微小的"],
  },
] as const;

// ── Pricing plans ──
export const pricingPlans = [
  {
    name: "免費種子",
    nameEn: "Seed",
    price: 0,
    period: "永久免費",
    description: "開始你的語言花園之旅",
    features: [
      "每月 30 張截圖解析",
      "基本單字卡生成",
      "3 種語言支援",
      "LINE 單字卡推送",
    ],
    cta: "免費開始",
    highlighted: false,
  },
  {
    name: "成長嫩芽",
    nameEn: "Sprout",
    price: 99,
    period: "每月",
    description: "讓你的花園加速成長",
    features: [
      "每月 200 張截圖解析",
      "AI 智能例句生成",
      "6 種語言全支援",
      "SRS 間隔複習系統",
      "匯出 Anki / CSV",
      "測驗模式",
    ],
    cta: "開始成長",
    highlighted: true,
  },
  {
    name: "綻放花園",
    nameEn: "Bloom",
    price: 249,
    period: "每月",
    description: "語言學習的終極花園",
    features: [
      "無限截圖解析",
      "AI 智能例句 + 語境解析",
      "6 種語言全支援",
      "進階 SRS 系統",
      "匯出所有格式",
      "測驗模式 + 統計",
      "優先客服支援",
    ],
    cta: "全面綻放",
    highlighted: false,
  },
] as const;
