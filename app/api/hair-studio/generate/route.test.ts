import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyHairAnswers } from "@/lib/hair-studio/quiz";
import type { HairConcept, HairEvent } from "@/lib/hair-studio/schema";

const planLooks = vi.fn();
const renderLook = vi.fn();
vi.mock("@/lib/hair-studio/generate", () => ({ planLooks, renderLook }));

const { POST } = await import("./route");
const { hairRetryLimiter, hairRunLimiter } = await import("@/lib/hair-studio/http");

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3]).toString("base64");
const TEXT = Buffer.from("not an image at all").toString("base64");
const answers = { ...emptyHairAnswers, hairType: "wavy", thickness: "medium" };

const concept = (name: string, length: HairConcept["length"]): HairConcept => ({
  name,
  description: "A look.",
  whyItMatches: "Matches.",
  effort: "low",
  maintenance: "Easy.",
  professionalNote: "",
  length,
  layers: name,
  fringe: name,
  volume: name,
  finish: name,
});
const four = [concept("A", "short"), concept("B", "medium"), concept("C", "long"), concept("D", "long")];

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://veyoraq.test/api/hair-studio/generate", {
      method: "POST",
      headers: { host: "veyoraq.test", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function events(response: Response): Promise<HairEvent[]> {
  return (await response.text())
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as HairEvent);
}

describe("POST /api/hair-studio/generate", () => {
  beforeEach(() => {
    planLooks.mockReset();
    renderLook.mockReset();
    hairRunLimiter.reset();
    hairRetryLimiter.reset();
  });

  it("streams the four ideas, then four images, one per idea", async () => {
    planLooks.mockResolvedValue({ ok: true, concepts: four, caveat: "AI visualisations." });
    renderLook.mockImplementation(async (item: HairConcept) => ({
      status: "generated",
      mimeType: "image/png",
      data: `IMG-${item.name}`,
    }));

    const response = await post({ image: JPEG, answers, mode: "all" });
    expect(response.status).toBe(200);
    const list = await events(response);

    expect(list[0]).toMatchObject({ type: "plan", caveat: "AI visualisations." });
    const images = list.filter((event) => event.type === "image");
    expect(images).toHaveLength(4);
    const data = images.map((event) => (event.type === "image" && event.image.status === "generated" ? event.image.data : ""));
    expect(new Set(data).size).toBe(4); // four different pictures, not one repeated
    expect(list.at(-1)).toEqual({ type: "done" });
    expect(renderLook).toHaveBeenCalledTimes(4);
  });

  it("keeps the pictures that worked when one fails", async () => {
    planLooks.mockResolvedValue({ ok: true, concepts: four, caveat: "" });
    renderLook.mockImplementation(async (item: HairConcept) =>
      item.name === "C"
        ? { status: "failed", message: "We couldn't generate your styled look this time. Please try again." }
        : { status: "generated", mimeType: "image/png", data: "OK" },
    );
    const list = await events(await post({ image: JPEG, answers, mode: "all" }));
    const statuses = list
      .filter((event): event is Extract<HairEvent, { type: "image" }> => event.type === "image")
      .sort((a, b) => a.index - b.index)
      .map((event) => event.image.status);
    expect(statuses).toEqual(["generated", "generated", "failed", "generated"]);
  });

  it("still returns the ideas when image generation is not configured", async () => {
    planLooks.mockResolvedValue({ ok: true, concepts: four, caveat: "" });
    renderLook.mockResolvedValue({ status: "not_configured", message: "Off" });
    const list = await events(await post({ image: JPEG, answers, mode: "all" }));
    expect(list[0].type).toBe("plan");
    expect(list.filter((event) => event.type === "image")).toHaveLength(4);
  });

  it("sends an error and no images when planning fails", async () => {
    planLooks.mockResolvedValue({ ok: false, code: "no_person", message: "No person visible." });
    const list = await events(await post({ image: JPEG, answers, mode: "all" }));
    expect(list).toEqual([{ type: "error", message: "No person visible." }]);
    expect(renderLook).not.toHaveBeenCalled();
  });

  it("re-renders a single idea", async () => {
    renderLook.mockResolvedValue({ status: "generated", mimeType: "image/png", data: "ONE" });
    const list = await events(await post({ image: JPEG, answers, mode: "one", index: 2, concept: four[2] }));
    expect(list[0]).toMatchObject({ type: "image", index: 2 });
    expect(planLooks).not.toHaveBeenCalled();
    expect(renderLook).toHaveBeenCalledTimes(1);
  });

  it("checks the file's own bytes and the answers before doing anything", async () => {
    expect((await post({ image: TEXT, answers, mode: "all" })).status).toBe(415);
    expect((await post({ image: JPEG, answers: { ...answers, hairType: "frizzy" }, mode: "all" })).status).toBe(400);
    expect((await post({ image: JPEG, answers, mode: "one", index: 1 })).status).toBe(400);
    expect((await post({ image: JPEG, answers, mode: "all", extra: true })).status).toBe(400);
    expect(planLooks).not.toHaveBeenCalled();
  });

  it("rejects malformed, non-base64 and oversized input, and cross-site requests", async () => {
    expect((await post("{nope")).status).toBe(400);
    expect((await post({ image: "###", answers, mode: "all" })).status).toBe(400);
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1_300_000)]).toString("base64");
    expect((await post({ image: big, answers, mode: "all" })).status).toBe(413);
    expect((await post({ image: JPEG, answers, mode: "all" }, { origin: "https://evil.test" })).status).toBe(403);
  });

  it("rate limits repeated full runs before calling any AI", async () => {
    planLooks.mockResolvedValue({ ok: false, code: "failed", message: "x" });
    let last = 200;
    for (let i = 0; i < 5; i += 1) {
      const response = await post({ image: JPEG, answers, mode: "all" });
      last = response.status;
      await response.text();
    }
    expect(last).toBe(429);
  });
});
