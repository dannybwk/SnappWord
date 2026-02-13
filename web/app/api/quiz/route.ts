/**
 * GET  /api/quiz?userId=UUID  → quiz questions from due cards
 * POST /api/quiz              → submit answer { userId, cardId, correct }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getDueCards,
  getAllCardTranslations,
  advanceCardSRS,
  resetCardSRS,
} from "@/lib/server/supabase-server";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const [dueCards, allTranslations] = await Promise.all([
    getDueCards(userId),
    getAllCardTranslations(userId),
  ]);

  if (dueCards.length === 0) {
    return NextResponse.json({ questions: [], totalDue: 0 });
  }

  // Need at least 4 unique translations to make valid quiz questions
  const uniqueTranslations = new Set(allTranslations.map((c) => c.translation));
  if (uniqueTranslations.size < 4) {
    return NextResponse.json({
      questions: [],
      totalDue: dueCards.length,
      needMoreCards: true,
    });
  }

  // Pick up to 10 cards for this session
  const quizCards = dueCards.slice(0, 10);

  const questions = quizCards.map((card: Record<string, unknown>) => {
    const cardLang = card.target_lang as string;
    const cardTranslation = card.translation as string;

    // Prefer distractors from same language, exclude correct answer
    const sameLang = allTranslations.filter(
      (c) => c.id !== card.id && c.translation !== cardTranslation && c.target_lang === cardLang
    );
    const diffLang = allTranslations.filter(
      (c) => c.id !== card.id && c.translation !== cardTranslation && c.target_lang !== cardLang
    );

    const pool = [...shuffleArray(sameLang), ...shuffleArray(diffLang)];

    // Deduplicate translations and pick 3
    const seen = new Set<string>([cardTranslation]);
    const distractors: string[] = [];
    for (const item of pool) {
      if (distractors.length >= 3) break;
      if (!seen.has(item.translation)) {
        seen.add(item.translation);
        distractors.push(item.translation);
      }
    }

    const options = shuffleArray([cardTranslation, ...distractors]);

    return {
      cardId: card.id,
      word: card.word,
      pronunciation: (card.pronunciation as string) || "",
      language: cardLang,
      correctAnswer: cardTranslation,
      options,
    };
  });

  return NextResponse.json({ questions, totalDue: dueCards.length });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, cardId, correct } = body;

  if (!userId || !cardId || typeof correct !== "boolean") {
    return NextResponse.json(
      { error: "Missing userId, cardId, or correct" },
      { status: 400 }
    );
  }

  // Verify card belongs to the user before updating SRS
  const sb = getClient();
  const { data: card } = await sb
    .from("vocab_cards")
    .select("id")
    .eq("id", cardId)
    .eq("user_id", userId)
    .single();

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (correct) {
    await advanceCardSRS(cardId);
  } else {
    await resetCardSRS(cardId);
  }

  return NextResponse.json({ status: "ok" });
}
