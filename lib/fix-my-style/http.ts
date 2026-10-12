import { createRateLimiter } from "@/lib/stylist/rate-limit";

export type FixErrorCode =
  | "invalid_input"
  | "forbidden"
  | "too_large"
  | "unsupported_image"
  | "not_configured"
  | "rate_limited"
  | "timeout"
  | "refused"
  | "incomplete"
  | "invalid_output"
  | "upstream_error";

// Shared pieces for the FIX My Style API route.

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

// Per visitor, in memory (a best-effort guard; the shared protection is the Vercel
// Firewall rule and the Gemini key quota, as for the outfit stylist). Image
// generation is the costly step, so the allowance is small.
export const styleLimiter = createRateLimiter({
  rules: [
    { windowMs: 10 * MINUTE, max: 6 },
    { windowMs: DAY, max: 30 },
  ],
});

// Pictures for quiz outfits (text only, no photo). Also a costly step.
export const imageLimiter = createRateLimiter({
  rules: [
    { windowMs: 10 * MINUTE, max: 6 },
    { windowMs: DAY, max: 30 },
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
