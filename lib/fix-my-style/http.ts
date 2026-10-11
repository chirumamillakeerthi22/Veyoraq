import { createRateLimiter } from "@/lib/stylist/rate-limit";
import type { FixErrorCode } from "./schema";

// Shared pieces for the two FIX My Style API routes.

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

// Per visitor, in memory (a best-effort guard; the shared protection is the Vercel
// Firewall rule and the Gemini key quota, as for the outfit stylist).
export const analyzeLimiter = createRateLimiter({
  rules: [
    { windowMs: 10 * MINUTE, max: 20 },
    { windowMs: DAY, max: 80 },
  ],
});

export const outfitsLimiter = createRateLimiter({
  rules: [
    { windowMs: 10 * MINUTE, max: 10 },
    { windowMs: DAY, max: 40 },
  ],
});

const statusByCode: Record<FixErrorCode, number> = {
  invalid_input: 400,
  forbidden: 403,
  too_large: 413,
  unsupported_image: 415,
  not_configured: 503,
  rate_limited: 429,
  timeout: 504,
  refused: 422,
  incomplete: 502,
  invalid_output: 502,
  upstream_error: 502,
  no_combinations: 422,
};

export function errorResponse(
  code: FixErrorCode,
  message: string,
  extra?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return Response.json(
    { error: { code, message, ...extra } },
    { status: statusByCode[code], headers: { "Cache-Control": "no-store", ...headers } },
  );
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // not a browser cross-site request
  const host = request.headers.get("host");
  try {
    return host !== null && new URL(origin).host === host;
  } catch {
    return false;
  }
}
