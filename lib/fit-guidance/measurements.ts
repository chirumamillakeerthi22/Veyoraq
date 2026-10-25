import type { Audience } from "@/lib/audience";
import { measureFields, type MeasureKey, type Shape, type Unit } from "./options";

/*
  Measurements are optional and are only ever one input for general clothing-fit
  guidance. A tentative pattern drawn from them is a conversation starter, not a
  classification of anyone's body.
*/

export type RawMeasurements = Record<MeasureKey, string>;
export type Measurements = Partial<Record<MeasureKey, number>>; // always centimetres

export const emptyRawMeasurements: RawMeasurements = { shoulders: "", chest: "", waist: "", hips: "" };

// Sensible limits in centimetres, to catch typos rather than to judge anyone.
export const rangesCm: Record<MeasureKey, [number, number]> = {
  shoulders: [25, 70],
  chest: [60, 180],
  waist: [45, 180],
  hips: [60, 200],
};

const CM_PER_INCH = 2.54;

export function toCm(value: number, unit: Unit): number {
  return unit === "in" ? value * CM_PER_INCH : value;
}

export function fromCm(value: number, unit: Unit): number {
  return unit === "in" ? value / CM_PER_INCH : value;
}

// A number such as "78", "78.5" or "78,5". Anything else is not a measurement.
export function parseMeasurement(text: string): number | null {
  const cleaned = text.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

// Converts what is typed when the unit is switched, keeping empty and invalid text as is.
export function convertText(text: string, from: Unit, to: Unit): string {
  if (from === to) return text;
  const value = parseMeasurement(text);
  if (value === null) return text;
  const converted = fromCm(toCm(value, from), to);
  return String(Math.round(converted * 10) / 10);
}

export type MeasurementCheck = {
  values: Measurements;
  errors: Partial<Record<MeasureKey, string>>;
  missing: MeasureKey[]; // required fields left empty
};

export function checkMeasurements(
  raw: RawMeasurements,
  unit: Unit,
  audience: Audience,
): MeasurementCheck {
  const values: Measurements = {};
  const errors: MeasurementCheck["errors"] = {};
  const missing: MeasureKey[] = [];

  for (const field of measureFields[audience]) {
    const text = raw[field.key] ?? "";
    if (text.trim() === "") {
      if (field.required) missing.push(field.key);
      continue;
    }
    const parsed = parseMeasurement(text);
    const [lo, hi] = rangesCm[field.key];
    const shownLo = Math.round(fromCm(lo, unit));
    const shownHi = Math.round(fromCm(hi, unit));
    if (parsed === null) {
      errors[field.key] = "Enter a number, for example 78 or 78.5.";
      continue;
    }
    const cm = toCm(parsed, unit);
    if (cm < lo || cm > hi) {
      errors[field.key] = `Please check this: we expect between ${shownLo} and ${shownHi} ${unit}.`;
      continue;
    }
    values[field.key] = Math.round(cm * 10) / 10;
  }
  return { values, errors, missing };
}

export type PatternSuggestion = { shape: Shape | null; reason: string };

/*
  A tentative pattern from bust or chest, waist and hips. It compares proportions
  only, never size, and can say "not enough to say".
*/
export function suggestPattern(values: Measurements, audience: Audience): PatternSuggestion {
  const { chest, waist, hips } = values;
  if (!chest || !waist) {
    return { shape: null, reason: "Not enough measurements to suggest a pattern." };
  }

  if (audience === "women") {
    if (!hips) return { shape: null, reason: "Not enough measurements to suggest a pattern." };
    const average = (chest + hips) / 2;
    const hipDifference = (hips - chest) / average;
    const waistRatio = waist / average;
    if (waistRatio >= 0.9) {
      return { shape: "apple", reason: "Your waist is close in size to your bust and hips." };
    }
    if (hipDifference >= 0.05) {
      return { shape: "pear", reason: "Your hips measure a little more than your bust." };
    }
    if (hipDifference <= -0.05) {
      return { shape: "inverted-triangle", reason: "Your bust measures a little more than your hips." };
    }
    if (waistRatio <= 0.75) {
      return { shape: "hourglass", reason: "Your bust and hips are similar, with a smaller waist." };
    }
    return { shape: "rectangle", reason: "Your bust, waist and hips are fairly even." };
  }

  // Men: chest against waist, with hips only when given.
  if (waist / chest >= 0.98) {
    return { shape: "apple", reason: "Your waist is close in size to your chest." };
  }
  if (hips && hips / chest >= 1.05) {
    return { shape: "pear", reason: "Your hips measure a little more than your chest." };
  }
  const taper = chest / waist;
  if (taper >= 1.25) {
    return { shape: "inverted-triangle", reason: "Your chest is much broader than your waist." };
  }
  if (taper >= 1.1) {
    return { shape: "trapezoid", reason: "Your chest is broader than your waist." };
  }
  return { shape: "rectangle", reason: "Your chest, waist and hips are fairly even." };
}
