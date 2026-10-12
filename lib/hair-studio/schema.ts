import { z } from "zod";

// Prices, links and offers must never appear in model text (see lib/stylist/schema.ts).
const commercialText =
  /https?:\/\/|www\.|[₹$£€]|\b(?:rs\.?|inr|usd|gbp|eur)\s*\d|\d\s*%\s*off|\b(?:discount|sale price|buy now|add to cart)\b/i;

const clean = (value: string) => !commercialText.test(value);
const text = (max: number) =>
  z.string().trim().min(1).max(max).refine(clean, "Must not contain prices, links or offers");
// May be empty, for notes that only apply sometimes.
const optionalText = (max: number) => z.string().trim().max(max).refine(clean, "No prices or links");

export const effortValues = ["low", "medium", "high"] as const;
export const effortLabels: Record<(typeof effortValues)[number], string> = {
  low: "Low effort",
  medium: "Medium effort",
  high: "Higher effort",
};

/*
  One hairstyle idea. The four attributes below the description are what makes the
  four ideas genuinely different, and they are what the image prompt is built from.
*/
export const conceptSchema = z
  .object({
    name: text(40),
    description: text(200),
    whyItMatches: text(200),
    effort: z.enum(effortValues),
    maintenance: text(160),
    // Empty when no professional cut or colour is needed.
    professionalNote: optionalText(140),
    length: z.enum(["short", "medium", "long"]),
    layers: text(60),
    fringe: text(50),
    volume: text(50),
    finish: text(50),
  })
  .strict();

export type HairConcept = z.infer<typeof conceptSchema>;

export const planSchema = z
  .object({
    // False when no person with visible hair can be seen in the photo.
    photoUsable: z.boolean(),
    photoNote: optionalText(160),
    concepts: z.array(conceptSchema).max(4),
    // One honest sentence about the limits of a visualisation.
    caveat: optionalText(160),
  })
  .strict();

export type HairPlan = z.infer<typeof planSchema>;

// The four ideas must differ in at least two of these attributes, pair by pair.
const DIFFERENCE_KEYS = ["length", "layers", "fringe", "volume", "finish"] as const;

export function areDistinct(concepts: HairConcept[]): boolean {
  const names = new Set(concepts.map((concept) => concept.name.toLowerCase()));
  if (names.size !== concepts.length) return false;
  for (let i = 0; i < concepts.length; i += 1) {
    for (let j = i + 1; j < concepts.length; j += 1) {
      const differing = DIFFERENCE_KEYS.filter(
        (key) => concepts[i][key].trim().toLowerCase() !== concepts[j][key].trim().toLowerCase(),
      );
      if (differing.length < 2) return false;
    }
  }
  return true;
}

// What the page receives for each picture.
export type LookImage =
  | { status: "generated"; mimeType: string; data: string }
  | { status: "not_configured" | "unavailable" | "failed"; message: string };

export type HairEvent =
  | { type: "plan"; concepts: HairConcept[]; caveat: string }
  | { type: "image"; index: number; image: LookImage }
  | { type: "error"; message: string }
  | { type: "done" };
