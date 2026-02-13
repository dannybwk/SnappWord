import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

/** POST — Check if email is in whitelist */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = (body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const allowed = getAdminEmails();
  if (allowed.length === 0) {
    return NextResponse.json({ error: "ADMIN_EMAILS not configured" }, { status: 500 });
  }

  if (!allowed.includes(email)) {
    return NextResponse.json({ error: "Unauthorized email" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}

/** GET — Verify Supabase token + email whitelist */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const sb = getServiceClient();
  const { data: { user }, error } = await sb.auth.getUser(token);

  if (error || !user?.email) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const allowed = getAdminEmails();
  if (!allowed.includes(user.email.toLowerCase())) {
    return NextResponse.json({ authenticated: false, error: "Not an admin" }, { status: 403 });
  }

  return NextResponse.json({ authenticated: true, email: user.email });
}
