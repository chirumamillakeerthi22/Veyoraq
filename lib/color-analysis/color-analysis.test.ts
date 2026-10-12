import { beforeEach, describe, expect, it, vi } from "vitest";
import { assessPixels } from "./photo-check";
import {
  emptyColourAnswers,
  firstMissingStep,
  parseColourAnswers,
  toggleLimited,
  type ColourAnswers,
} from "./quiz";
import {
  analysisSchema,
  hasUsablePalette,
  validateColourDraft,
  type ColourAnalysis,
} from "./schema";

const callGeminiJson = vi.fn();
vi.mock("@/lib/ai/gemini-json", () => ({ callGeminiJson }));
const { analyseColours } = await import("./generate");

const swatch = (name: string, hex: string) => ({ name, hex, usage: "Wear it near the face." });

const valid: ColourAnalysis = {
  photoUsable: true,
  photoNote: "",
  undertone: { value: "warm", confidence: "medium", explanation: "Gold-leaning tones look natural." },
  depth: "medium",
  contrast: "medium",
  likelySeason: "warm-autumn",
  alternativeSeason: "soft-autumn",
  explorePalettes: [],
  confidenceExplanation: "Daylight helped, but one photo is never certain.",
  summary: "Earthy, golden shades look natural on you.",
  recommendedColors: [swatch("Terracotta", "#C8693F"), swatch("Olive", "#6B6F3A"), swatch("Camel", "#B08968")],
  neutralColors: [swatch("Cream", "#F3E9D8"), swatch("Chocolate", "#4A3426")],
  accentColors: [swatch("Mustard", "#D1A02B")],
  colorsToExploreCarefully: [swatch("Icy Blue", "#CFE3F0")],
  colorCombinations: [
    { name: "Easy Monday", colors: ["#C8693F", "#F3E9D8"], occasion: "work", idea: "Terracotta top with cream trousers." },
  ],
  stylingAdvice: ["Keep your strongest colours near your face."],
};

const answers: ColourAnswers = {
  ...emptyColourAnswers,
  hair: "dark-brown",
  eyes: "light-brown",
  budget: "mid",
};

describe("analysis schema", () => {
  it("accepts a valid analysis and one that says it is uncertain", () => {
    expect(analysisSchema.safeParse(valid).success).toBe(true);
    const uncertain = {
      ...valid,
      undertone: { ...valid.undertone, value: "uncertain" as const, confidence: "low" as const },
      likelySeason: "uncertain" as const,
      alternativeSeason: "none" as const,
      explorePalettes: ["soft-autumn", "warm-autumn"],
    };
    expect(analysisSchema.safeParse(uncertain).success).toBe(true);
  });

  it("rejects an invalid HEX value, prices, links and extra fields", () => {
    const badHex = { ...valid, recommendedColors: [swatch("Terracotta", "terracotta"), ...valid.recommendedColors] };
    expect(analysisSchema.safeParse(badHex).success).toBe(false);
    expect(analysisSchema.safeParse({ ...valid, summary: "Only $10 at https://x.test" }).success).toBe(false);
    expect(analysisSchema.safeParse({ ...valid, ethnicity: "x" }).success).toBe(false);
    expect(
      analysisSchema.safeParse({
        ...valid,
        colorCombinations: [{ name: "x", colors: ["#fff", "#000000"], occasion: "work", idea: "x" }],
      }).success,
    ).toBe(false);
  });

  it("knows when a result has too little colour to draw a palette", () => {
    expect(hasUsablePalette(valid)).toBe(true);
    expect(hasUsablePalette({ ...valid, recommendedColors: valid.recommendedColors.slice(0, 2) })).toBe(false);
    expect(hasUsablePalette({ ...valid, photoUsable: false })).toBe(false);
  });
});

