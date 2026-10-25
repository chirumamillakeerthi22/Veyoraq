import type { Audience } from "@/lib/audience";
import {
  comfortNotes,
  fitPrefNotes,
  focusNotes,
  guideFor,
  occasionNotes,
  type Tip,
} from "./content";
import { fromCm, type Measurements } from "./measurements";
import {
  categoriesByAudience,
  categoryLabels,
  fitPrefLabels,
  occasionLabels,
  shapeLabels,
  sizeFields,
  type Category,
  type Shape,
  type Unit,
} from "./options";

/*
  Turns a person's choices into the Fit Guidance report. It is plain data (no AI, no
  photo), so it can be shown, saved on this device, and reopened exactly as it was.
*/

export type FitQuiz = {
  fitPref: "relaxed" | "regular" | "tailored" | "close" | null;
  categories: Category[];
  occasions: ("everyday" | "work" | "occasion" | "travel")[];
  focus: ("define-waist" | "balance-proportions" | "add-structure" | "lengthen-line" | "keep-easy")[];
  comfort: ("covered-arms" | "longer-hemlines" | "no-tight-waist" | "stretch" | "easy-movement")[];
};

export const emptyFitQuiz: FitQuiz = {
  fitPref: null,
  categories: [],
  occasions: [],
  focus: [],
  comfort: [],
};

export type ShapeSource = "chosen" | "measurements" | "photo" | "none";

export type ReportInput = {
  audience: Audience;
  shape: Shape;
  source: ShapeSource;
  measurements: Measurements | null;
  unit: Unit;
  sizes: Record<string, string>;
  quiz: FitQuiz;
  // Cautious, general observations from a photo, when one was analysed.
  photoObservations: string[];
};

export type ReportSection = { id: string; title: string; tips: Tip[] };
export type ReportNote = { title: string; items: string[] };

export type FitReport = {
  version: 1;
  audience: Audience;
  shape: Shape;
  shapeLabel: string;
  source: ShapeSource;
  // What the person provided, shown back to them.
  profile: { label: string; value: string }[];
  limitations: string[];
  intro: string;
  sections: ReportSection[];
  notes: ReportNote[];
};

const sectionTitles: Record<Audience, Record<string, string>> = {
  women: {
    silhouettes: "Cuts and silhouettes to explore",
    tops: "Tops and necklines",
    bottoms: "Trousers and skirts",
    dresses: "Dresses and jumpsuits",
    lengths: "Lengths and proportions",
    layers: "Layering and outerwear",
    shopping: "When you shop: fit details to check",
  },
  men: {
    silhouettes: "Cuts and silhouettes to explore",
    tops: "Shirts, tops and collars",
    bottoms: "Trousers",
    dresses: "",
    lengths: "Lengths and proportions",
    layers: "Layering and outerwear",
    shopping: "When you shop: fit details to check",
  },
};

const measureLabel: Record<Audience, Record<string, string>> = {
  women: { chest: "Bust", waist: "Waist", hips: "Hips", shoulders: "Shoulder width" },
  men: { chest: "Chest", waist: "Waist", hips: "Hips", shoulders: "Shoulder width" },
};

function limitationsFor(source: ShapeSource): string[] {
  const base = [
    "These are style suggestions to explore, not a medical or scientific assessment, and there is no single right way to dress any body.",
    "You can wear whatever you enjoy. Treat this as a starting point and ignore anything that does not feel like you.",
  ];
  if (source === "measurements") {
    base.unshift(
      "A pattern drawn from a few measurements is tentative. It compares proportions only and cannot describe everything about how you are built.",
    );
  }
  if (source === "photo") {
    base.unshift(
      "A photo cannot give reliable measurements. Anything noticed from it is a general, tentative observation about proportions, and the shape shown can be changed.",
    );
  }
  if (source === "none") {
    base.unshift("You chose not to pick a body-shape description, so the advice is general.");
  }
  return base;
}

