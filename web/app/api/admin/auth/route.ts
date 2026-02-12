import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_token";
const MAX_AGE = 86400; // 24 hours

function getPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

function sign(timestamp: string): string {
  return createHmac("sha256", getPassword())
    .update(timestamp)
    .digest("hex");
}

function verifyToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;

  // Check expiry
  if (Date.now() - ts > MAX_AGE * 1000) return false;

  const expected = sign(timestamp);
  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/** POST — Login: verify password, set cookie */
export async function POST(request: NextRequest) {
  const password = getPassword();
  if (!password) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD not configured" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  if (body.password !== password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const timestamp = String(Date.now());
  const token = `${timestamp}.${sign(timestamp)}`;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return res;
}

/** GET — Verify cookie */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}

/** DELETE — Logout: clear cookie */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
