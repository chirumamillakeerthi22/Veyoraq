import { describe, expect, it } from "vitest";
import { emptyFitDraft, photoAnalysisSchema, validateFitDraft } from "./schema";

describe("validateFitDraft", () => {
  it("accepts a fresh draft", () => {
    expect(validateFitDraft(emptyFitDraft)).toEqual(emptyFitDraft);
  });

  it("cleans unknown values instead of trusting them", () => {
    const clean = validateFitDraft({
      ...emptyFitDraft,
      stage: "quiz",
      shape: "zigzag",
      unit: "yards",
      quiz: { fitPref: "baggy", categories: ["tops", "hats", "tops"], occasions: ["work"], focus: [], comfort: [] },
      sizes: { tops: "M", bottoms: "<script>" },
      measurements: { chest: "90", waist: "x".repeat(20), hips: "", shoulders: "" },
    });
    expect(clean?.shape).toBeNull();
    expect(clean?.unit).toBe("cm");
    expect(clean?.quiz.fitPref).toBeNull();
    expect(clean?.quiz.categories).toEqual(["tops"]);
    expect(clean?.sizes).toEqual({ tops: "M" });
    expect(clean?.measurements.chest).toBe("90");
    expect(clean?.measurements.waist).toBe("");
  });

  it("rejects an unusable draft", () => {
    expect(validateFitDraft(null)).toBeNull();
    expect(validateFitDraft({ ...emptyFitDraft, stage: "nope" })).toBeNull();
    expect(validateFitDraft({ ...emptyFitDraft, index: 99 })).toBeNull();
  });

  it("never carries a photo", () => {
    const clean = validateFitDraft({ ...emptyFitDraft, photo: "data:image/jpeg;base64,AAAA" });
    expect(clean).not.toHaveProperty("photo");
  });
});

describe("photoAnalysisSchema", () => {
  const ok = {
    photoUsable: true,
    photoNote: "",
    shape: "rectangle",
    confidence: "low",
    observations: ["Shoulders and hips look similar in width."],
  };

  it("accepts a cautious result", () => {
    expect(photoAnalysisSchema.safeParse(ok).success).toBe(true);
  });

  it("rejects links, prices and extra fields", () => {
    expect(photoAnalysisSchema.safeParse({ ...ok, observations: ["Buy at https://x.test"] }).success).toBe(false);
    expect(photoAnalysisSchema.safeParse({ ...ok, weight: "x" }).success).toBe(false);
    expect(photoAnalysisSchema.safeParse({ ...ok, shape: "skinny" }).success).toBe(false);
  });
});
