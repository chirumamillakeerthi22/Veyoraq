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
