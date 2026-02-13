/**
 * LINE Webhook — Next.js Route Handler
 *
 * Architecture: Async reply pattern
 * 1. Receive image → reply "analyzing..." instantly
 * 2. Process in background → push result via Push Message API
 *
 * Error handling:
 * - GeminiQuotaError → tell user it's a service issue (not their fault)
 * - GeminiRetryExhaustedError → tell user to try again later
 * - Other errors → generic friendly error
 */

import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import {
  verifySignature,
  replyLoading,
  replyText,
  pushMessage,
  getMessageContent,
  getUserProfile,
} from "@/lib/server/line-client";
import {
  analyzeScreenshot,
  GeminiQuotaError,
  GeminiRetryExhaustedError,
} from "@/lib/server/gemini-client";
import {
  getOrCreateUser,
  checkQuota,
  uploadImage,
  saveVocabCards,
  updateCardStatusWithOwner,
  logEvent,
} from "@/lib/server/supabase-server";
import { buildVocabCarousel, buildErrorMessage } from "@/lib/server/flex-messages";
import type { LineEvent, ParsedWord } from "@/lib/server/types";

// Allow up to 60s for Gemini processing + retries
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature") || "";

  // Parse payload first — LINE verify sends empty events
  let payload: { events?: LineEvent[] };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events: LineEvent[] = payload.events || [];

  // LINE webhook verify: empty events → return 200 immediately
  if (events.length === 0) {
    return NextResponse.json({ status: "ok" });
  }

  // Verify signature for actual events
  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  // Return 200 immediately (LINE expects fast response),
  // but keep the serverless function alive to process events via waitUntil
  const processing = Promise.allSettled(
    events.map((event) => handleEvent(event))
  );
  waitUntil(processing);

  return NextResponse.json({ status: "ok" });
}

async function handleEvent(event: LineEvent): Promise<void> {
  try {
    if (event.type === "message") {
      await handleMessage(event);
    } else if (event.type === "postback") {
      await handlePostback(event);
    }
  } catch (err) {
    console.error("handleEvent error:", err);
  }
}

async function handleMessage(event: LineEvent): Promise<void> {
  const message = event.message;
  if (!message) return;

  const replyToken = event.replyToken || "";
  const lineUserId = event.source.userId;

  if (message.type === "image") {
    // Step 1: Immediately reply with loading indicator
    await replyLoading(replyToken);

    // Step 2: Process screenshot asynchronously, then push result
    await processScreenshot(lineUserId, message.id);
  } else if (message.type === "text") {
    await handleTextCommand(replyToken, lineUserId, message.text || "");
  } else {
    await replyText(
      replyToken,
      "📸 請傳送截圖給我！\n我會幫你把圖片中的生字變成單字卡 ✨"
    );
  }
}

