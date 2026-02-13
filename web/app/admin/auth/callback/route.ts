import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server-client";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const redirectUrl = new URL("/admin", request.url);

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Code exchange failed:", error.message);
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set("error", "auth_failed");
    }
  } else {
    redirectUrl.pathname = "/admin/login";
  }

  return NextResponse.redirect(redirectUrl);
}
