import { generateImage } from "@/lib/ai/gemini-image";
import { errorResponse, imageLimiter, isSameOrigin } from "@/lib/fix-my-style/http";
import { clientKey, describeWait } from "@/lib/stylist/rate-limit";
import { outfitSchema } from "@/lib/stylist/schema";
import { z } from "zod";

export const maxDuration = 60;

const MAX_BODY_CHARACTERS = 6_000;
const bodySchema = z.object({ outfit: outfitSchema }).strict();

/*
  Creates one picture for an outfit concept from the quiz. It receives only the
  validated outfit text, never a photo. It reports plainly when image generation is
  not switched on, rather than returning anything made up.
*/
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse("forbidden", "This request isn't allowed.");

  const body = await request.text();
  if (body.length > MAX_BODY_CHARACTERS) return errorResponse("too_large", "That request is too large.");

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return errorResponse("invalid_input", "We couldn't read that request.");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return errorResponse("invalid_input", "We couldn't read that outfit.");

  const limit = imageLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return errorResponse(
      "rate_limited",
      `You've asked for a lot of images. Please try again in ${describeWait(limit.retryAfterSeconds)}.`,
      { retryAfterSeconds: limit.retryAfterSeconds },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const { outfit } = parsed.data;
  const pieces = outfit.pieces.map((piece) => `${piece.colour} ${piece.description}`).join("; ");
  const result = await generateImage({
    prompt: [
      "Create one photorealistic editorial fashion photograph of a complete outfit laid out or worn, in a plain softly lit studio.",
      `The outfit is called "${outfit.name}". Pieces: ${pieces}.`,
      "Show every piece clearly in the stated colours. No text, logos or watermarks.",
    ].join(" "),
  });

  if (result.ok) {
    return Response.json(
      { status: "generated", mimeType: result.mimeType, data: result.data },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  const status =
    result.code === "not_configured" ? "not_configured" : result.code === "quota" ? "unavailable" : "failed";
  return Response.json(
    { status, message: result.message },
    { headers: { "Cache-Control": "no-store" } },
  );
}