export function buildReport(input: ReportInput): FitReport {
  const { audience, shape, source, quiz } = input;
  const guide = guideFor(audience, shape);
  const titles = sectionTitles[audience];
  const wanted: Category[] = quiz.categories.length ? quiz.categories : [...categoriesByAudience[audience]];

  const sections: ReportSection[] = [
    { id: "silhouettes", title: titles.silhouettes, tips: guide.silhouettes },
  ];
  if (wanted.includes("tops")) sections.push({ id: "tops", title: titles.tops, tips: guide.tops });
  if (wanted.includes("bottoms")) sections.push({ id: "bottoms", title: titles.bottoms, tips: guide.bottoms });
  if (wanted.includes("dresses") && audience === "women" && guide.dresses.length) {
    sections.push({ id: "dresses", title: titles.dresses, tips: guide.dresses });
  }
  sections.push({ id: "lengths", title: titles.lengths, tips: guide.lengths });
  if (wanted.includes("outerwear")) sections.push({ id: "layers", title: titles.layers, tips: guide.layers });
  sections.push({ id: "shopping", title: titles.shopping, tips: guide.shopping });

  // What was provided, shown back exactly (measurements in the unit chosen).
  const profile: FitReport["profile"] = [
    {
      label: "Body-shape description",
      value:
        shape === "unsure"
          ? "Not chosen"
          : `${shapeLabels[audience][shape]} (${
              source === "chosen"
                ? "your choice"
                : source === "measurements"
                  ? "tentatively suggested from your measurements"
                  : "tentatively suggested from your photo"
            })`,
    },
  ];
  if (input.measurements) {
    for (const key of ["chest", "waist", "hips", "shoulders"] as const) {
      const value = input.measurements[key];
      if (value !== undefined) {
        profile.push({
          label: measureLabel[audience][key],
          value: `${Math.round(fromCm(value, input.unit) * 10) / 10} ${input.unit}`,
        });
      }
    }
  }
  for (const field of sizeFields[audience]) {
    const size = input.sizes[field.key]?.trim();
    if (size) profile.push({ label: `Usual size: ${field.label}`, value: size });
  }
  if (quiz.fitPref) profile.push({ label: "Preferred fit", value: fitPrefLabels[quiz.fitPref] });
  if (quiz.categories.length) {
    profile.push({
      label: "Advice for",
      value: quiz.categories.map((c) => categoryLabels[audience][c]).filter(Boolean).join(", "),
    });
  }
  if (quiz.occasions.length) {
    profile.push({ label: "Dressing for", value: quiz.occasions.map((o) => occasionLabels[o]).join(", ") });
  }

  const notes: ReportNote[] = [];
  const mine: string[] = [];
  if (quiz.fitPref) mine.push(fitPrefNotes[quiz.fitPref]);
  quiz.focus.forEach((f) => mine.push(focusNotes[f]));
  if (mine.length) notes.push({ title: "Based on your preferences", items: mine });
  if (quiz.comfort.length) {
    notes.push({ title: "Comfort and coverage", items: quiz.comfort.map((c) => comfortNotes[c]) });
  }
  if (quiz.occasions.length) {
    notes.push({ title: "For your occasions", items: quiz.occasions.map((o) => occasionNotes[o]) });
  }

  const details: string[] = [];
  if (input.measurements?.shoulders !== undefined) {
    details.push(
      "You gave a shoulder width. When you buy jackets and shirts, compare it with the brand's shoulder measurement: the seam should sit close to your shoulder point.",
    );
  }
  if (sizeFields[audience].some((field) => input.sizes[field.key]?.trim())) {
    details.push(
      "Sizes vary between brands and regions, so treat your usual sizes as a starting point and check each brand's size chart. They have not been used to work out any measurements.",
    );
  }
  if (details.length) notes.push({ title: "About what you shared", items: details });
  if (input.photoObservations.length) {
    notes.push({ title: "General observations from your photo (tentative)", items: input.photoObservations });
  }

  return {
    version: 1,
    audience,
    shape,
    shapeLabel: shapeLabels[audience][shape],
    source,
    profile,
    limitations: limitationsFor(source),
    intro: guide.intro,
    sections,
    notes,
  };
}

// A light check for a report read back from this device's storage.
export function isFitReport(value: unknown): value is FitReport {
  const report = value as Partial<FitReport> | null;
  return (
    !!report &&
    report.version === 1 &&
    (report.audience === "women" || report.audience === "men") &&
    typeof report.shapeLabel === "string" &&
    Array.isArray(report.sections) &&
    Array.isArray(report.profile) &&
    Array.isArray(report.limitations) &&
    Array.isArray(report.notes) &&
    typeof report.intro === "string"
  );
}
