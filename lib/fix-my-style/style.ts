import { callGeminiJson, type GeminiJsonResult } from "@/lib/ai/gemini-json";
import { generateImage, type ImageResult } from "@/lib/ai/gemini-image";
import { outfitAnalysisSchema, type OutfitAnalysis, type StyledImage } from "./schema";

/*
  Server-only. Two separate steps, because they use two different models:
  1. The text and vision model reads the photo and describes the outfit.
  2. An image model (only if configured) creates the restyled picture.
*/

const instructions = `You are a personal stylist looking at one photo of an outfit.

Describe what is visible and how to style the SAME clothes better.
- isOutfit: true only if the photo shows clothing, shoes, a bag or accessories that can be styled. Otherwise false, and keep the other lists short.
- items: the garments you can see, each with its category, its visible colours (plain colour names) and one short detail such as fabric look, cut or print. Describe only what is visible. Do not guess brands or exact fabrics.
- assessment: one or two warm sentences on what already works and what could be better. Never comment on the person's body, age or appearance.
- improvements: up to 4 concrete ways to restyle the SAME pieces: tucking, rolling sleeves, layering order, buttoning, belting, proportion, colour balance. Use only items that are in the photo.
- additions: up to 5 optional pieces that would complement the outfit, each with a short reason and a styling tip. Return an empty list if the outfit is already complete: do not suggest purchases just to fill the list.
- Never mention prices, brands, shops, links or availability.
- Do not identify the person.`;

export async function analyzeOutfit(image: {
  mimeType: string;
  base64: string;
}): Promise<GeminiJsonResult<OutfitAnalysis>> {
  return callGeminiJson({
    label: "fix-style",
    system: instructions,
    parts: [
      { inlineData: { mimeType: image.mimeType, data: image.base64 } },
      { text: "Look at this outfit and describe it and how to style it better." },
    ],
    schema: outfitAnalysisSchema,
    maxOutputTokens: 1_200,
    timeoutMs: 40_000,
    notConfiguredMessage: "Outfit styling isn't available yet. Please check back soon.",
    genericMessage: "We couldn't look at that photo just now. Please try again.",
    withheldMessage: "We couldn't style that photo. Please try a different one.",
  });
}

/*
  The image prompt is built here from the validated analysis, not taken from the
  model verbatim, so what is sent to the image model is predictable.
*/
export function buildImagePrompt(analysis: OutfitAnalysis): string {
  const garments = analysis.items
    .map((item) => `${item.name} (${item.colours.join(", ") || "colour as in the photo"}; ${item.details})`)
    .join("; ");
  const changes = analysis.improvements.length > 0 ? analysis.improvements.join(" ") : "Improve the coordination and presentation.";
  return [
    "Using the provided photo as the reference, create one new photorealistic fashion photograph of the same outfit, styled better.",
    `Keep exactly the same garments: ${garments}.`,
    "Keep the same colours, prints and distinctive details of every garment. Do not replace any garment with a different one and do not add new garments.",
    `Styling changes to apply: ${changes}`,
    "Plain, softly lit studio or neutral background. Full outfit visible. No text, logos or watermarks.",
  ].join(" ");
}

export async function createStyledImage(
  analysis: OutfitAnalysis,
  reference: { mimeType: string; base64: string },
): Promise<StyledImage> {
  const result: ImageResult = await generateImage({
    prompt: buildImagePrompt(analysis),
    reference,
  });
  if (result.ok) return { status: "generated", mimeType: result.mimeType, data: result.data };
  if (result.code === "not_configured") return { status: "not_configured", message: result.message };
  if (result.code === "quota") return { status: "unavailable", message: result.message };
  return { status: "failed", message: result.message };
}
