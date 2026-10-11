import type { SupabaseClient } from "@supabase/supabase-js";
import { retryDelaySeconds } from "./cooldown";
import { friendlyAuthMessage, type AuthErrorLike } from "./messages";
import { validatePassword } from "./password";
import { safeNextPath } from "./redirect";

// Only the calls we use, so tests can pass a small stand-in.
export type AuthApi = Pick<
  SupabaseClient["auth"],
  | "signInWithOAuth"
  | "signInWithPassword"
  | "signUp"
  | "resetPasswordForEmail"
  | "updateUser"
>;

export type ActionFailure = {
  ok: false;
  message: string;
  // Set when Supabase's rate limit was hit: how long to leave the buttons disabled.
  retryAfterSeconds?: number;
};
export type ActionResult = { ok: true } | ActionFailure;
export type SignUpResult = { ok: true; signedIn: boolean } | ActionFailure;

export function isPlausibleEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function callbackUrl(origin: string, next: string) {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeNextPath(next));
  return url.toString();
}

function failure(error: AuthErrorLike): ActionFailure {
  const retryAfterSeconds = retryDelaySeconds(error);
  return {
    ok: false,
    message: friendlyAuthMessage(error),
    ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
  };
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
    options: { redirectTo: callbackUrl(origin, next) },
  });
  return error ? failure(error) : { ok: true };
}

export async function signInWithPassword(
  auth: AuthApi,
  email: string,
  password: string,
): Promise<ActionResult> {
  if (!isPlausibleEmail(email)) {
    return { ok: false, message: "That email address doesn't look right." };
  }
  if (!password) {
    return { ok: false, message: "Enter your password." };
  }
  const { error } = await auth.signInWithPassword({ email: email.trim(), password });
  return error ? failure(error) : { ok: true };
}

/*
  Creates an account with an email and password (the password is handled only by
  Supabase Auth). If the project requires email confirmation there is no session yet,
  and signedIn is false; if confirmation is switched off the visitor is signed in.
*/
export async function signUpWithPassword(
  auth: AuthApi,
  email: string,
  password: string,
  origin: string,
  next = "/account",
): Promise<SignUpResult> {
  if (!isPlausibleEmail(email)) {
    return { ok: false, message: "That email address doesn't look right." };
  }
  const problems = validatePassword(password, email);
  if (problems.length > 0) {
    return { ok: false, message: problems[0] };
  }
  const { data, error } = await auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: callbackUrl(origin, next) },
  });
  if (error) return failure(error);
  return { ok: true, signedIn: Boolean(data.session) };
}

// Always reports success when the request goes through, so it cannot be used to
// discover which email addresses have accounts.
export async function requestPasswordReset(
  auth: AuthApi,
  email: string,
  origin: string,
): Promise<ActionResult> {
  if (!isPlausibleEmail(email)) {
    return { ok: false, message: "That email address doesn't look right." };
  }
  const { error } = await auth.resetPasswordForEmail(email.trim(), {
    redirectTo: callbackUrl(origin, "/account/reset-password"),
  });
  return error ? failure(error) : { ok: true };
}

// Sets a new password for the signed-in (or recovering) visitor.
export async function updatePassword(
  auth: AuthApi,
  password: string,
  email = "",
): Promise<ActionResult> {
  const problems = validatePassword(password, email);
  if (problems.length > 0) {
    return { ok: false, message: problems[0] };
  }
  const { error } = await auth.updateUser({ password });
  return error ? failure(error) : { ok: true };
}
