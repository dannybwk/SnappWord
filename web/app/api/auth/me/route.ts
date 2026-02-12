/**
 * GET /api/auth/me?lineUserId=U...
 * Returns the Supabase DB user for a given LINE user ID.
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/server/supabase-server";

export async function GET(request: NextRequest) {
  const lineUserId = request.nextUrl.searchParams.get("lineUserId");

  if (!lineUserId) {
    return NextResponse.json({ error: "Missing lineUserId" }, { status: 400 });
  }

  try {
    const user = await getOrCreateUser(lineUserId);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