async function processScreenshot(
  lineUserId: string,
  messageId: string
): Promise<void> {
  let userId: string | null = null;

  try {
    // Fetch LINE profile for display name
    const profile = await getUserProfile(lineUserId);
    const user = await getOrCreateUser(lineUserId, profile?.displayName);
    userId = user.id;

    // Check rate limit & monthly quota before processing
    const quota = await checkQuota(user);
    if (!quota.allowed) {
      if (quota.reason === "daily_quota") {
        await pushMessage(lineUserId, [
          buildErrorMessage(
            "📊 今天的截圖解析量已達上限（500 張）\n" +
            "明天就會自動重置，請明天再繼續！"
          ),
        ]);
      } else if (quota.reason === "monthly_quota") {
        await pushMessage(lineUserId, [
          buildErrorMessage(
            `📊 本月已使用 ${quota.monthlyUsed}/${quota.monthlyLimit} 張截圖額度\n` +
            "額度已用完，下個月會自動重置！\n\n" +
            "💎 升級方案可獲得更多額度：\nsnappword.com/pricing"
          ),
        ]);
      }
      return;
    }

    // Download image from LINE
    const imageBytes = await getMessageContent(messageId);
    await logEvent(userId, "image_received", {
      payload: { message_id: messageId },
    });

    // Upload to Supabase Storage
    const imageUrl = await uploadImage(imageBytes, userId);

    // AI analysis (with retry + model fallback)
    const [parseResult, metadata] = await analyzeScreenshot(imageBytes);
    await logEvent(userId, "gemini_call", {
      latencyMs: metadata.latencyMs,
      tokenCount: metadata.tokenCount,
      payload: { word_count: parseResult.words.length, model: metadata.model },
    });

    if (parseResult.words.length === 0) {
      await pushMessage(lineUserId, [
        buildErrorMessage(
          "我在這張截圖中沒有找到可以學習的單字 🤔\n" +
            "試試傳送 Duolingo、Netflix 字幕或文章的截圖！"
        ),
      ]);
      return;
    }

    // Save to database
    const savedCards = await saveVocabCards(userId, imageUrl, parseResult);
    await logEvent(userId, "parse_success", {
      payload: {
        cards_saved: savedCards.length,
        source_app: parseResult.source_app,
        model: metadata.model,
      },
    });

    // Build and send Flex Message
    const wordCardPairs: [ParsedWord, string][] = parseResult.words.map(
      (w, i) => [w, (savedCards[i] as Record<string, string>)?.id || ""]
    );
    const flexMsg = buildVocabCarousel(wordCardPairs, parseResult.source_app);
    await pushMessage(lineUserId, [flexMsg]);
  } catch (err) {
    console.error("processScreenshot error:", err);

    // Log the error
    try {
      if (userId) {
        await logEvent(userId, "parse_fail", {
          payload: {
            error: err instanceof Error ? err.message : String(err),
            error_type: err instanceof GeminiQuotaError
              ? "quota"
              : err instanceof GeminiRetryExhaustedError
                ? "retry_exhausted"
                : "unknown",
          },
        });
      }
    } catch { /* ignore logging failure */ }

    // Send user-friendly error based on error type
    const userMessage = getUserErrorMessage(err);
    await pushMessage(lineUserId, [buildErrorMessage(userMessage)]);
  }
}

/** Map error types to user-friendly messages. */
function getUserErrorMessage(err: unknown): string {
  if (err instanceof GeminiQuotaError) {
    return (
      "⚠️ AI 服務暫時無法使用\n" +
      "我們正在處理中，請稍後再試。\n" +
      "造成不便敬請見諒 🙏"
    );
  }

  if (err instanceof GeminiRetryExhaustedError) {
    return (
      "🔄 AI 伺服器忙碌中\n" +
      "已嘗試多次但仍無法完成解析。\n" +
      "請等 1-2 分鐘後重新傳送截圖。"
    );
  }

  return (
    "處理截圖時發生錯誤 😅\n" +
    "請稍後重試，或換一張更清晰的截圖。"
  );
}

async function handleTextCommand(
  replyToken: string,
  _lineUserId: string,
  text: string
): Promise<void> {
  const lower = text.trim().toLowerCase();

  if (["help", "幫助", "說明"].includes(lower)) {
    await replyText(
      replyToken,
      "📸 使用方式：\n\n" +
        "1. 在任何 App 截圖（Duolingo、Netflix、文章...）\n" +
        "2. 把截圖傳給我\n" +
        "3. 3-5 秒內收到精美單字卡！\n\n" +
        "就是這麼簡單 ✨"
    );
  } else {
    await replyText(
      replyToken,
      "📸 請傳送截圖給我，我來幫你提取單字！\n" +
        "輸入「幫助」查看使用說明。"
    );
  }
}

async function handlePostback(event: LineEvent): Promise<void> {
  const dataStr = event.postback?.data || "";
  const replyToken = event.replyToken || "";
  const lineUserId = event.source.userId;
  const params = new URLSearchParams(dataStr);

  const action = params.get("action") || "";
  const cardId = params.get("card_id") || "";

  if (!cardId) return;

  // Look up user for ownership verification
  const user = await getOrCreateUser(lineUserId);

  if (action === "save" && cardId) {
    await replyText(
      replyToken,
      "📖 已存入單字筆記！\n到 snappword.com/dashboard 查看你的完整筆記本 ✨"
    );
  } else if (action === "review" && cardId) {
    await updateCardStatusWithOwner(cardId, user.id, 1); // 1 = Learning
    await replyText(
      replyToken,
      "🔁 已加入複習清單！之後會推播提醒你複習 📚\n到 snappword.com/dashboard 查看你的完整筆記本 ✨"
    );
  }
}
