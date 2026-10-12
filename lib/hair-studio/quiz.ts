/*
  Hair Studio's quiz: the choices, the rules, and the validation. Kept apart from
  the screens so it can be tested without a browser, and shared with the server so
  the browser and the API agree on exactly what is allowed.
*/

export const hairTypeValues = ["straight", "wavy", "curly", "coily", "unsure"] as const;
export const thicknessValues = ["fine", "medium", "thick", "unsure"] as const;
export const changeValues = [
  "subtle-refresh",
  "completely-new",
  "modern-trendy",
  "elegant-polished",
  "low-maintenance",
  "bold-experimental",
] as const;
export const occasionValues = [
  "everyday",
  "college",
  "office",
  "date-night",
  "party",
  "wedding",
  "vacation",
  "signature",
] as const;
export const framingValues = [
  "frame-cheeks",
  "face-layers",
  "bangs",
  "soft-jawline",
  "forehead-open",
  "away-from-face",
  "no-preference",
] as const;
export const highlightValues = [
  "eyes",
  "cheekbones",
  "jawline",
  "natural-texture",
  "length-movement",
  "face-framing",
  "no-preference",
] as const;
export const volumeValues = [
  "sleek",
  "natural",
  "bouncy",
  "full",
  "root-lift",
  "unsure",
] as const;
export const lengthValues = ["short", "medium", "long", "keep"] as const;
export const stylingValues = ["minimal", "willing"] as const;
export const extraValues = ["heat-free", "open-to-change"] as const;

export const labels = {
  hairType: {
    straight: "Straight",
    wavy: "Wavy",
    curly: "Curly",
    coily: "Coily",
    unsure: "Not sure",
  },
  thickness: { fine: "Fine", medium: "Medium", thick: "Thick", unsure: "Not sure" },
  change: {
    "subtle-refresh": "A subtle refresh",
    "completely-new": "A completely new look",
    "modern-trendy": "More modern and trendy",
    "elegant-polished": "Elegant and polished",
    "low-maintenance": "A low-maintenance everyday look",
    "bold-experimental": "Something bold and experimental",
  },
  occasion: {
    everyday: "Everyday",
    college: "College or university",
    office: "Office or work",
    "date-night": "Date night",
    party: "Party or special event",
    wedding: "Wedding or celebration",
    vacation: "Vacation or travel",
    signature: "A new everyday signature look",
  },
  framing: {
    "frame-cheeks": "Softly frame my cheeks",
    "face-layers": "Add face-framing layers",
    bangs: "Try bangs or a fringe",
    "soft-jawline": "Add softness around my jawline",
    "forehead-open": "Keep my forehead open",
    "away-from-face": "Prefer hair away from my face",
    "no-preference": "No specific preference",
  },
  highlight: {
    eyes: "Eyes",
    cheekbones: "Cheekbones",
    jawline: "Jawline",
    "natural-texture": "Natural curls or waves",
    "length-movement": "Hair length and movement",
    "face-framing": "Overall face framing",
    "no-preference": "No specific preference",
  },
  volume: {
    sleek: "Sleek and close to the head",
    natural: "Natural volume",
    bouncy: "Soft, bouncy volume",
    full: "Full and voluminous",
    "root-lift": "Extra lift at the roots",
    unsure: "Not sure",
  },
  length: { short: "Short", medium: "Medium", long: "Long", keep: "Keep my current length" },
  styling: { minimal: "Minimal daily styling", willing: "Happy to spend time styling" },
  extra: { "heat-free": "Heat-free styling", "open-to-change": "Open to a major length change" },
} as const;

export type HairAnswers = {
  hairType: (typeof hairTypeValues)[number] | null;
  thickness: (typeof thicknessValues)[number] | null;
  changes: (typeof changeValues)[number][];
  occasions: (typeof occasionValues)[number][];
  framing: (typeof framingValues)[number][];
  highlights: (typeof highlightValues)[number][];
  volume: (typeof volumeValues)[number] | null;
  length: (typeof lengthValues)[number] | null;
  styling: (typeof stylingValues)[number] | null;
  extras: (typeof extraValues)[number][];
};

export const emptyHairAnswers: HairAnswers = {
  hairType: null,
  thickness: null,
  changes: [],
  occasions: [],
  framing: [],
  highlights: [],
  volume: null,
  length: null,
  styling: null,
  extras: [],
};

