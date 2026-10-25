import { describe, expect, it } from "vitest";
import { buildReport, emptyFitQuiz, isFitReport, type ReportInput } from "./report";

const base: ReportInput = {
  audience: "women",
  shape: "pear",
  source: "chosen",
  measurements: null,
  unit: "cm",
  sizes: {},
  quiz: emptyFitQuiz,
  photoObservations: [],
};

const ids = (input: Partial<ReportInput>) => buildReport({ ...base, ...input }).sections.map((s) => s.id);

describe("buildReport", () => {
  it("covers every garment area when no categories were chosen", () => {
    expect(ids({})).toEqual(["silhouettes", "tops", "bottoms", "dresses", "lengths", "layers", "shopping"]);
  });

  it("limits sections to the chosen categories, always keeping silhouettes, lengths and shopping", () => {
    expect(ids({ quiz: { ...emptyFitQuiz, categories: ["tops"] } })).toEqual(["silhouettes", "tops", "lengths", "shopping"]);
  });

  it("never includes dresses for men", () => {
    expect(ids({ audience: "men", shape: "rectangle" })).not.toContain("dresses");
  });

  it("gives every tip a reason, for every audience and shape", () => {
    for (const audience of ["women", "men"] as const) {
      for (const shape of ["hourglass", "pear", "apple", "rectangle", "inverted-triangle", "trapezoid", "unsure"] as const) {
        const report = buildReport({ ...base, audience, shape });
        for (const section of report.sections) {
          for (const tip of section.tips) {
            expect(tip.title.length).toBeGreaterThan(3);
            expect(tip.why.length).toBeGreaterThan(10);
          }
        }
      }
    }
  });

  it("states limitations, and says when a pattern is only tentative", () => {
    expect(buildReport(base).limitations.join(" ")).toMatch(/not a medical or scientific/);
    expect(buildReport({ ...base, source: "measurements" }).limitations[0]).toMatch(/tentative/);
    expect(buildReport({ ...base, source: "photo" }).limitations[0]).toMatch(/cannot give reliable measurements/);
  });

  it("shows only what was provided, in the chosen unit, and does not infer measurements from sizes", () => {
    const report = buildReport({
      ...base,
      source: "measurements",
      measurements: { chest: 91.4, waist: 71.1, hips: 96.5 },
      unit: "in",
      sizes: { tops: "M" },
    });
    const text = report.profile.map((p) => `${p.label}=${p.value}`).join("|");
    expect(text).toContain("Bust=36 in");
    expect(text).toContain("Usual size: Tops=M");
    expect(text).not.toContain("Shoulder");
    expect(report.notes.map((n) => n.title)).toContain("About what you shared");
  });

  it("reflects preferences and comfort needs", () => {
    const report = buildReport({
      ...base,
      quiz: { ...emptyFitQuiz, fitPref: "relaxed", comfort: ["covered-arms"], occasions: ["work"], focus: ["keep-easy"] },
    });
    const titles = report.notes.map((n) => n.title);
    expect(titles).toEqual(expect.arrayContaining(["Based on your preferences", "Comfort and coverage", "For your occasions"]));
  });

  it("produces something that passes the on-device validity check", () => {
    expect(isFitReport(buildReport(base))).toBe(true);
    expect(isFitReport({ version: 2 })).toBe(false);
    expect(isFitReport(null)).toBe(false);
  });
});
