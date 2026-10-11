import { callGeminiJson, type GeminiJsonResult } from "@/lib/ai/gemini-json";
import {
  categoryLabels,
  categoryValues,
  colourValues,
  materialValues,
  occasionValues,
  patternValues,
  seasonValues,
  styleValues,
} from "./options";
import { garmentAnalysisSchema, type GarmentAnalysis } from "./schema";

/*
  Server-only. Asks Gemini to describe ONE garment in a photo. The answer is a
  suggestion that the person reviews and corrects; nothing here is presented as fact.
*/

const instructions = `You help people catalogue clothes they own. You are shown one photo.

Describe the single most prominent garment, shoe, bag or accessory in the photo.
- category must be one of: ${categoryValues.join(", ")}.
- name is a short plain description such as "Cream knit cardigan" (no brands, no prices).
- colours: the main colour first, from this list only: ${colourValues.join(", ")}. At most 3.
- pattern: one of ${patternValues.join(", ")}.
- material: one of ${materialValues.join(", ")}. A photo rarely proves a fabric. If you cannot tell from what is visible, use "unsure". Never guess a brand or exact fabric blend.
- style: the closest of ${styleValues.join(", ")}.
- seasons: seasons it suits, from ${seasonValues.join(", ")} (an empty list if it suits all).
- occasions: where it would suit, from ${occasionValues.join(", ")}.
- note: one short sentence for anything the person should check, for example that several garments are visible, that the photo is blurry or dark, or that the colour may be affected by lighting. Use an empty string if there is nothing to flag.

If the photo does not show clothing, shoes, a bag or an accessory, still return the closest valid answer, use category "accessories", name "Unrecognised item", material "unsure", and say so in note.
Describe only what is visible. Do not identify people. Never include prices, links or brand names.`;

export async function analyzeGarment(image: {
  mimeType: string;
  base64: string;
}): Promise<GeminiJsonResult<GarmentAnalysis>> {
  return callGeminiJson({
    label: "fix-analyze",
    system: instructions,
    parts: [
      { inlineData: { mimeType: image.mimeType, data: image.base64 } },
      {
        text: `Describe the main item in this photo. Valid categories: ${Object.values(categoryLabels).join(", ")}.`,
      },
    ],
    schema: garmentAnalysisSchema,
    maxOutputTokens: 600,
    timeoutMs: 30_000,
    notConfiguredMessage: "Photo suggestions aren't available yet. You can fill in the details yourself.",
    genericMessage: "We couldn't read that photo. You can fill in the details yourself.",
    withheldMessage: "We couldn't describe that photo. You can fill in the details yourself.",
  });
}
