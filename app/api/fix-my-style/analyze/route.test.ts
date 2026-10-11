import { beforeEach, describe, expect, it, vi } from "vitest";

const analyzeGarment = vi.fn();
vi.mock("@/lib/fix-my-style/analyze", () => ({ analyzeGarment }));

const { POST } = await import("./route");
const { analyzeLimiter } = await import("@/lib/fix-my-style/http");

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3]).toString("base64");
const TEXT = Buffer.from("not an image at all").toString("base64");

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://veyoraq.test/api/fix-my-style/analyze", {
      method: "POST",
      headers: { host: "veyoraq.test", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const suggestion = {
  category: "tops",
  name: "Cream knit",
  colours: ["cream"],
  pattern: "solid",
  material: "unsure",
  style: "minimal",
  seasons: [],
  occasions: [],
  note: "",
};

describe("POST /api/fix-my-style/analyze", () => {
  beforeEach(() => {
    analyzeGarment.mockReset();
    analyzeLimiter.reset();
  });

  it("returns the suggestion for a real image", async () => {
    analyzeGarment.mockResolvedValue({ ok: true, data: suggestion });
    const response = await post({ image: JPEG });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(suggestion);
    expect(analyzeGarment).toHaveBeenCalledWith({ mimeType: "image/jpeg", base64: JPEG });
  });

  it("checks the file's own bytes, not what the client claims", async () => {
    expect((await post({ image: TEXT, mimeType: "image/jpeg" })).status).toBe(400);
    expect((await post({ image: TEXT })).status).toBe(415);
    expect(analyzeGarment).not.toHaveBeenCalled();
  });

  it("rejects non-base64 and malformed bodies", async () => {
    expect((await post({ image: "###" })).status).toBe(400);
    expect((await post("{nope")).status).toBe(400);
    expect(analyzeGarment).not.toHaveBeenCalled();
  });

  it("rejects an oversized photo", async () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1_300_000)]).toString(
      "base64",
    );
    expect((await post({ image: big })).status).toBe(413);
    expect(analyzeGarment).not.toHaveBeenCalled();
  });

  it("refuses cross-site requests", async () => {
    expect((await post({ image: JPEG }, { origin: "https://evil.test" })).status).toBe(403);
    expect(analyzeGarment).not.toHaveBeenCalled();
  });

  it("reports an unconfigured AI honestly, without inventing a suggestion", async () => {
    analyzeGarment.mockResolvedValue({ ok: false, code: "not_configured", message: "Not available" });
    const response = await post({ image: JPEG });
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("not_configured");
  });

  it("rate limits repeated requests", async () => {
    analyzeGarment.mockResolvedValue({ ok: true, data: suggestion });
    let last = 200;
    for (let i = 0; i < 25; i += 1) last = (await post({ image: JPEG })).status;
    expect(last).toBe(429);
  });
});
