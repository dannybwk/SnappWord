/**
 * Gemini 1.5 Flash multimodal analysis for screenshots.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiParseResult } from "./types";

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

function getClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
}

/**
 * Send screenshot to Gemini for analysis.
 * Returns [parsedResult, metadata].
 */
export async function analyzeScreenshot(
  imageBytes: Buffer,
  mimeType: string = "image/jpeg"
): Promise<[GeminiParseResult, { latencyMs: number; tokenCount: number | null }]> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
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

  const tokenCount =
    response.usageMetadata?.totalTokenCount ?? null;

  const parsed = parseResponse(rawText);

  return [parsed, { latencyMs, tokenCount }];
}

/** Parse Gemini response with 3 fallback attempts. */
function parseResponse(raw: string): GeminiParseResult {
  // Attempt 1: direct parse
  try {
    const data = JSON.parse(raw);
    return validateResult(data);
  } catch {
    // continue
  }

  // Attempt 2: extract from markdown fences
  const fenceMatch = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenceMatch) {
    try {
      const data = JSON.parse(fenceMatch[1]);
      return validateResult(data);
    } catch {
      // continue
    }
  }

  // Attempt 3: find first { ... } block
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const data = JSON.parse(braceMatch[0]);
      return validateResult(data);
    } catch {
      // continue
    }
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
