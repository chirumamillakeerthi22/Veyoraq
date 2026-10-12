import { z } from "zod";
import {
  colourSteps,
  emptyColourAnswers,
  parseColourAnswers,
  type ColourAnswers,
} from "./quiz";

// Prices, links and offers must never appear in model text (see lib/stylist/schema.ts).
const commercialText =
  /https?:\/\/|www\.|[₹$£€]|\b(?:rs\.?|inr|usd|gbp|eur)\s*\d|\d\s*%\s*off|\b(?:discount|sale price|buy now|add to cart)\b/i;
const clean = (value: string) => !commercialText.test(value);
const text = (max: number) =>
  z.string().trim().min(1).max(max).refine(clean, "Must not contain prices, links or offers");
const optionalText = (max: number) => z.string().trim().max(max).refine(clean, "No prices or links");

// A colour must be a real six-digit HEX value, so every swatch can actually be drawn.
export const hexSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const seasonValues = [
  "light-spring",
  "warm-spring",
  "bright-spring",
  "light-summer",
  "cool-summer",
  "soft-summer",
  "soft-autumn",
  "warm-autumn",
  "deep-autumn",
  "deep-winter",
  "cool-winter",
  "bright-winter",
] as const;

export const seasonLabels: Record<(typeof seasonValues)[number], string> = {
  "light-spring": "Light Spring",
  "warm-spring": "Warm Spring",
  "bright-spring": "Bright Spring",
  "light-summer": "Light Summer",
  "cool-summer": "Cool Summer",
  "soft-summer": "Soft Summer",
  "soft-autumn": "Soft Autumn",
  "warm-autumn": "Warm Autumn",
  "deep-autumn": "Deep Autumn",
  "deep-winter": "Deep Winter",
  "cool-winter": "Cool Winter",
  "bright-winter": "Bright Winter",
};

const swatch = z
  .object({ name: text(40), hex: hexSchema, usage: text(120) })
  .strict();

export type Swatch = z.infer<typeof swatch>;

/*
  What the model may say. Anything not in this shape, any invalid colour, and any
  price or link in the text is rejected, so the page only ever draws validated data.
*/
export const analysisSchema = z
  .object({
    // False when no face or skin can be judged (no person, far too dark, and so on).
    photoUsable: z.boolean(),
    photoNote: optionalText(200),
    undertone: z
      .object({
        value: z.enum(["warm", "cool", "neutral", "uncertain"]),
        confidence: z.enum(["low", "medium", "high"]),
        explanation: text(240),
      })
      .strict(),
    depth: z.enum(["light", "medium", "deep", "uncertain"]),
    contrast: z.enum(["low", "medium", "high", "uncertain"]),
    // "uncertain" is a legitimate answer when the evidence is weak.
    likelySeason: z.enum([...seasonValues, "uncertain"]),
    alternativeSeason: z.enum([...seasonValues, "none"]),
    // Palettes to explore when the result is uncertain. They are NOT confirmed results.
    explorePalettes: z.array(z.enum(seasonValues)).max(3),
    confidenceExplanation: text(300),
    summary: text(260),
    recommendedColors: z.array(swatch).max(8),
    neutralColors: z.array(swatch).max(6),
    accentColors: z.array(swatch).max(5),
    colorsToExploreCarefully: z.array(swatch).max(4),
    colorCombinations: z
      .array(
        z
          .object({
            name: text(50),
            colors: z.array(hexSchema).min(2).max(4),
            occasion: z.enum(["everyday", "work", "occasion"]),
            idea: text(160),
          })
          .strict(),
      )
      .max(6),
    stylingAdvice: z.array(text(180)).max(6),
  })
  .strict();

export type ColourAnalysis = z.infer<typeof analysisSchema>;

// A result is only useful if it has enough colour to draw a palette.
export function hasUsablePalette(analysis: ColourAnalysis): boolean {
  return (
    analysis.photoUsable &&
    analysis.recommendedColors.length >= 3 &&
    analysis.neutralColors.length >= 2 &&
    analysis.colorCombinations.length >= 1
  );
}

/* ---------- Draft kept in the browser (never the photo) ---------- */

export type ColourStage = "intro" | "guidance" | "photo" | "quiz" | "results";

export type ColourDraft = {
  stage: ColourStage;
  index: number;
  answers: ColourAnswers;
  result: ColourAnalysis | null;
};

export const emptyColourDraft: ColourDraft = {
  stage: "intro",
  index: 0,
  answers: emptyColourAnswers,
  result: null,
};

const stages: readonly ColourStage[] = ["intro", "guidance", "photo", "quiz", "results"];

export function validateColourDraft(data: unknown): ColourDraft | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Record<string, unknown>;
  if (!(stages as readonly unknown[]).includes(raw.stage)) return null;
  const answers = parseColourAnswers(raw.answers);
  if (!answers) return null;
  const index = raw.index;
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index > colourSteps.length) {
    return null;
  }
  let result: ColourAnalysis | null = null;
  if (raw.result !== null && raw.result !== undefined) {
    const parsed = analysisSchema.safeParse(raw.result);
    if (!parsed.success || !hasUsablePalette(parsed.data)) return null;
    result = parsed.data;
  }
  // Results are only a valid stage when there is a result to show.
  if (raw.stage === "results" && !result) return null;
  return { stage: raw.stage as ColourStage, index, answers, result };
}

