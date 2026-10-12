import { audienceValues } from "@/lib/audience";
import { errorResponse, isSameOrigin } from "@/lib/fix-my-style/http";
import { detectImageType } from "@/lib/fix-my-style/image-type";
import { limits } from "@/lib/fix-my-style/limits";
import { planLooks, renderLook } from "@/lib/hair-studio/generate";
import { hairRetryLimiter, hairRunLimiter } from "@/lib/hair-studio/http";
import { parseHairAnswers } from "@/lib/hair-studio/quiz";
import { conceptSchema, type HairEvent } from "@/lib/hair-studio/schema";
import { clientKey, describeWait } from "@/lib/stylist/rate-limit";
import { z } from "zod";

export const maxDuration = 120;

// Base64 text is about 4/3 of the bytes it carries, plus the answers and a concept.
const MAX_BODY_CHARACTERS = Math.ceil((limits.preparedPhotoBytes * 4) / 3) + 6_000;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

const bodySchema = z
  .object({
    image: z.string().min(1),
    answers: z.unknown(),
    // "all" plans four looks and renders them; "one" re-renders a single idea.
    mode: z.enum(["all", "one"]),
    index: z.number().int().min(0).max(3).optional(),
    concept: z.unknown().optional(),
    audience: z.enum(audienceValues).optional(),
  })
  .strict();

/*
  Creates up to four hairstyle previews from the person's photo and answers. The
  answer streams back one JSON object per line: the four ideas first (so they can be
  shown at once), then each picture as it finishes, so one slow or failed picture
  never hides the others. The photo is used for this request only. It is not stored
  and nothing about it is logged.
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

  const answers = parseHairAnswers(parsed.data.answers);
  if (!answers) return errorResponse("invalid_input", "Please check your answers and try again.");

  const concept = parsed.data.mode === "one" ? conceptSchema.safeParse(parsed.data.concept) : null;
  if (parsed.data.mode === "one" && (!concept?.success || parsed.data.index === undefined)) {
    return errorResponse("invalid_input", "We couldn't read that look.");
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

  const limiter = parsed.data.mode === "all" ? hairRunLimiter : hairRetryLimiter;
  const limit = limiter.check(clientKey(request));
  if (!limit.allowed) {
    return errorResponse(
      "rate_limited",
      `You've made a lot of hair previews. Please try again in ${describeWait(limit.retryAfterSeconds)}.`,
      { retryAfterSeconds: limit.retryAfterSeconds },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const reference = { mimeType, base64: parsed.data.image };
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: HairEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        if (parsed.data.mode === "one" && concept?.success) {
          send({ type: "image", index: parsed.data.index!, image: await renderLook(concept.data, answers, reference) });
          send({ type: "done" });
          return;
        }

        const plan = await planLooks(reference, answers, parsed.data.audience);
        if (!plan.ok) {
          send({ type: "error", message: plan.message });
          return;
        }
        send({ type: "plan", concepts: plan.concepts, caveat: plan.caveat });

        // All four at once; each result is sent the moment it is ready.
        await Promise.all(
          plan.concepts.map(async (item, index) => {
            const image = await renderLook(item, answers, reference);
            send({ type: "image", index, image });
          }),
        );
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
