import type { AuthErrorLike } from "./messages";

/*
  Politeness for Supabase's rate limits. These helpers never retry anything: they
  only remember that a limit was hit (or that this browser has already asked for
  several emails) and keep the buttons disabled for a while, so a visitor cannot
  burn the project's shared email allowance by pressing the same button repeatedly.
  This is not a security control; the real limits are enforced by Supabase.
*/

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const EMAIL_LIMIT_WAIT = 300; // the built-in sender's hourly limit has no countdown
const GENERIC_WAIT = 60; // Supabase's per-address cooldown is 60 seconds

// How long to wait after this error, in seconds, or null if it is not a rate limit.
export function retryDelaySeconds(error: AuthErrorLike): number | null {
  if (!error) return null;
  const code = (error.code ?? "").toLowerCase();
  const message = error.message ?? "";
  const lower = message.toLowerCase();

  // "For security purposes, you can only request this after 42 seconds."
  const match = /after (\d+) seconds?/i.exec(message);
  if (match) return Math.min(Number(match[1]) + 1, 3_600);

  if (code === "over_email_send_rate_limit" || lower.includes("email rate limit")) {
    return EMAIL_LIMIT_WAIT;
  }
  if (
    code === "over_request_rate_limit" ||
    error.status === 429 ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return GENERIC_WAIT;
  }
  return null;
}

function safe<T>(action: () => T, fallback: T): T {
  try {
    return action();
  } catch {
    return fallback; // storage can be blocked (private mode); then nothing is remembered
  }
}

export function startCooldown(
  storage: StorageLike,
  key: string,
  seconds: number,
  now = Date.now(),
) {
  safe(() => storage.setItem(key, String(now + seconds * 1_000)), undefined);
}

// Whole seconds left on a remembered cooldown (0 when finished or never set).
export function readCooldownSeconds(
  storage: StorageLike,
  key: string,
  now = Date.now(),
): number {
  const raw = safe(() => storage.getItem(key), null);
  const until = Number(raw);
  if (!raw || !Number.isFinite(until)) return 0;
  const left = Math.ceil((until - now) / 1_000);
  if (left <= 0) {
    safe(() => storage.removeItem(key), undefined);
    return 0;
  }
  return left;
}

export type BudgetCheck = { allowed: true } | { allowed: false; retryAfterSeconds: number };

function readTimes(storage: StorageLike, key: string, windowMs: number, now: number) {
  const raw = safe(() => storage.getItem(key), null);
  try {
    const list: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (value): value is number => typeof value === "number" && now - value < windowMs,
    );
  } catch {
    return [];
  }
}

// Allows at most `max` email-sending actions per window from this browser.
export function checkSendBudget(
  storage: StorageLike,
  key: string,
  max: number,
  windowMs: number,
  now = Date.now(),
): BudgetCheck {
  const times = readTimes(storage, key, windowMs, now);
  if (times.length < max) return { allowed: true };
  const oldest = Math.min(...times);
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1_000)),
  };
}

export function recordSend(
  storage: StorageLike,
  key: string,
  windowMs: number,
  now = Date.now(),
) {
  const times = readTimes(storage, key, windowMs, now);
  safe(() => storage.setItem(key, JSON.stringify([...times, now])), undefined);
}

export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}
