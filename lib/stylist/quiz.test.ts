import { describe, expect, it } from "vitest";
import { budgetOptions } from "./options";
import {
  emptyAnswers,
  firstMissingStep,
  isAnswered,
  stepProblem,
  toggleLimited,
  toStylistInput,
  type QuizAnswers,
} from "./quiz";
import { stylistInputSchema } from "./schema";

const complete: QuizAnswers = {
  styles: ["minimal", "boho"],
  colours: ["neutrals", "warm-tones"],
  occasions: ["everyday", "work"],
  fit: "relaxed",
  budgetId: "1500-4000",
  considerations: ["comfort-first"],
  notes: "  Prefer cotton.  ",
};

describe("quiz rules", () => {
  it("only asks for the answers the current step needs", () => {
    expect(stepProblem("styles", emptyAnswers)).not.toBeNull();
    expect(stepProblem("colours", emptyAnswers)).toBeNull();
    expect(stepProblem("fit", emptyAnswers)).toBeNull();
    expect(stepProblem("extras", emptyAnswers)).toBeNull();
    expect(stepProblem("budget", emptyAnswers)).not.toBeNull();
  });

  it("names the first required step that is still missing", () => {
    expect(firstMissingStep(emptyAnswers)).toBe("styles");
    expect(firstMissingStep({ ...complete, occasions: [] })).toBe("occasions");
    expect(firstMissingStep({ ...complete, budgetId: null })).toBe("budget");
    expect(firstMissingStep(complete)).toBeNull();
  });

  it("knows which steps have an answer", () => {
    expect(isAnswered("fit", emptyAnswers)).toBe(false);
    expect(isAnswered("fit", complete)).toBe(true);
    expect(isAnswered("extras", { ...emptyAnswers, notes: "  " })).toBe(false);
    expect(isAnswered("extras", complete)).toBe(true);
  });

  it("toggles a choice and respects the maximum", () => {
    expect(toggleLimited(["a"], "b", 2)).toEqual(["a", "b"]);
    expect(toggleLimited(["a", "b"], "c", 2)).toEqual(["a", "b"]);
    expect(toggleLimited(["a", "b"], "a", 2)).toEqual(["b"]);
  });
});

describe("toStylistInput", () => {
  it("builds a request the styling service accepts", () => {
    const input = toStylistInput(complete);
    expect(input).not.toBeNull();
    expect(stylistInputSchema.safeParse(input).success).toBe(true);
    expect(input).toMatchObject({ currency: "INR", budgetTier: "mid", notes: "Prefer cotton." });
  });

  it("does not build a request while a required answer is missing", () => {
    expect(toStylistInput({ ...complete, styles: [] })).toBeNull();
  });

  it("accepts a quiz with every optional question skipped", () => {
    const minimal: QuizAnswers = {
      ...emptyAnswers,
      styles: ["classic"],
      occasions: ["travel"],
      budgetId: "none",
    };
    const input = toStylistInput(minimal);
    expect(stylistInputSchema.safeParse(input).success).toBe(true);
    expect(input?.budgetTier).toBe("none");
    expect(input?.fit).toBeNull();
  });

  it("maps every budget option to a tier the service accepts", () => {
    for (const option of budgetOptions) {
      const input = toStylistInput({ ...complete, budgetId: option.id });
      expect(stylistInputSchema.safeParse(input).success).toBe(true);
    }
  });
});
