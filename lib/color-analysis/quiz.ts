/*
  Colour Analysis: the quiz's choices, rules and draft validation. Shared by the
  browser and the server so both agree on exactly what is allowed.
*/

export const hairValues = ["black", "dark-brown", "medium-brown", "light", "red", "grey", "unsure"] as const;
export const eyeValues = ["dark-brown", "light-brown", "blue", "green", "grey", "unsure"] as const;
export const sunValues = ["burns", "burns-then-tans", "tans", "unsure"] as const;
export const qualityValues = ["soft", "bright", "deep", "light", "unsure"] as const;
export const helpValues = ["everyday", "work", "occasion", "traditional", "accessories", "capsule"] as const;
export const budgetValues = ["budget", "mid", "premium"] as const;
export const currencyValues = ["INR", "USD", "GBP", "EUR"] as const;

export const labels = {
  hair: {
    black: "Black",
    "dark-brown": "Dark brown",
    "medium-brown": "Medium brown",
    light: "Light brown or blonde",
    red: "Red or auburn",
    grey: "Grey or white",
    unsure: "Other or unsure",
  },
  eyes: {
    "dark-brown": "Dark brown",
    "light-brown": "Light brown or hazel",
    blue: "Blue",
    green: "Green",
    grey: "Grey",
    unsure: "Other or unsure",
  },
  sun: {
    burns: "Burns easily",
    "burns-then-tans": "Burns sometimes, then gradually tans",
    tans: "Tans relatively easily",
    unsure: "Varies or unsure",
  },
  quality: {
    soft: "Soft and muted",
    bright: "Bright and clear",
    deep: "Deep and rich",
    light: "Light and delicate",
    unsure: "Not sure yet",
  },
  help: {
    everyday: "Everyday outfits",
    work: "Workwear",
    occasion: "Occasion and party wear",
    traditional: "Traditional and ethnic wear",
    accessories: "Accessories",
    capsule: "A complete capsule wardrobe",
  },
  budget: { budget: "Budget-friendly", mid: "Mid-range", premium: "Premium" },
} as const;

// Plain-colour illustrations for the answer cards. They help people recognise the
// option; the label always carries the meaning.
export const hairSwatch: Record<(typeof hairValues)[number], string[]> = {
  black: ["#1c1917"],
  "dark-brown": ["#3b2a20"],
  "medium-brown": ["#6b4a33"],
  light: ["#b98e5b", "#e3c28a"],
  red: ["#8a3b1f", "#b5532a"],
  grey: ["#9a9a9a", "#d9d9d9"],
  unsure: ["#e8e0d7"],
};
export const eyeSwatch: Record<(typeof eyeValues)[number], string[]> = {
  "dark-brown": ["#3b2417"],
  "light-brown": ["#8a5a2b", "#b98a4a"],
  blue: ["#4f7fb0"],
  green: ["#5b8a5a"],
  grey: ["#8e9aa3"],
  unsure: ["#e8e0d7"],
};
export const qualitySwatch: Record<(typeof qualityValues)[number], string[]> = {
  soft: ["#b8a99a", "#a7a58f", "#c4a8a0"],
  bright: ["#d62f4a", "#1f7a9a", "#f2a900"],
  deep: ["#5b1f2e", "#1f3b34", "#2b2540"],
  light: ["#f2dfd8", "#dfe8ea", "#efe9cf"],
  unsure: ["#e8e0d7", "#d8cbb8"],
};

export type ColourAnswers = {
  hair: (typeof hairValues)[number] | null;
  eyes: (typeof eyeValues)[number] | null;
  sun: (typeof sunValues)[number] | null;
  qualities: (typeof qualityValues)[number][];
  help: (typeof helpValues)[number][];
  budget: (typeof budgetValues)[number] | null;
  currency: (typeof currencyValues)[number];
};

export const emptyColourAnswers: ColourAnswers = {
  hair: null,
  eyes: null,
  sun: null,
  qualities: [],
  help: [],
  budget: null,
  currency: "INR",
};

export type ColourStepId = "hair" | "eyes" | "sun" | "qualities" | "help" | "budget";

// Only hair and eyes are needed; "unsure" is always an allowed answer.
export const colourSteps: { id: ColourStepId; optional: boolean }[] = [
  { id: "hair", optional: false },
  { id: "eyes", optional: false },
  { id: "sun", optional: true },
  { id: "qualities", optional: true },
  { id: "help", optional: true },
  { id: "budget", optional: true },
];

export const colourLimits = { qualities: 2, help: 6 } as const;

export function stepProblem(step: ColourStepId, a: ColourAnswers): string | null {
  if (step === "hair" && a.hair === null) return "Choose one, or pick “Other or unsure”.";
  if (step === "eyes" && a.eyes === null) return "Choose one, or pick “Other or unsure”.";
  return null;
}

export function firstMissingStep(a: ColourAnswers): ColourStepId | null {
  for (const step of colourSteps) {
    if (!step.optional && stepProblem(step.id, a)) return step.id;
  }
  return null;
}

export function isStepAnswered(step: ColourStepId, a: ColourAnswers): boolean {
  switch (step) {
    case "hair":
      return a.hair !== null;
    case "eyes":
      return a.eyes !== null;
    case "sun":
      return a.sun !== null;
    case "qualities":
      return a.qualities.length > 0;
    case "help":
      return a.help.length > 0;
    case "budget":
      return a.budget !== null;
  }
}

export function toggleLimited<T extends string>(list: readonly T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((entry) => entry !== value);
  return list.length >= max ? [...list] : [...list, value];
}

/* ---------- Plain-data validation (requests and stored drafts) ---------- */

function one<T extends string>(value: unknown, allowed: readonly T[]): T | null | undefined {
  if (value === null) return null;
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : undefined;
}

function many<T extends string>(value: unknown, allowed: readonly T[], max: number): T[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  const clean = value.filter((entry): entry is T => allowed.includes(entry as T));
  return clean.length === value.length && new Set(clean).size === clean.length ? clean : null;
}

export function parseColourAnswers(raw: unknown): ColourAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const hair = one(a.hair, hairValues);
  const eyes = one(a.eyes, eyeValues);
  const sun = one(a.sun, sunValues);
  const budget = one(a.budget, budgetValues);
  const currency = (currencyValues as readonly unknown[]).includes(a.currency)
    ? (a.currency as ColourAnswers["currency"])
    : undefined;
  const qualities = many(a.qualities, qualityValues, colourLimits.qualities);
  const help = many(a.help, helpValues, colourLimits.help);
  if (
    hair === undefined ||
    eyes === undefined ||
    sun === undefined ||
    budget === undefined ||
    currency === undefined ||
    !qualities ||
    !help
  ) {
    return null;
  }
  return { hair, eyes, sun, qualities, help, budget, currency };
}
