/**
 * Gemini AI client — production-hardened with retry, fallback, and error classification.
 *
 * Architecture:
 * 1. Primary model call with exponential backoff retry (handles transient 429/503)
 * 2. Fallback model chain if primary exhausts retries
 * 3. Custom error classes for upstream callers to distinguish error types
 * 4. Google's suggested retry delay is respected when available
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiParseResult } from "./types";

// ── Error Classes ──

/** Quota/billing issue — retrying won't help, needs API key fix. */
export class GeminiQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiQuotaError";
  }
}

/** Transient error that exhausted all retries. */
export class GeminiRetryExhaustedError extends Error {
  public attempts: number;
  constructor(message: string, attempts: number) {
    super(message);
    this.name = "GeminiRetryExhaustedError";
    this.attempts = attempts;
  }
}

// ── Configuration ──

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

const RETRY = {
  maxAttempts: 3,
  initialDelayMs: 2000,
  maxDelayMs: 20000,
  backoffMultiplier: 2.5,
} as const;

const SYSTEM_PROMPT = `You are SnappWord, a language learning assistant that analyzes screenshots.

TASK: Extract vocabulary words from the screenshot image.

RULES:
1. IGNORE all UI chrome: status bar, battery, time, app buttons, ads, navigation elements.
2. FOCUS ONLY on language learning content: words, sentences, translations, exercises.
3. Identify the "target language" (what the user is learning) and "source language" (UI language, usually zh-TW).
4. For each learnable word or phrase, extract structured data.
5. If the screenshot contains exercise context (e.g., a sentence), include it.
6. If no example sentence is visible, generate ONE natural example sentence at the same difficulty level.
7. Detect the source app from visual cues (Duolingo green owl/UI, Netflix subtitle bar, etc.).

SUPPORTED LANGUAGES: en, ja, ko, es, fr, de

OUTPUT FORMAT (strict JSON):
{
  "source_app": "Duolingo" | "Netflix" | "YouTube" | "General",
  "target_lang": "en" | "ja" | "ko" | "es" | "fr" | "de",
  "source_lang": "zh-TW",
  "words": [
    {
      "word": "the vocabulary word",
      "pronunciation": "IPA or romaji or pinyin",
      "translation": "Chinese translation",
      "context_sentence": "original sentence from screenshot (if any)",
      "context_trans": "Chinese translation of the sentence",
      "tags": ["Part of Speech", "Topic"],
      "ai_example": "AI-generated example sentence (always provide one)"
    }
  ]
}

If the image contains NO recognizable language learning content, return:
{"source_app": "General", "target_lang": "en", "source_lang": "zh-TW", "words": []}`;

const EMPTY_RESULT: GeminiParseResult = {
  source_app: "General",
  target_lang: "en",
  source_lang: "zh-TW",
  words: [],
};

// ── Error Classification ──

function classifyError(err: unknown): "quota" | "retryable" | "fatal" {
  const msg = err instanceof Error ? err.message : String(err);

  // Quota / billing / free tier issues — won't resolve with retry
  if (
    msg.includes("free_tier") ||
    msg.includes("billing") ||
    msg.includes("quota") ||
    (msg.includes("429") && msg.includes("limit: 0"))
  ) {
    return "quota";
  }

  // Transient errors — worth retrying
  if (
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("500") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("fetch failed") ||
    msg.includes("network")
  ) {
    return "retryable";
  }

  return "fatal";
}

/** Extract Google's suggested retry delay from error message (e.g., "retryDelay: 12s"). */
function extractRetryDelay(err: unknown): number | null {
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/retry\s*(?:in|Delay['":])\s*(\d+(?:\.\d+)?)\s*s/i);
  return match ? Math.ceil(parseFloat(match[1]) * 1000) : null;
}

// ── Core API Call ──

function getClient(): GoogleGenerativeAI {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenerativeAI(key);
}

async function callModel(
  modelName: string,
  imageBytes: Buffer,
  mimeType: string
): Promise<[GeminiParseResult, { latencyMs: number; tokenCount: number | null; model: string }]> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  });

  const start = Date.now();

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBytes.toString("base64"),
        mimeType,
      },
    },
    "Analyze this screenshot and extract vocabulary words. Output strict JSON only.",
  ]);

  const latencyMs = Date.now() - start;
  const response = result.response;
  const rawText = response.text();
  const tokenCount = response.usageMetadata?.totalTokenCount ?? null;
  const parsed = parseResponse(rawText);

  return [parsed, { latencyMs, tokenCount, model: modelName }];
}

