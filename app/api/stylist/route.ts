import { generateOutfits } from "@/lib/stylist/generate";
import {
  clientKey,
  describeWait,
  stylistLimiter,
} from "@/lib/stylist/rate-limit";
import { stylistInputSchema, type StylistErrorCode } from "@/lib/stylist/schema";
import { z } from "zod";

// Generating outfits calls an external AI service, which can take a while.
export const maxDuration = 60;

const MAX_BODY_CHARACTERS = 4_000;

const statusByCode: Record<StylistErrorCode, number> = {
  invalid_input: 400,
  forbidden: 403,
  too_large: 413,
  not_configured: 503,
  rate_limited: 429,
  timeout: 504,
  refused: 422,
  incomplete: 502,
  invalid_output: 502,
  upstream_error: 502,
};

function errorResponse(
  code: StylistErrorCode,
  message: string,
  extra?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return Response.json(
    { error: { code, message, ...extra } },
    {
      status: statusByCode[code],
      headers: { "Cache-Control": "no-store", ...headers },
    },
  );
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // not a browser cross-site request
  const host = request.headers.get("host");
  try {
    return host !== null && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return errorResponse("forbidden", "This request isn't allowed.");
  }

  const body = await request.text();
  if (body.length > MAX_BODY_CHARACTERS) {
    return errorResponse("too_large", "That request is too large.");
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return errorResponse("invalid_input", "Please check your answers and try again.");
  }

  const parsed = stylistInputSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse(
      "invalid_input",
      "Please check your answers and try again.",
      { fields: z.flattenError(parsed.error).fieldErrors },
    );
  }

  // Only well-formed requests that would reach the AI count against a visitor's allowance.
  const limit = stylistLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return errorResponse(
      "rate_limited",
      `You've asked for a lot of outfit ideas. Please try again in ${describeWait(limit.retryAfterSeconds)}.`,
      { retryAfterSeconds: limit.retryAfterSeconds },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const result = await generateOutfits(parsed.data);
  if (!result.ok) {
    return errorResponse(result.code, result.message);
  }

  return Response.json(result.data, {
    headers: { "Cache-Control": "no-store" },
  });
}
