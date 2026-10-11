import type { SupabaseClient } from "@supabase/supabase-js";
import { friendlyAuthMessage } from "./messages";
import { safeNextPath } from "./redirect";

// Only the three calls we use, so tests can pass a small stand-in.
export type AuthApi = Pick<
  SupabaseClient["auth"],
  "signInWithOAuth" | "signInWithOtp" | "verifyOtp"
>;

export type ActionResult = { ok: true } | { ok: false; message: string };

export function isPlausibleEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function isSixDigitCode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

function callbackUrl(origin: string, path: string, next: string) {
  const url = new URL(path, origin);
  url.searchParams.set("next", safeNextPath(next));
  return url.toString();
}

/*
  Starts Google sign-in. On success the browser leaves for Google, so there is
  nothing more to do here; on failure the visitor stays on the page.
*/
export async function signInWithGoogle(
  auth: AuthApi,
  origin: string,
  next = "/account",
): Promise<ActionResult> {
  const { error } = await auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(origin, "/auth/callback", next) },
  });
  return error ? { ok: false, message: friendlyAuthMessage(error) } : { ok: true };
}

// Emails a one-time code (and a sign-in link). Creates the account on first use.
export async function sendEmailCode(
  auth: AuthApi,
  email: string,
  origin: string,
  next = "/account",
): Promise<ActionResult> {
  if (!isPlausibleEmail(email)) {
    return { ok: false, message: "That email address doesn't look right." };
  }
  const { error } = await auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: callbackUrl(origin, "/auth/confirm", next),
      shouldCreateUser: true,
    },
  });
  return error ? { ok: false, message: friendlyAuthMessage(error) } : { ok: true };
}

export async function verifyEmailCode(
  auth: AuthApi,
  email: string,
  code: string,
): Promise<ActionResult> {
  if (!isSixDigitCode(code)) {
    return { ok: false, message: "Enter the 6-digit code from the email." };
  }
  const { error } = await auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: "email",
  });
  return error ? { ok: false, message: friendlyAuthMessage(error) } : { ok: true };
}
