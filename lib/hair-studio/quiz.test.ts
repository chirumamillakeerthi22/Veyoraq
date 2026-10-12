import { describe, expect, it } from "vitest";
import {
  emptyHairAnswers,
  firstMissingStep,
  isStepAnswered,
  parseHairAnswers,
  stepProblem,
  toggleLimited,
  toggleWithNone,
  validateHairDraft,
  type HairAnswers,
} from "./quiz";

const complete: HairAnswers = {
  hairType: "wavy",
  thickness: "unsure",
  changes: ["subtle-refresh"],
  occasions: ["everyday", "office"],
  framing: ["face-layers"],
  highlights: ["eyes"],
  volume: "natural",
  length: "keep",
  styling: "minimal",
  extras: ["heat-free"],
};

describe("hair quiz rules", () => {
  it("only requires the two hair questions, and Not sure counts as an answer", () => {
    expect(firstMissingStep(emptyHairAnswers)).toBe("hairType");
    expect(firstMissingStep({ ...emptyHairAnswers, hairType: "unsure" })).toBe("thickness");
    expect(firstMissingStep({ ...emptyHairAnswers, hairType: "unsure", thickness: "unsure" })).toBeNull();
    expect(stepProblem("changes", emptyHairAnswers)).toBeNull();
    expect(stepProblem("lifestyle", emptyHairAnswers)).toBeNull();
  });

  it("knows which steps have been answered", () => {
    expect(isStepAnswered("volume", emptyHairAnswers)).toBe(false);
    expect(isStepAnswered("lifestyle", { ...emptyHairAnswers, extras: ["heat-free"] })).toBe(true);
    expect(isStepAnswered("framing", complete)).toBe(true);
  });

  it("limits how many choices can be picked", () => {
    expect(toggleLimited(["a", "b", "c"], "d", 3)).toEqual(["a", "b", "c"]);
    expect(toggleLimited(["a", "b"], "a", 3)).toEqual(["b"]);
  });

  it("treats 'no preference' as exclusive without touching other questions", () => {
    expect(toggleWithNone(["bangs", "face-layers"], "no-preference", "no-preference", 3)).toEqual(["no-preference"]);
    expect(toggleWithNone(["no-preference"], "bangs", "no-preference", 3)).toEqual(["bangs"]);
    expect(toggleWithNone(["no-preference"], "no-preference", "no-preference", 3)).toEqual([]);
  });
});

describe("hair answer and draft validation", () => {
  it("accepts a complete set of answers", () => {
    expect(parseHairAnswers(complete)).toEqual(complete);
  });

  it("rejects unknown values, too many choices and wrong types", () => {
    expect(parseHairAnswers({ ...complete, hairType: "frizzy" })).toBeNull();
    expect(parseHairAnswers({ ...complete, occasions: ["everyday", "office", "party", "wedding"] })).toBeNull();
    expect(parseHairAnswers({ ...complete, changes: "subtle-refresh" })).toBeNull();
    expect(parseHairAnswers(null)).toBeNull();
  });

  it("validates a stored draft and rejects a bad step", () => {
    expect(validateHairDraft({ answers: complete, index: 5 })).toEqual({ answers: complete, index: 5 });
    expect(validateHairDraft({ answers: complete, index: 99 })).toBeNull();
    expect(validateHairDraft({ answers: complete, index: 1.5 })).toBeNull();
    expect(validateHairDraft({ answers: { ...complete, volume: "huge" }, index: 1 })).toBeNull();
  });
});
