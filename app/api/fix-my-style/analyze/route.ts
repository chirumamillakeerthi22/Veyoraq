import { analyzeGarment } from "@/lib/fix-my-style/analyze";
import { analyzeLimiter, errorResponse, isSameOrigin } from "@/lib/fix-my-style/http";
import { detectImageType } from "@/lib/fix-my-style/image-type";
import { limits } from "@/lib/fix-my-style/options";
import { clientKey, describeWait } from "@/lib/stylist/rate-limit";
import { z } from "zod";

export const maxDuration = 60;

// Base64 text is about 4/3 of the bytes it carries, plus a little JSON.
const MAX_BODY_CHARACTERS = Math.ceil((limits.preparedPhotoBytes * 4) / 3) + 1_000;

const bodySchema = z.object({ image: z.string().min(1) }).strict();
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/*
  Suggests details for one garment photo. The photo is received, checked, sent to
  Gemini for this one request, and then discarded: nothing is stored or logged here.
*/
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return errorResponse("forbidden", "This request isn't allowed.");
  }

  const body = await request.text();
  if (body.length > MAX_BODY_CHARACTERS) {
    return errorResponse("too_large", "That photo is too large. Try a smaller one.");
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return errorResponse("invalid_input", "We couldn't read that request.");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success || !BASE64.test(parsed.data.image)) {
    return errorResponse("invalid_input", "We couldn't read that photo.");
  }

  const bytes = new Uint8Array(Buffer.from(parsed.data.image, "base64"));
  if (bytes.length === 0 || bytes.length > limits.preparedPhotoBytes) {
    return errorResponse("too_large", "That photo is too large. Try a smaller one.");
  }
  // The type comes from the file's own bytes, not from anything the client said.
  const mimeType = detectImageType(bytes);
  if (!mimeType) {
    return errorResponse("unsupported_image", "Please use a JPEG, PNG or WebP photo.");
  }

  const limit = analyzeLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return errorResponse(
      "rate_limited",
      `You've asked for a lot of suggestions. Please try again in ${describeWait(limit.retryAfterSeconds)}.`,
      { retryAfterSeconds: limit.retryAfterSeconds },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const result = await analyzeGarment({ mimeType, base64: parsed.data.image });
  if (!result.ok) return errorResponse(result.code, result.message);

  return Response.json(result.data, { headers: { "Cache-Control": "no-store" } });
}
