/**
 * LINE Messaging API client.
 */

import { createHmac, timingSafeEqual } from "crypto";

const LINE_API_BASE = "https://api.line.me/v2/bot";

function getSecret(): string {
  return process.env.LINE_CHANNEL_SECRET || "";
}

function getToken(): string {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

/** Verify LINE webhook signature (HMAC-SHA256). */
export function verifySignature(body: string, signature: string): boolean {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(body);
  const expected = hmac.digest("base64");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Send reply using reply token (must be within 30s of webhook). */
export async function replyMessage(
  replyToken: string,
  messages: Record<string, unknown>[]
): Promise<void> {
  await fetch(`${LINE_API_BASE}/message/reply`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ replyToken, messages }),
  });
}

/** Send push message to a user (no time limit). */
export async function pushMessage(
  userId: string,
  messages: Record<string, unknown>[]
): Promise<void> {
  await fetch(`${LINE_API_BASE}/message/push`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ to: userId, messages }),
  });
}

/** Download image content from LINE servers. */
export async function getMessageContent(messageId: string): Promise<Buffer> {
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const resp = await fetch(url, { headers: headers() });
  if (!resp.ok) throw new Error(`LINE content download failed: ${resp.status}`);
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** Reply with a single text message. */
export async function replyText(
  replyToken: string,
  text: string
): Promise<void> {
  await replyMessage(replyToken, [{ type: "text", text }]);
}

/** Reply with a "processing" indicator. */
export async function replyLoading(replyToken: string): Promise<void> {
  await replyText(
    replyToken,
    "🔍 AI 正在解析您的截圖...\n請稍候 3-5 秒，單字卡馬上就來！"
  );
}