describe("quiz rules and drafts", () => {
  it("only needs hair and eye colour, and 'unsure' counts", () => {
    expect(firstMissingStep(emptyColourAnswers)).toBe("hair");
    expect(firstMissingStep({ ...emptyColourAnswers, hair: "unsure" })).toBe("eyes");
    expect(firstMissingStep({ ...emptyColourAnswers, hair: "unsure", eyes: "unsure" })).toBeNull();
  });

  it("limits qualities and rejects bad values", () => {
    expect(toggleLimited(["soft", "deep"], "bright", 2)).toEqual(["soft", "deep"]);
    expect(parseColourAnswers({ ...answers, hair: "purple" })).toBeNull();
    expect(parseColourAnswers({ ...answers, qualities: ["soft", "soft"] })).toBeNull();
    expect(parseColourAnswers({ ...answers, currency: "JPY" })).toBeNull();
    expect(parseColourAnswers(answers)).toEqual(answers);
  });

  it("restores a draft with a result and refuses results without one", () => {
    const draft = { stage: "results", index: 6, answers, result: valid };
    expect(validateColourDraft(draft)?.result?.likelySeason).toBe("warm-autumn");
    expect(validateColourDraft({ ...draft, result: null })).toBeNull();
    expect(validateColourDraft({ stage: "quiz", index: 2, answers, result: null })?.stage).toBe("quiz");
    expect(validateColourDraft({ ...draft, index: 99 })).toBeNull();
    expect(validateColourDraft({ ...draft, result: { ...valid, summary: "$5 at https://x.test" } })).toBeNull();
  });
});

describe("photo checks", () => {
  const solid = (value: number, size = 8) => {
    const data = new Uint8ClampedArray(size * size * 4);
    for (let i = 0; i < size * size; i += 1) data.set([value, value, value, 255], i * 4);
    return data;
  };

  it("warns about very dark, very bright and flat images", () => {
    expect(assessPixels(solid(10), 8, 8)).toContain("dark");
    expect(assessPixels(solid(250), 8, 8)).toContain("bright");
    expect(assessPixels(solid(120), 8, 8)).toContain("low-contrast");
  });

  it("does not warn about a sharp, well-exposed pattern", () => {
    const size = 16;
    const data = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const v = (x + y) % 2 === 0 ? 60 : 200;
        data.set([v, v, v, 255], (y * size + x) * 4);
      }
    }
    expect(assessPixels(data, size, size)).toEqual([]);
  });
});

describe("analyseColours", () => {
  beforeEach(() => callGeminiJson.mockReset());
  const photo = { mimeType: "image/jpeg", base64: "AAAA" };

  it("returns the validated analysis and sends the photo with the answers", async () => {
    callGeminiJson.mockResolvedValue({ ok: true, data: valid });
    const result = await analyseColours(photo, answers);
    expect(result).toMatchObject({ ok: true });
    const call = callGeminiJson.mock.calls[0][0];
    expect(call.parts[0]).toEqual({ inlineData: { mimeType: "image/jpeg", data: "AAAA" } });
    expect(String(call.parts[1].text)).toContain("Dark brown");
    expect(call.system).toMatch(/never infer ethnicity/i);
  });

  it("reports an unusable photo and an incomplete palette honestly", async () => {
    callGeminiJson.mockResolvedValueOnce({ ok: true, data: { ...valid, photoUsable: false, photoNote: "No face visible." } });
    expect(await analyseColours(photo, answers)).toMatchObject({ ok: false, code: "no_photo", message: "No face visible." });
    callGeminiJson.mockResolvedValueOnce({ ok: true, data: { ...valid, recommendedColors: [] } });
    expect(await analyseColours(photo, answers)).toMatchObject({ ok: false, code: "weak" });
  });

  it("passes through a missing configuration and other failures", async () => {
    callGeminiJson.mockResolvedValueOnce({ ok: false, code: "not_configured", message: "Not set up" });
    expect(await analyseColours(photo, answers)).toMatchObject({ ok: false, code: "not_configured" });
    callGeminiJson.mockResolvedValueOnce({ ok: false, code: "upstream_error", message: "Try again" });
    expect(await analyseColours(photo, answers)).toMatchObject({ ok: false, code: "failed" });
  });
});
