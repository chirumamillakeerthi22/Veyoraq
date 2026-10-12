import { audienceValues } from "@/lib/audience";
import { errorResponse, isSameOrigin, styleLimiter } from "@/lib/fix-my-style/http";
import { detectImageType } from "@/lib/fix-my-style/image-type";
import { limits } from "@/lib/fix-my-style/limits";
import type { StyleEvent } from "@/lib/fix-my-style/schema";
import { analyzeOutfit, createStyledImage } from "@/lib/fix-my-style/style";
import { clientKey, describeWait } from "@/lib/stylist/rate-limit";
import { z } from "zod";

export const maxDuration = 60;

// Base64 text is about 4/3 of the bytes it carries, plus a little JSON.
const MAX_BODY_CHARACTERS = Math.ceil((limits.preparedPhotoBytes * 4) / 3) + 1_000;

const bodySchema = z
  .object({ image: z.string().min(1), audience: z.enum(audienceValues).optional() })
  .strict();
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/*
  Styles the outfit in one photo. The answer streams back as one JSON object per
  line: the written analysis first (so it can be shown at once), then the image
  step's outcome. The photo is used for this request only. It is not stored, and
  nothing about it is logged.
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

  const limit = styleLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return errorResponse(
      "rate_limited",
      `You've styled a lot of outfits. Please try again in ${describeWait(limit.retryAfterSeconds)}.`,
      { retryAfterSeconds: limit.retryAfterSeconds },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const reference = { mimeType, base64: parsed.data.image };
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StyleEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const analysis = await analyzeOutfit(reference, parsed.data.audience);
        if (!analysis.ok) {
          send({ type: "error", message: analysis.message });
          return;
        }
        send({ type: "analysis", data: analysis.data });

        if (!analysis.data.isOutfit) {
          send({
            type: "image",
            data: {
              status: "skipped",
              message: "We couldn't see an outfit to style in that photo.",
            },
          });
        } else {
          send({ type: "image", data: await createStyledImage(analysis.data, reference) });
        }
        send({ type: "done" });
      } catch {
        send({ type: "error", message: "Something went wrong. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
