import { errorResponse, isSameOrigin } from "@/lib/fix-my-style/http";
import { detectImageType } from "@/lib/fix-my-style/image-type";
import { limits } from "@/lib/fix-my-style/limits";
import { analyseFitPhoto, fitPhotoLimiter } from "@/lib/fit-guidance/generate";
import { photoRequestSchema } from "@/lib/fit-guidance/schema";
import { clientKey, describeWait } from "@/lib/stylist/rate-limit";

export const maxDuration = 60;

// Base64 text is about 4/3 of the bytes it carries, plus the small request fields.
const MAX_BODY_CHARACTERS = Math.ceil((limits.preparedPhotoBytes * 4) / 3) + 2_000;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/*
  Optional: looks at a full-body photo for general, tentative observations about
  proportions. The photo is used for this request only. It is not stored, and nothing
  about it is logged.
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
  const parsed = photoRequestSchema.safeParse(json);
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

  const limit = fitPhotoLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return errorResponse(
      "rate_limited",
      `You've run a lot of photo checks. Please try again in ${describeWait(limit.retryAfterSeconds)}.`,
      { retryAfterSeconds: limit.retryAfterSeconds },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const result = await analyseFitPhoto({ mimeType, base64: parsed.data.image }, parsed.data.audience);
  if (!result.ok) {
    if (result.code === "not_configured") return errorResponse("not_configured", result.message);
    // A photo that cannot be used is a normal outcome, not a server fault.
    return Response.json(
      { error: { code: result.code, message: result.message } },
      { status: result.code === "failed" ? 502 : 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(result.analysis, { headers: { "Cache-Control": "no-store" } });
}
