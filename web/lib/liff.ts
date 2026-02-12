"use client";

import liff from "@line/liff";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

let initialized = false;

export async function initLiff(): Promise<void> {
  if (initialized) return;
  await liff.init({ liffId: LIFF_ID });
  initialized = true;
}

export function isLoggedIn(): boolean {
  return liff.isLoggedIn();
}

export function login(): void {
  liff.login({ redirectUri: window.location.href });
}

export function logout(): void {
  liff.logout();
  window.location.reload();
}

export async function getProfile(): Promise<{
  userId: string;
  displayName: string;
  pictureUrl?: string;
} | null> {
  try {
    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    };
  } catch {
    return null;
  }
}

export function isInLiffBrowser(): boolean {
  return liff.isInClient();
}

export { liff };
