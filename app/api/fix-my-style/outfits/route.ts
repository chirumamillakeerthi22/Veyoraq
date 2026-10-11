import { errorResponse, isSameOrigin, outfitsLimiter } from "@/lib/fix-my-style/http";
import { createOutfits } from "@/lib/fix-my-style/outfits";
import { outfitRequestSchema } from "@/lib/fix-my-style/schema";
import { clientKey, describeWait } from "@/lib/stylist/rate-limit";
import { z } from "zod";

export const maxDuration = 60;

// 40 items of short text fit comfortably in this.
const MAX_BODY_CHARACTERS = 30_000;

/*
  Creates outfits from the wardrobe the person sends. Only written descriptions of
  the garments arrive here: no photos and no account details.
*/
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
    return errorResponse("invalid_input", "Please check your choices and try again.");
  }

  const parsed = outfitRequestSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("invalid_input", "Please check your choices and try again.", {
      fields: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const limit = outfitsLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return errorResponse(
      "rate_limited",
      `You've asked for a lot of outfit ideas. Please try again in ${describeWait(limit.retryAfterSeconds)}.`,
      { retryAfterSeconds: limit.retryAfterSeconds },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const result = await createOutfits(parsed.data);
  if (!result.ok) return errorResponse(result.code, result.message);

  return Response.json(result.data, { headers: { "Cache-Control": "no-store" } });
}
