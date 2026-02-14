/**
 * GET    /api/word-lists?userId=UUID        → user's lists + language groups
 * POST   /api/word-lists  { userId, name, emoji }  → create list
 * DELETE /api/word-lists  { userId, listId }        → delete list
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getUserById,
  getUserTier,
  getUserWordLists,
  createWordList,
  deleteWordList,
} from "@/lib/server/supabase-server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const result = await getUserWordLists(userId);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, name, emoji } = body;

  if (!userId || !name) {
    return NextResponse.json(
      { error: "Missing userId or name" },
      { status: 400 }
    );
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const tier = getUserTier(user);
  const result = await createWordList(userId, name, emoji || "📁", tier);

  if (result.error === "free_limit") {
    return NextResponse.json(
      { error: "免費用戶最多建立 3 個自訂清單，升級即可解鎖無限清單" },
      { status: 403 }
    );
  }

  return NextResponse.json({ list: result.list });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { userId, listId } = body;

  if (!userId || !listId) {
    return NextResponse.json(
      { error: "Missing userId or listId" },
      { status: 400 }
    );
  }

  const deleted = await deleteWordList(listId, userId);
  if (!deleted) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
