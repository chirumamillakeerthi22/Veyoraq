import { z } from "zod";

// Prices, links and offers must never appear in model text (see lib/stylist/schema.ts).
const commercialText =
  /https?:\/\/|www\.|[₹$£€]|\b(?:rs\.?|inr|usd|gbp|eur)\s*\d|\d\s*%\s*off|\b(?:discount|sale price|buy now|add to cart)\b/i;

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !commercialText.test(value), "Must not contain prices, links or offers");

export const itemCategoryValues = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "footwear",
  "bag",
  "accessory",
  "other",
] as const;
export type ItemCategory = (typeof itemCategoryValues)[number];

export const itemCategoryLabels: Record<ItemCategory, string> = {
  top: "Top",
  bottom: "Bottom",
  dress: "Dress",
  outerwear: "Outerwear",
  footwear: "Footwear",
  bag: "Bag",
  accessory: "Accessory",
  other: "Other",
};

/*
  What the model may say about the outfit in the photo. There is no field for a
  price, a brand or a link, and unknown fields are rejected.
*/
export const outfitAnalysisSchema = z
  .object({
    // False when the photo does not show clothing worth styling.
    isOutfit: z.boolean(),
    // The garments that can be seen, with their visible colours.
    items: z
      .array(
        z
          .object({
            name: text(60),
            category: z.enum(itemCategoryValues),
            colours: z.array(text(24)).max(3),
            details: text(80),
          })
          .strict(),
      )
      .max(8),
    // One or two sentences on what already works and what could be better.
    assessment: text(240),
    // Ways to restyle the SAME pieces (tuck, roll, layer, swap order, accessorise
    // with what is already worn).
    improvements: z.array(text(140)).max(4),
    // Optional new pieces that would complement it. Empty when the outfit is complete.
    additions: z
      .array(
        z
          .object({
            name: text(60),
            category: z.enum(itemCategoryValues),
            why: text(160),
            tip: text(100),
          })
          .strict(),
      )
      .max(5),
  })
  .strict();

export type OutfitAnalysis = z.infer<typeof outfitAnalysisSchema>;

// What the page receives for the generated image.
export type StyledImage =
  | { status: "generated"; mimeType: string; data: string }
  | { status: "not_configured" | "unavailable" | "failed" | "skipped"; message: string };

// One line per event in the streamed response.
export type StyleEvent =
  | { type: "analysis"; data: OutfitAnalysis }
  | { type: "image"; data: StyledImage }
  | { type: "error"; message: string }
  | { type: "done" };
