import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyHairAnswers, type HairAnswers } from "./quiz";
import { areDistinct, planSchema, type HairConcept } from "./schema";

const callGeminiJson = vi.fn();
const generateImage = vi.fn();
vi.mock("@/lib/ai/gemini-json", () => ({ callGeminiJson }));
vi.mock("@/lib/ai/gemini-image", () => ({ generateImage }));

const { buildHairImagePrompt, planLooks, renderLook } = await import("./generate");

const concept = (overrides: Partial<HairConcept> = {}): HairConcept => ({
  name: "Soft Layers",
  description: "Long layers with face-framing pieces.",
  whyItMatches: "You asked for face-framing layers.",
  effort: "low",
  maintenance: "Air dry and trim every few months.",
  professionalNote: "",
  length: "long",
  layers: "long layers",
  fringe: "no fringe",
  volume: "soft natural volume",
  finish: "air-dried",
  ...overrides,
});

const four: HairConcept[] = [
  concept(),
  concept({ name: "Curtain Fringe", length: "medium", fringe: "curtain bangs", layers: "shaped layers" }),
  concept({ name: "Sleek Lob", length: "short", layers: "blunt one-length", finish: "sleek blowout" }),
  concept({ name: "Bouncy Waves", volume: "full bouncy volume", finish: "defined waves", layers: "round layers" }),
];

const answers: HairAnswers = { ...emptyHairAnswers, hairType: "wavy", thickness: "medium", length: "keep" };
const photo = { mimeType: "image/jpeg", base64: "AAAA" };

describe("areDistinct", () => {
  it("accepts four ideas that differ in at least two attributes", () => {
    expect(areDistinct(four)).toBe(true);
  });

  it("rejects ideas that are near-copies or share a name", () => {
    expect(areDistinct([four[0], { ...four[0], name: "Same But Renamed" }, four[2], four[3]])).toBe(false);
    expect(areDistinct([four[0], { ...four[1], name: "soft layers" }, four[2], four[3]])).toBe(false);
  });
});

describe("planSchema", () => {
  it("rejects prices, links and unknown fields", () => {
    expect(
      planSchema.safeParse({ photoUsable: true, photoNote: "", concepts: [concept({ description: "Only $20 at https://x.test" })], caveat: "" }).success,
    ).toBe(false);
    expect(
      planSchema.safeParse({ photoUsable: true, photoNote: "", concepts: [], caveat: "", extra: 1 }).success,
    ).toBe(false);
  });
});

describe("planLooks", () => {
  beforeEach(() => callGeminiJson.mockReset());

  it("returns four distinct ideas", async () => {
    callGeminiJson.mockResolvedValue({ ok: true, data: { photoUsable: true, photoNote: "", concepts: four, caveat: "" } });
    const result = await planLooks(photo, answers);
    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.concepts).toHaveLength(4);
  });

  it("sends the photo and the answers, not instructions from the person", async () => {
    callGeminiJson.mockResolvedValue({ ok: true, data: { photoUsable: true, photoNote: "", concepts: four, caveat: "" } });
    await planLooks(photo, answers);
    const call = callGeminiJson.mock.calls[0][0];
    expect(call.parts[0]).toEqual({ inlineData: photo.mimeType ? { mimeType: "image/jpeg", data: "AAAA" } : undefined });
    expect(String(call.parts[1].text)).toContain("Wavy");
    expect(call.system).toMatch(/never comment on the person's face shape/i);
  });

  it("reports a photo with no person without inventing looks", async () => {
    callGeminiJson.mockResolvedValue({
      ok: true,
      data: { photoUsable: false, photoNote: "No person is visible.", concepts: [], caveat: "" },
    });
    expect(await planLooks(photo, answers)).toMatchObject({ ok: false, code: "no_person" });
  });

  it("refuses ideas that are not genuinely different", async () => {
    const copies = [four[0], { ...four[0], name: "Copy A" }, { ...four[0], name: "Copy B" }, { ...four[0], name: "Copy C" }];
    callGeminiJson.mockResolvedValue({ ok: true, data: { photoUsable: true, photoNote: "", concepts: copies, caveat: "" } });
    expect(await planLooks(photo, answers)).toMatchObject({ ok: false, code: "not_distinct" });
  });

  it("refuses an answer with fewer than four ideas", async () => {
    callGeminiJson.mockResolvedValue({ ok: true, data: { photoUsable: true, photoNote: "", concepts: four.slice(0, 3), caveat: "" } });
    expect(await planLooks(photo, answers)).toMatchObject({ ok: false });
  });

  it("passes through a missing configuration honestly", async () => {
    callGeminiJson.mockResolvedValue({ ok: false, code: "not_configured", message: "Not set up" });
    expect(await planLooks(photo, answers)).toEqual({ ok: false, code: "not_configured", message: "Not set up" });
  });
});

describe("image prompt and rendering", () => {
  beforeEach(() => generateImage.mockReset());

  it("asks to change only the hair and keep the same person", () => {
    const prompt = buildHairImagePrompt(four[1], answers);
    expect(prompt).toMatch(/same person exactly/i);
    expect(prompt).toMatch(/do not beautify/i);
    expect(prompt).toMatch(/change anything except the hair/i);
    expect(prompt).toContain("curtain bangs");
    expect(prompt).toContain("wavy hair");
  });

  it("builds a different prompt for each idea", () => {
    const prompts = new Set(four.map((item) => buildHairImagePrompt(item, answers)));
    expect(prompts.size).toBe(4);
  });

  it("maps image outcomes to honest statuses", async () => {
    generateImage.mockResolvedValueOnce({ ok: true, mimeType: "image/png", data: "QUJD" });
    expect(await renderLook(four[0], answers, photo)).toEqual({ status: "generated", mimeType: "image/png", data: "QUJD" });
    generateImage.mockResolvedValueOnce({ ok: false, code: "not_configured", message: "Off" });
    expect(await renderLook(four[0], answers, photo)).toMatchObject({ status: "not_configured" });
    generateImage.mockResolvedValueOnce({ ok: false, code: "quota", message: "Plan" });
    expect(await renderLook(four[0], answers, photo)).toMatchObject({ status: "unavailable" });
    generateImage.mockResolvedValueOnce({ ok: false, code: "timeout", message: "Slow" });
    expect(await renderLook(four[0], answers, photo)).toMatchObject({ status: "failed" });
  });

  it("sends the person's photo as the reference", async () => {
    generateImage.mockResolvedValue({ ok: true, mimeType: "image/png", data: "QUJD" });
    await renderLook(four[0], answers, photo);
    expect(generateImage).toHaveBeenCalledWith(expect.objectContaining({ reference: photo }));
  });
});
