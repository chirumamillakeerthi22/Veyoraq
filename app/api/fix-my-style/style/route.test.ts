import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OutfitAnalysis, StyleEvent } from "@/lib/fix-my-style/schema";

const analyzeOutfit = vi.fn();
const createStyledImage = vi.fn();
vi.mock("@/lib/fix-my-style/style", () => ({ analyzeOutfit, createStyledImage }));

const { POST } = await import("./route");
const { styleLimiter } = await import("@/lib/fix-my-style/http");

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3]).toString("base64");
const TEXT = Buffer.from("not an image at all").toString("base64");

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://veyoraq.test/api/fix-my-style/style", {
      method: "POST",
      headers: { host: "veyoraq.test", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function events(response: Response): Promise<StyleEvent[]> {
  const text = await response.text();
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as StyleEvent);
}

const analysis: OutfitAnalysis = {
  isOutfit: true,
  items: [{ name: "Navy tee", category: "top", colours: ["navy"], details: "plain" }],
  assessment: "Balanced.",
  improvements: ["Tuck it in."],
  additions: [],
};

describe("POST /api/fix-my-style/style", () => {
  beforeEach(() => {
    analyzeOutfit.mockReset();
    createStyledImage.mockReset();
    styleLimiter.reset();
  });

  it("streams the analysis first, then the image result", async () => {
    analyzeOutfit.mockResolvedValue({ ok: true, data: analysis });
    createStyledImage.mockResolvedValue({ status: "generated", mimeType: "image/png", data: "QUJD" });

    const response = await post({ image: JPEG });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect((await events(response)).map((event) => event.type)).toEqual(["analysis", "image", "done"]);
    expect(analyzeOutfit).toHaveBeenCalledWith({ mimeType: "image/jpeg", base64: JPEG });
  });

  it("still returns the written advice when images are not available", async () => {
    analyzeOutfit.mockResolvedValue({ ok: true, data: analysis });
    createStyledImage.mockResolvedValue({ status: "not_configured", message: "Not switched on" });

    const list = await events(await post({ image: JPEG }));
    expect(list[0]).toMatchObject({ type: "analysis" });
    expect(list[1]).toMatchObject({ type: "image", data: { status: "not_configured" } });
  });

  it("does not generate an image when the photo is not an outfit", async () => {
    analyzeOutfit.mockResolvedValue({ ok: true, data: { ...analysis, isOutfit: false } });
    const list = await events(await post({ image: JPEG }));
    expect(createStyledImage).not.toHaveBeenCalled();
    expect(list[1]).toMatchObject({ type: "image", data: { status: "skipped" } });
  });

  it("sends an error event when the analysis fails", async () => {
    analyzeOutfit.mockResolvedValue({ ok: false, code: "upstream_error", message: "Try again" });
    const list = await events(await post({ image: JPEG }));
    expect(list).toEqual([{ type: "error", message: "Try again" }]);
    expect(createStyledImage).not.toHaveBeenCalled();
  });

  it("checks the file's own bytes, not what the client claims", async () => {
    expect((await post({ image: TEXT, mimeType: "image/jpeg" })).status).toBe(400);
    expect((await post({ image: TEXT })).status).toBe(415);
    expect(analyzeOutfit).not.toHaveBeenCalled();
  });

  it("rejects malformed, non-base64 and oversized input", async () => {
    expect((await post("{nope")).status).toBe(400);
    expect((await post({ image: "###" })).status).toBe(400);
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1_300_000)]).toString("base64");
    expect((await post({ image: big })).status).toBe(413);
    expect(analyzeOutfit).not.toHaveBeenCalled();
  });

  it("refuses cross-site requests", async () => {
    expect((await post({ image: JPEG }, { origin: "https://evil.test" })).status).toBe(403);
  });

  it("rate limits repeated requests before calling the AI", async () => {
    analyzeOutfit.mockResolvedValue({ ok: true, data: analysis });
    createStyledImage.mockResolvedValue({ status: "not_configured", message: "x" });
    let last = 200;
    for (let i = 0; i < 8; i += 1) {
      const response = await post({ image: JPEG });
      last = response.status;
      await response.text();
    }
    expect(last).toBe(429);
  });
});
