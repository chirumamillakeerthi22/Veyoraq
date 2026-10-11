import { z } from "zod";
import {
  categoryValues,
  colourValues,
  formalityValues,
  limits,
  materialValues,
  occasionValues,
  patternValues,
  seasonValues,
  styleValues,
} from "./options";

export type FixErrorCode =
  | "invalid_input"
  | "forbidden"
  | "too_large"
  | "unsupported_image"
  | "not_configured"
  | "rate_limited"
  | "timeout"
  | "refused"
  | "incomplete"
  | "invalid_output"
  | "upstream_error"
  | "no_combinations";

const unique = (values: readonly string[]) => new Set(values).size === values.length;

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

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

/* ---------- Garment recognition ---------- */

// What the model may say about a photo. It is a suggestion: the person corrects it.
export const garmentAnalysisSchema = z
  .object({
    category: z.enum(categoryValues),
    name: text(limits.nameLength),
    colours: z.array(z.enum(colourValues)).min(1).max(limits.colourPerItem).refine(unique),
    pattern: z.enum(patternValues),
    material: z.enum(materialValues),
    style: z.enum(styleValues),
    seasons: z.array(z.enum(seasonValues)).max(4).refine(unique),
    occasions: z.array(z.enum(occasionValues)).max(6).refine(unique),
    // A short caveat, e.g. "Several garments are visible; this describes the shirt."
    note: z.string().trim().max(140),
  })
  .strict();
export type GarmentAnalysis = z.infer<typeof garmentAnalysisSchema>;

/* ---------- Outfit creation ---------- */

// Only descriptions of garments are sent to the AI, never photos.
export const itemSummarySchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1).max(limits.nameLength),
    category: z.enum(categoryValues),
    colours: z.array(z.enum(colourValues)).max(limits.colourPerItem),
    pattern: z.enum(patternValues).nullable(),
    material: z.enum(materialValues).nullable(),
    seasons: z.array(z.enum(seasonValues)).max(4),
    occasions: z.array(z.enum(occasionValues)).max(6),
  })
  .strict();
export type ItemSummary = z.infer<typeof itemSummarySchema>;

export const preferencesSchema = z
  .object({
    occasion: z.enum(occasionValues).nullable(),
    season: z.enum(seasonValues).nullable(),
    aesthetic: z.enum(styleValues).nullable(),
    formality: z.enum(formalityValues).nullable(),
    colours: z.array(z.enum(colourValues)).max(3),
    mustInclude: z.array(idSchema).max(limits.mustInclude),
  })
  .strict();
export type Preferences = z.infer<typeof preferencesSchema>;

export const outfitRequestSchema = z
  .object({
    mode: z.enum(["outfits", "item"]),
    anchorId: idSchema.nullable(),
    items: z.array(itemSummarySchema).min(1).max(limits.itemsPerRequest),
    preferences: preferencesSchema,
  })
  .strict()
  .superRefine((request, context) => {
    const ids = request.items.map((item) => item.id);
    if (!unique(ids)) context.addIssue({ code: "custom", message: "Duplicate item ids" });
    const known = new Set(ids);
    if (request.mode === "item" && (!request.anchorId || !known.has(request.anchorId))) {
      context.addIssue({ code: "custom", message: "The chosen item is not in the wardrobe" });
    }
    if (request.preferences.mustInclude.some((id) => !known.has(id))) {
      context.addIssue({ code: "custom", message: "A chosen item is not in the wardrobe" });
    }
  });
export type OutfitRequest = z.infer<typeof outfitRequestSchema>;

export const additionSchema = z
  .object({
    name: text(60),
    category: z.enum(categoryValues),
    why: text(180),
    worksWith: z.array(idSchema).max(6),
    colourSuggestion: text(60),
    importance: z.enum(["essential", "optional"]),
  })
  .strict();
export type Addition = z.infer<typeof additionSchema>;

export const outfitIdeaSchema = z
  .object({
    title: text(50),
    itemIds: z.array(idSchema).min(1).max(7),
    layering: text(180),
    whyItWorks: text(260),
    occasions: z.array(z.enum(occasionValues)).min(1).max(3),
    variations: z.array(text(140)).max(2),
    // Pieces the person does not own yet. Empty means the outfit uses only owned items.
    additions: z.array(additionSchema).max(3),
  })
  .strict();
export type OutfitIdea = z.infer<typeof outfitIdeaSchema>;

export const outfitOutputSchema = z
  .object({
    outfits: z.array(outfitIdeaSchema).min(1).max(5),
    // Wardrobe gaps worth filling, separate from the outfits above.
    recommendations: z.array(additionSchema).max(4),
    // Honest note when the wardrobe is small or a request could not be fully met.
    limitations: z.string().trim().max(200),
  })
  .strict();
export type OutfitOutput = z.infer<typeof outfitOutputSchema>;

// What the page receives: the model's answer after it was checked against the request.
export type CleanOutfit = Omit<OutfitIdea, "additions"> & {
  kind: "owned" | "needs_additions";
  additions: Addition[];
};
export type CleanOutput = {
  outfits: CleanOutfit[];
  recommendations: Addition[];
  limitations: string;
};
