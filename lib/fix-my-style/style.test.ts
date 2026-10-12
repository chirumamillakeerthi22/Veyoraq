import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OutfitAnalysis } from "./schema";
import { outfitAnalysisSchema } from "./schema";

const generateImage = vi.fn();
vi.mock("@/lib/ai/gemini-image", () => ({ generateImage }));

const { buildImagePrompt, createStyledImage } = await import("./style");

const analysis: OutfitAnalysis = {
  isOutfit: true,
  items: [
    { name: "Navy t-shirt", category: "top", colours: ["navy"], details: "plain cotton look" },
    { name: "Beige trousers", category: "bottom", colours: ["beige"], details: "straight cut" },
  ],
  assessment: "A calm, balanced outfit.",
  improvements: ["Tuck the front of the t-shirt.", "Roll the trouser hem once."],
  additions: [],
};

const reference = { mimeType: "image/jpeg", base64: "AAAA" };

describe("buildImagePrompt", () => {
  it("keeps the same garments and applies the styling changes", () => {
    const prompt = buildImagePrompt(analysis);
    expect(prompt).toContain("Navy t-shirt");
    expect(prompt).toContain("Beige trousers");
    expect(prompt).toContain("Tuck the front");
    expect(prompt).toMatch(/same garments/i);
    expect(prompt).toMatch(/do not replace any garment/i);
  });

  it("still produces a usable prompt with no improvements listed", () => {
    expect(buildImagePrompt({ ...analysis, improvements: [] })).toMatch(/Improve the coordination/);
  });
});

describe("createStyledImage", () => {
  beforeEach(() => generateImage.mockReset());

  it("returns the generated image", async () => {
    generateImage.mockResolvedValue({ ok: true, mimeType: "image/png", data: "QUJD" });
    expect(await createStyledImage(analysis, reference)).toEqual({
      status: "generated",
      mimeType: "image/png",
      data: "QUJD",
    });
    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({ reference, prompt: expect.stringContaining("Navy t-shirt") }),
    );
  });

  it("reports a missing configuration without inventing an image", async () => {
    generateImage.mockResolvedValue({ ok: false, code: "not_configured", message: "Not on" });
    expect(await createStyledImage(analysis, reference)).toEqual({ status: "not_configured", message: "Not on" });
  });

  it("reports a quota problem as unavailable and other failures as failed", async () => {
    generateImage.mockResolvedValueOnce({ ok: false, code: "quota", message: "No plan" });
    expect(await createStyledImage(analysis, reference)).toMatchObject({ status: "unavailable" });
    generateImage.mockResolvedValueOnce({ ok: false, code: "timeout", message: "Slow" });
    expect(await createStyledImage(analysis, reference)).toMatchObject({ status: "failed" });
  });
});

describe("outfitAnalysisSchema", () => {
  it("accepts a valid analysis", () => {
    expect(outfitAnalysisSchema.safeParse(analysis).success).toBe(true);
  });

  it("rejects prices, links and unknown fields", () => {
    expect(outfitAnalysisSchema.safeParse({ ...analysis, assessment: "Only $40 at https://x.example" }).success).toBe(false);
    expect(outfitAnalysisSchema.safeParse({ ...analysis, price: 10 }).success).toBe(false);
  });

  it("accepts a photo that is not an outfit", () => {
    expect(
      outfitAnalysisSchema.safeParse({ ...analysis, isOutfit: false, items: [], improvements: [] }).success,
    ).toBe(true);
  });
});
