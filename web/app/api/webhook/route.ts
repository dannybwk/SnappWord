/**
 * LINE Webhook — Next.js Route Handler
 *
 * Architecture: Async reply pattern
 * 1. Receive image → reply "analyzing..." instantly
 * 2. Process in background → push result via Push Message API
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifySignature,
  replyLoading,
  replyText,
  pushMessage,
  getMessageContent,
} from "@/lib/server/line-client";
import { analyzeScreenshot } from "@/lib/server/gemini-client";
import {
  getOrCreateUser,
  uploadImage,
  saveVocabCards,
  updateCardStatus,
  logEvent,
} from "@/lib/server/supabase-server";
import { buildVocabCarousel, buildErrorMessage } from "@/lib/server/flex-messages";
import type { LineEvent, ParsedWord } from "@/lib/server/types";

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

  // Fire-and-forget: process events without blocking the response
  // LINE expects 200 within a few seconds
  for (const event of events) {
    handleEvent(event).catch((err) =>
      console.error("Event handler error:", err)
    );
  }

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
  const user = await getOrCreateUser(lineUserId);
  const userId = user.id;

  try {
    // Download image from LINE
    const imageBytes = await getMessageContent(messageId);
    await logEvent(userId, "image_received", {
      payload: { message_id: messageId },
    });

    // Upload to Supabase Storage
    const imageUrl = await uploadImage(imageBytes, userId);

    // AI analysis
    const [parseResult, metadata] = await analyzeScreenshot(imageBytes);
    await logEvent(userId, "gemini_call", {
      latencyMs: metadata.latencyMs,
      tokenCount: metadata.tokenCount,
      payload: { word_count: parseResult.words.length },
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
    await logEvent(userId, "parse_fail", {
      payload: { error: String(err) },
    });
    await pushMessage(lineUserId, [
      buildErrorMessage(
        "處理截圖時發生錯誤 😅\n請稍後重試，或換一張更清晰的截圖。"
      ),
    ]);
  }
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
  const params = new URLSearchParams(dataStr);

  const action = params.get("action") || "";
  const cardId = params.get("card_id") || "";

  if (action === "save" && cardId) {
    await updateCardStatus(cardId, 1); // 1 = Learning
    await replyText(
      replyToken,
      "✅ 已存入你的單字本！明天早上會推播複習提醒喔 📚"
    );
  } else if (action === "skip" && cardId) {
    await replyText(replyToken, "⏭ 已跳過");
  }
}
