import { beforeEach, describe, expect, it, vi } from "vitest";

const analyseFitPhoto = vi.fn();
vi.mock("@/lib/fit-guidance/generate", async () => {
  const { createRateLimiter } = await import("@/lib/stylist/rate-limit");
  return {
    analyseFitPhoto,
    fitPhotoLimiter: createRateLimiter({ rules: [{ windowMs: 60_000, max: 3 }] }),
  };
});

const { POST } = await import("./route");
const { fitPhotoLimiter } = await import("@/lib/fit-guidance/generate");

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3]).toString("base64");
const TEXT = Buffer.from("not an image at all").toString("base64");

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://veyoraq.test/api/fit-guidance/analyze", {
      method: "POST",
      headers: { host: "veyoraq.test", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/fit-guidance/analyze", () => {
  beforeEach(() => {
    analyseFitPhoto.mockReset();
    fitPhotoLimiter.reset();
  });

  it("returns the observations and passes a valid audience through", async () => {
    analyseFitPhoto.mockResolvedValue({ ok: true, analysis: { shape: "rectangle" } });
    const response = await post({ image: JPEG, audience: "men" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ shape: "rectangle" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(analyseFitPhoto).toHaveBeenCalledWith({ mimeType: "image/jpeg", base64: JPEG }, "men");
  });

  it("checks the file's own bytes, the audience and unexpected fields before calling the AI", async () => {
    expect((await post({ image: TEXT })).status).toBe(415);
    expect((await post({ image: JPEG, audience: "boys" })).status).toBe(400);
    expect((await post({ image: JPEG, extra: 1 })).status).toBe(400);
    expect((await post({ image: "###" })).status).toBe(400);
    expect((await post("{nope")).status).toBe(400);
    expect(analyseFitPhoto).not.toHaveBeenCalled();
  });

  it("rejects oversized photos and cross-site requests", async () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1_300_000)]).toString("base64");
    expect((await post({ image: big })).status).toBe(413);
    expect((await post({ image: JPEG }, { origin: "https://evil.test" })).status).toBe(403);
  });

  it("explains an unusable photo as a normal outcome, and a missing setup as 503", async () => {
    analyseFitPhoto.mockResolvedValueOnce({ ok: false, code: "no_photo", message: "Not enough of the body is visible." });
    const unusable = await post({ image: JPEG });
    expect(unusable.status).toBe(422);
    analyseFitPhoto.mockResolvedValueOnce({ ok: false, code: "not_configured", message: "Not set up" });
    expect((await post({ image: JPEG })).status).toBe(503);
  });

  it("limits repeated requests", async () => {
    analyseFitPhoto.mockResolvedValue({ ok: true, analysis: {} });
    for (let i = 0; i < 3; i += 1) expect((await post({ image: JPEG })).status).toBe(200);
    const blocked = await post({ image: JPEG });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });
});