export type HairStepId =
  | "hairType"
  | "thickness"
  | "changes"
  | "occasions"
  | "framing"
  | "highlights"
  | "volume"
  | "lifestyle";

export const hairSteps: { id: HairStepId; optional: boolean }[] = [
  { id: "hairType", optional: false }, // "Not sure" is a real answer, so it is never a dead end
  { id: "thickness", optional: false },
  { id: "changes", optional: true },
  { id: "occasions", optional: true },
  { id: "framing", optional: true },
  { id: "highlights", optional: true },
  { id: "volume", optional: true },
  { id: "lifestyle", optional: true },
];

export const hairLimits = { changes: 3, occasions: 3, framing: 3, highlights: 3 } as const;

export function stepProblem(step: HairStepId, answers: HairAnswers): string | null {
  if (step === "hairType" && answers.hairType === null) {
    return "Choose one, or pick “Not sure”.";
  }
  if (step === "thickness" && answers.thickness === null) {
    return "Choose one, or pick “Not sure”.";
  }
  return null;
}

export function isStepAnswered(step: HairStepId, a: HairAnswers): boolean {
  switch (step) {
    case "hairType":
      return a.hairType !== null;
    case "thickness":
      return a.thickness !== null;
    case "changes":
      return a.changes.length > 0;
    case "occasions":
      return a.occasions.length > 0;
    case "framing":
      return a.framing.length > 0;
    case "highlights":
      return a.highlights.length > 0;
    case "volume":
      return a.volume !== null;
    case "lifestyle":
      return a.length !== null || a.styling !== null || a.extras.length > 0;
  }
}

export function firstMissingStep(answers: HairAnswers): HairStepId | null {
  for (const step of hairSteps) {
    if (!step.optional && stepProblem(step.id, answers)) return step.id;
  }
  return null;
}

export function toggleLimited<T extends string>(list: readonly T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((entry) => entry !== value);
  return list.length >= max ? [...list] : [...list, value];
}

/*
  "No specific preference" is exclusive: choosing it clears the others, and choosing
  anything else clears it. Nothing outside that one question is touched.
*/
export function toggleWithNone<T extends string>(
  list: readonly T[],
  value: T,
  none: T,
  max: number,
): T[] {
  if (value === none) return list.includes(none) ? [] : [none];
  const without = list.filter((entry) => entry !== none);
  return toggleLimited(without, value, max);
}

/* ---------- Draft (kept in the browser; never includes the photo) ---------- */

export type HairDraft = { answers: HairAnswers; index: number };
export const emptyHairDraft: HairDraft = { answers: emptyHairAnswers, index: 0 };

function many<T extends string>(value: unknown, allowed: readonly T[], max: number): T[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  const clean = value.filter((entry): entry is T => allowed.includes(entry as T));
  return clean.length === value.length ? clean : null;
}

function one<T extends string>(value: unknown, allowed: readonly T[]): T | null | undefined {
  if (value === null) return null;
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : undefined;
}

// Checks plain data (from storage or from a request) and returns a clean copy.
export function parseHairAnswers(raw: unknown): HairAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const hairType = one(a.hairType, hairTypeValues);
  const thickness = one(a.thickness, thicknessValues);
  const volume = one(a.volume, volumeValues);
  const length = one(a.length, lengthValues);
  const styling = one(a.styling, stylingValues);
  const changes = many(a.changes, changeValues, hairLimits.changes);
  const occasions = many(a.occasions, occasionValues, hairLimits.occasions);
  const framing = many(a.framing, framingValues, hairLimits.framing);
  const highlights = many(a.highlights, highlightValues, hairLimits.highlights);
  const extras = many(a.extras, extraValues, extraValues.length);
  if (
    hairType === undefined ||
    thickness === undefined ||
    volume === undefined ||
    length === undefined ||
    styling === undefined ||
    !changes ||
    !occasions ||
    !framing ||
    !highlights ||
    !extras
  ) {
    return null;
  }
  return { hairType, thickness, changes, occasions, framing, highlights, volume, length, styling, extras };
}

export function validateHairDraft(data: unknown): HairDraft | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as { answers?: unknown; index?: unknown };
  const answers = parseHairAnswers(raw.answers);
  const index = raw.index;
  if (!answers) return null;
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index > hairSteps.length) {
    return null;
  }
  return { answers, index };
}