// ── Retry Logic ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry(
  modelName: string,
  imageBytes: Buffer,
  mimeType: string
): Promise<[GeminiParseResult, { latencyMs: number; tokenCount: number | null; model: string }]> {
  let lastError: Error = new Error("No attempts made");

  for (let attempt = 0; attempt < RETRY.maxAttempts; attempt++) {
    try {
      return await callModel(modelName, imageBytes, mimeType);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const errorType = classifyError(err);

      // Quota errors: don't retry, throw immediately
      if (errorType === "quota") {
        throw new GeminiQuotaError(lastError.message);
      }

      // Fatal errors: don't retry
      if (errorType === "fatal") {
        throw lastError;
      }

      // Retryable: check if we have more attempts
      if (attempt >= RETRY.maxAttempts - 1) {
        throw new GeminiRetryExhaustedError(
          `${modelName} failed after ${RETRY.maxAttempts} attempts: ${lastError.message}`,
          RETRY.maxAttempts
        );
      }

      // Calculate delay: use Google's suggestion or exponential backoff
      const googleDelay = extractRetryDelay(err);
      const backoffDelay = Math.min(
        RETRY.initialDelayMs * Math.pow(RETRY.backoffMultiplier, attempt),
        RETRY.maxDelayMs
      );
      const delay = googleDelay ?? backoffDelay;

      console.log(
        `[Gemini] ${modelName} attempt ${attempt + 1}/${RETRY.maxAttempts} failed (${errorType}), retrying in ${delay}ms`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

// ── Public API ──

/**
 * Analyze a screenshot with Gemini AI.
 * Tries primary model with retries, then falls back to alternative models.
 */
export async function analyzeScreenshot(
  imageBytes: Buffer,
  mimeType: string = "image/jpeg"
): Promise<[GeminiParseResult, { latencyMs: number; tokenCount: number | null; model: string }]> {
  let lastError: Error = new Error("No models available");

  for (let i = 0; i < MODELS.length; i++) {
    const modelName = MODELS[i];
    try {
      const result = await callWithRetry(modelName, imageBytes, mimeType);
      if (i > 0) {
        console.log(`[Gemini] Succeeded with fallback model: ${modelName}`);
      }
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Quota errors affect ALL models (same API key), don't bother trying fallback
      if (err instanceof GeminiQuotaError) {
        throw err;
      }

      // Log and try next model
      if (i < MODELS.length - 1) {
        console.log(
          `[Gemini] ${modelName} exhausted, trying fallback: ${MODELS[i + 1]}`
        );
      }
    }
  }

  throw lastError;
}

// ── Response Parsing ──

/** Parse Gemini response with 3 fallback strategies. */
function parseResponse(raw: string): GeminiParseResult {
  // Strategy 1: direct parse
  try {
    return validateResult(JSON.parse(raw));
  } catch { /* continue */ }

  // Strategy 2: extract from markdown fences
  const fenceMatch = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenceMatch) {
    try {
      return validateResult(JSON.parse(fenceMatch[1]));
    } catch { /* continue */ }
  }

  // Strategy 3: find first { ... } block
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return validateResult(JSON.parse(braceMatch[0]));
    } catch { /* continue */ }
  }

  return EMPTY_RESULT;
}

/** Ensure result has required fields with defaults. */
function validateResult(data: Record<string, unknown>): GeminiParseResult {
  return {
    source_app: (data.source_app as string) || "General",
    target_lang: (data.target_lang as string) || "en",
    source_lang: (data.source_lang as string) || "zh-TW",
    words: Array.isArray(data.words)
      ? data.words.map((w: Record<string, unknown>) => ({
          word: (w.word as string) || "",
          pronunciation: (w.pronunciation as string) || "",
          translation: (w.translation as string) || "",
          context_sentence: (w.context_sentence as string) || "",
          context_trans: (w.context_trans as string) || "",
          tags: Array.isArray(w.tags) ? (w.tags as string[]) : [],
          ai_example: (w.ai_example as string) || "",
        }))
      : [],
  };
}
