import {
  budgetOptions,
  considerationValues,
  limits,
  occasionValues,
  colourValues,
  fitValues,
  styleValues,
} from "./options";
import type { StylistInput } from "./schema";

/*
  The quiz's steps, answers and rules, kept apart from the screens so they can be
  tested without a browser.
*/

export type QuizAnswers = {
  styles: StylistInput["styles"];
  colours: StylistInput["colours"];
  occasions: StylistInput["occasions"];
  fit: StylistInput["fit"];
  // The id of the chosen entry in budgetOptions, or null while unanswered.
  budgetId: (typeof budgetOptions)[number]["id"] | null;
  considerations: StylistInput["considerations"];
  notes: string;
};

export const emptyAnswers: QuizAnswers = {
  styles: [],
  colours: [],
  occasions: [],
  fit: null,
  budgetId: null,
  considerations: [],
  notes: "",
};

export type StepId = "styles" | "colours" | "occasions" | "fit" | "budget" | "extras";

export const steps: { id: StepId; optional: boolean }[] = [
  { id: "styles", optional: false },
  { id: "colours", optional: true },
  { id: "occasions", optional: false },
  { id: "fit", optional: true },
  { id: "budget", optional: false },
  { id: "extras", optional: true },
];

// A message when the step still needs an answer, otherwise null. Only the current
// step is checked, so the person is never blocked by a later question.
export function stepProblem(step: StepId, answers: QuizAnswers): string | null {
  switch (step) {
    case "styles":
      return answers.styles.length === 0 ? "Pick at least one look that feels like you." : null;
    case "occasions":
      return answers.occasions.length === 0 ? "Pick at least one occasion." : null;
    case "budget":
      return answers.budgetId === null ? "Choose what feels comfortable." : null;
    default:
      return null;
  }
}

export function isAnswered(step: StepId, answers: QuizAnswers): boolean {
  switch (step) {
    case "styles":
      return answers.styles.length > 0;
    case "colours":
      return answers.colours.length > 0;
    case "occasions":
      return answers.occasions.length > 0;
    case "fit":
      return answers.fit !== null;
    case "budget":
      return answers.budgetId !== null;
    case "extras":
      return answers.considerations.length > 0 || answers.notes.trim().length > 0;
  }
}

// The first required step that is not answered yet, or null when the quiz can be sent.
export function firstMissingStep(answers: QuizAnswers): StepId | null {
  for (const step of steps) {
    if (!step.optional && stepProblem(step.id, answers)) return step.id;
  }
  return null;
}

export function toggleLimited<T extends string>(list: readonly T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((entry) => entry !== value);
  return list.length >= max ? [...list] : [...list, value];
}

// Turns the quiz answers into the request the styling service expects.
export function toStylistInput(answers: QuizAnswers): StylistInput | null {
  if (firstMissingStep(answers)) return null;
  const budget = budgetOptions.find((option) => option.id === answers.budgetId);
  if (!budget) return null;
  return {
    occasions: answers.occasions.slice(0, limits.occasions),
    styles: answers.styles.slice(0, limits.styles),
    colours: answers.colours.slice(0, limits.colours),
    fit: answers.fit,
    considerations: answers.considerations.slice(0, limits.considerations),
    budgetTier: budget.tier,
    currency: "INR",
    notes: answers.notes.trim().slice(0, limits.notes),
  };
}

// The quiz only offers values that the service accepts. This is checked in tests.
export const quizOptionSets = {
  styles: styleValues,
  colours: colourValues,
  occasions: occasionValues,
  fit: fitValues,
  considerations: considerationValues,
};

/* ---------- Draft (kept in the browser so a refresh does not lose progress) ---------- */

export type QuizDraft = { answers: QuizAnswers; index: number };

export const emptyDraft: QuizDraft = { answers: emptyAnswers, index: 0 };

const only = <T extends string>(value: unknown, allowed: readonly T[]): T[] | null => {
  if (!Array.isArray(value)) return null;
  const clean = value.filter((entry): entry is T => allowed.includes(entry as T));
  return clean.length === value.length ? clean : null;
};

// Returns a clean draft, or null when the stored data is not usable.
export function validateDraft(data: unknown): QuizDraft | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as { answers?: Record<string, unknown>; index?: unknown };
  const a = raw.answers;
  if (!a || typeof a !== "object") return null;

  const styles = only(a.styles, styleValues);
  const colours = only(a.colours, colourValues);
  const occasions = only(a.occasions, occasionValues);
  const considerations = only(a.considerations, considerationValues);
  if (!styles || !colours || !occasions || !considerations) return null;
  if (styles.length > limits.styles || colours.length > limits.colours) return null;
  if (occasions.length > limits.occasions || considerations.length > limits.considerations) return null;

  const fit = a.fit === null ? null : (fitValues as readonly unknown[]).includes(a.fit) ? (a.fit as QuizAnswers["fit"]) : undefined;
  const budgetId =
    a.budgetId === null
      ? null
      : budgetOptions.find((option) => option.id === a.budgetId)?.id;
  if (fit === undefined || budgetId === undefined) return null;
  if (typeof a.notes !== "string" || a.notes.length > limits.notes) return null;

  const index = raw.index;
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index > steps.length) {
    return null;
  }

  return {
    answers: { styles, colours, occasions, fit, budgetId, considerations, notes: a.notes },
    index,
  };
}
