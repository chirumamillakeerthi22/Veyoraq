import { z } from "zod";
import { audienceValues, isAudience, type Audience } from "@/lib/audience";
import { emptyFitQuiz, type FitQuiz } from "./report";
import { emptyRawMeasurements, type RawMeasurements } from "./measurements";
import {
  categoryValues,
  comfortValues,
  fitPrefValues,
  focusValues,
  methodValues,
  occasionValues,
  shapeValues,
  SIZE_PATTERN,
  unitValues,
  type Method,
  type Shape,
  type Unit,
} from "./options";

/* ---------- What the photo check may return ---------- */

// Prices, links and offers must never appear in model text.
const commercial = /https?:\/\/|www\.|[₹$£€]|\b(?:rs\.?|inr|usd|gbp|eur)\s*\d|\b(?:discount|buy now|add to cart)\b/i;
const text = (max: number) =>
  z.string().trim().min(1).max(max).refine((value) => !commercial.test(value), "No prices or links");

export const photoAnalysisSchema = z
  .object({
    // False when no full or near-full body can be seen well enough to say anything.
    photoUsable: z.boolean(),
    photoNote: z.string().trim().max(200),
    shape: z.enum(shapeValues),
    confidence: z.enum(["low", "medium"]),
    observations: z.array(text(160)).max(4),
  })
  .strict();

export type PhotoAnalysis = z.infer<typeof photoAnalysisSchema>;

export const photoRequestSchema = z
  .object({ image: z.string().min(1), audience: z.enum(audienceValues).optional() })
  .strict();

/* ---------- The draft kept in the browser (never the photo) ---------- */

export type FitStage = "intro" | "known" | "method" | "measurements" | "sizes" | "photo" | "quiz" | "results";
const stages: readonly FitStage[] = ["intro", "known", "method", "measurements", "sizes", "photo", "quiz", "results"];

export type FitDraft = {
  stage: FitStage;
  method: Method | null;
  shape: Shape | null;
  unit: Unit;
  measurements: RawMeasurements;
  sizes: Record<string, string>;
  quiz: FitQuiz;
  index: number; // current question
  // From an analysed photo: a tentative shape and a few general observations (text only).
  photoShape: Shape | null;
  photoObservations: string[];
  // Which audience the shape and measurements were given for.
  audience: Audience | null;
};

export const emptyFitDraft: FitDraft = {
  stage: "intro",
  method: null,
  shape: null,
  unit: "cm",
  measurements: emptyRawMeasurements,
  sizes: {},
  quiz: emptyFitQuiz,
  index: 0,
  photoShape: null,
  photoObservations: [],
  audience: null,
};

const oneOf = <T extends string>(values: readonly T[], value: unknown): T | null =>
  (values as readonly unknown[]).includes(value) ? (value as T) : null;

const listOf = <T extends string>(values: readonly T[], value: unknown): T[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is T => (values as readonly unknown[]).includes(item))))
    : [];

export function validateFitDraft(data: unknown): FitDraft | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Record<string, unknown>;
  const stage = oneOf(stages, raw.stage);
  if (!stage) return null;

  const rawMeasurements = (raw.measurements ?? {}) as Record<string, unknown>;
  const measurements: RawMeasurements = { ...emptyRawMeasurements };
  for (const key of Object.keys(measurements) as (keyof RawMeasurements)[]) {
    const value = rawMeasurements[key];
    measurements[key] = typeof value === "string" && value.length <= 8 ? value : "";
  }

  const sizes: Record<string, string> = {};
  const rawSizes = (raw.sizes ?? {}) as Record<string, unknown>;
  for (const key of ["tops", "bottoms", "dresses", "jackets"]) {
    const value = rawSizes[key];
    if (typeof value === "string" && SIZE_PATTERN.test(value)) sizes[key] = value;
  }

  const rawQuiz = (raw.quiz ?? {}) as Record<string, unknown>;
  const quiz: FitQuiz = {
    fitPref: oneOf(fitPrefValues, rawQuiz.fitPref),
    categories: listOf(categoryValues, rawQuiz.categories),
    occasions: listOf(occasionValues, rawQuiz.occasions),
    focus: listOf(focusValues, rawQuiz.focus),
    comfort: listOf(comfortValues, rawQuiz.comfort),
  };

  const index = raw.index;
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index > 5) return null;

  const observations = Array.isArray(raw.photoObservations)
    ? raw.photoObservations.filter((item): item is string => typeof item === "string" && item.length <= 160).slice(0, 4)
    : [];

  return {
    stage,
    method: oneOf(methodValues, raw.method),
    shape: oneOf(shapeValues, raw.shape),
    unit: oneOf(unitValues, raw.unit) ?? "cm",
    measurements,
    sizes,
    quiz,
    index,
    photoShape: oneOf(shapeValues, raw.photoShape),
    photoObservations: observations,
    audience: isAudience(raw.audience) ? raw.audience : null,
  };
}
