import { callGeminiJson } from "@/lib/ai/gemini-json";
import type { Audience } from "@/lib/audience";
import { createRateLimiter } from "@/lib/stylist/rate-limit";
import { photoAnalysisSchema, type PhotoAnalysis } from "./schema";

/*
  Server-only. One call to the vision-capable text model: it looks at a full-body
  photo and returns a few cautious, general observations about proportions plus a
  tentative style descriptor. It cannot measure anyone, and the prompt forbids
  pretending it can. The photo is used for this request only and is never stored or
  logged.
*/

const MINUTE = 60_000;
export const fitPhotoLimiter = createRateLimiter({
  rules: [
    { windowMs: 10 * MINUTE, max: 5 },
    { windowMs: 24 * 60 * MINUTE, max: 20 },
  ],
});

const instructions = `You are a careful, kind clothing-fit guide. You look at one full-body photo to offer a few GENERAL, TENTATIVE observations about proportions for choosing clothes. You are not measuring anyone.

- photoUsable: true only if most of the body is visible well enough to compare shoulders, waist and hips. If not (face only, cropped, heavy baggy clothing hiding the outline, blurred, no person), set false, explain briefly in photoNote, set shape to "unsure" and return no observations.
- shape is one of: hourglass, pear, apple, rectangle, inverted-triangle, trapezoid, unsure. These are optional style descriptors, not medical categories. Prefer "unsure" whenever clothing, pose, angle or lighting make the proportions unclear. confidence is low or medium, never higher.
- observations: up to 4 short, neutral sentences about visual proportion only (for example the relative width of the shoulder line and the hip line, or how defined the waist looks in the clothing worn). Describe clothing-relevant proportions, never the person.
- Never comment on weight, size, health, age, attractiveness, skin, face, ethnicity or anything sensitive. Never suggest anything needs hiding, fixing or correcting. Never give measurements or numbers. Never mention prices, brands, shops or links. Do not identify the person.
- "styleFor" in the request (women or men) says which style audience the person chose; it only affects which descriptors you lean towards, and you must not assume anything about the person from it.
- Be honest that a photo cannot give reliable measurements.`;

export type PhotoResult =
  | { ok: true; analysis: PhotoAnalysis }
  | { ok: false; code: "not_configured" | "no_photo" | "failed"; message: string };

const FAILED = "We couldn't look at that photo just now. You can continue without it.";

export async function analyseFitPhoto(
  image: { mimeType: string; base64: string },
  audience?: Audience,
): Promise<PhotoResult> {
  const result = await callGeminiJson({
    label: "fit-photo",
    system: instructions,
    parts: [
      { inlineData: { mimeType: image.mimeType, data: image.base64 } },
      { text: `styleFor: ${audience ?? "not given"}` },
    ],
    schema: photoAnalysisSchema,
    maxOutputTokens: 800,
    timeoutMs: 40_000,
    notConfiguredMessage: "Photo analysis isn't available yet. You can continue without it.",
    genericMessage: FAILED,
    withheldMessage: "We couldn't use that photo. You can try another or continue without it.",
  });

  if (!result.ok) {
    return {
      ok: false,
      code: result.code === "not_configured" ? "not_configured" : "failed",
      message: result.message,
    };
  }

  const analysis = result.data;
  if (!analysis.photoUsable) {
    return {
      ok: false,
      code: "no_photo",
      message:
        analysis.photoNote ||
        "We couldn't see enough of your whole body to say anything useful. You can retake the photo or continue without it.",
    };
  }
  return { ok: true, analysis };
}
