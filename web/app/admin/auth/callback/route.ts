// Redirect to client-side callback page which handles code exchange
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const url = new URL("/admin/auth/confirm", request.url);
  if (code) url.searchParams.set("code", code);
  return NextResponse.redirect(url);
}
