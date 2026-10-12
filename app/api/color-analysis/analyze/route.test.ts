import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyColourAnswers } from "@/lib/color-analysis/quiz";

const analyseColours = vi.fn();
vi.mock("@/lib/color-analysis/generate", async () => {
  const { createRateLimiter } = await import("@/lib/stylist/rate-limit");
  return {
    analyseColours,
    colourLimiter: createRateLimiter({ rules: [{ windowMs: 60_000, max: 3 }] }),
  };
});

const { POST } = await import("./route");
const { colourLimiter } = await import("@/lib/color-analysis/generate");

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3]).toString("base64");
const TEXT = Buffer.from("not an image at all").toString("base64");
const answers = { ...emptyColourAnswers, hair: "black", eyes: "dark-brown" };

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://veyoraq.test/api/color-analysis/analyze", {
      method: "POST",
      headers: { host: "veyoraq.test", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/color-analysis/analyze", () => {
  beforeEach(() => {
    analyseColours.mockReset();
    colourLimiter.reset();
  });

  it("returns the analysis", async () => {
    analyseColours.mockResolvedValue({ ok: true, analysis: { summary: "ok" } });
    const response = await post({ image: JPEG, answers });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ summary: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(analyseColours).toHaveBeenCalledWith({ mimeType: "image/jpeg", base64: JPEG }, answers, undefined);
  });

  it("passes a valid audience through and rejects an unknown one", async () => {
    analyseColours.mockResolvedValue({ ok: true, analysis: { summary: "ok" } });
    expect((await post({ image: JPEG, answers, audience: "men" })).status).toBe(200);
    expect(analyseColours).toHaveBeenCalledWith({ mimeType: "image/jpeg", base64: JPEG }, answers, "men");
    expect((await post({ image: JPEG, answers, audience: "boys" })).status).toBe(400);
  });

  it("checks the file's own bytes and the answers before calling the AI", async () => {
    expect((await post({ image: TEXT, answers })).status).toBe(415);
    expect((await post({ image: JPEG, answers: { ...answers, hair: "purple" } })).status).toBe(400);
    expect((await post({ image: JPEG, answers, extra: 1 })).status).toBe(400);
    expect((await post({ image: "###", answers })).status).toBe(400);
    expect((await post("{nope")).status).toBe(400);
    expect(analyseColours).not.toHaveBeenCalled();
  });

  it("rejects oversized photos and cross-site requests", async () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1_300_000)]).toString("base64");
    expect((await post({ image: big, answers })).status).toBe(413);
    expect((await post({ image: JPEG, answers }, { origin: "https://evil.test" })).status).toBe(403);
  });

  it("explains an unusable photo as a normal outcome, and a missing setup as 503", async () => {
    analyseColours.mockResolvedValueOnce({ ok: false, code: "no_photo", message: "No face visible." });
    const noPhoto = await post({ image: JPEG, answers });
    expect(noPhoto.status).toBe(422);
    expect((await noPhoto.json()).error.message).toBe("No face visible.");

    analyseColours.mockResolvedValueOnce({ ok: false, code: "not_configured", message: "Not set up" });
    expect((await post({ image: JPEG, answers })).status).toBe(503);
  });

  it("rate limits repeated analyses", async () => {
    analyseColours.mockResolvedValue({ ok: true, analysis: {} });
    let last = 200;
    for (let i = 0; i < 5; i += 1) last = (await post({ image: JPEG, answers })).status;
    expect(last).toBe(429);
  });
});
