import { beforeEach, describe, expect, it, vi } from "vitest";
import { validInput, validOutput } from "@/lib/stylist/fixtures";

const generateOutfits = vi.fn();
vi.mock("@/lib/stylist/generate", () => ({ generateOutfits }));

const { POST } = await import("./route");
const { stylistLimiter } = await import("@/lib/stylist/rate-limit");

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://veyoraq.test/api/stylist", {
      method: "POST",
      headers: { host: "veyoraq.test", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/stylist", () => {
  beforeEach(() => {
    generateOutfits.mockReset();
    stylistLimiter.reset();
  });

  it("returns outfits for a valid request", async () => {
    generateOutfits.mockResolvedValue({ ok: true, data: validOutput });
    const response = await post(validInput);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(validOutput);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(generateOutfits).toHaveBeenCalledWith(validInput);
  });

  it("rejects malformed JSON without calling the AI", async () => {
    const response = await post("{not json");
    expect(response.status).toBe(400);
    expect(generateOutfits).not.toHaveBeenCalled();
  });

  it("rejects invalid input with field errors and does not call the AI", async () => {
    const response = await post({ ...validInput, styles: [] });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("invalid_input");
    expect(body.error.fields.styles).toBeDefined();
    expect(generateOutfits).not.toHaveBeenCalled();
  });

  it("rejects an oversized body", async () => {
    const response = await post("x".repeat(5_000));
    expect(response.status).toBe(413);
    expect(generateOutfits).not.toHaveBeenCalled();
  });

  it("rejects a cross-site request", async () => {
    const response = await post(validInput, { origin: "https://evil.test" });
    expect(response.status).toBe(403);
    expect(generateOutfits).not.toHaveBeenCalled();
  });

  it("accepts a same-site request", async () => {
    generateOutfits.mockResolvedValue({ ok: true, data: validOutput });
    const response = await post(validInput, { origin: "https://veyoraq.test" });
    expect(response.status).toBe(200);
  });

  describe("rate limiting", () => {
    const ip = (address: string) => ({ "x-forwarded-for": address });

    it("refuses the ninth request in ten minutes with 429 and Retry-After", async () => {
      generateOutfits.mockResolvedValue({ ok: true, data: validOutput });
      for (let i = 0; i < 8; i += 1) {
        expect((await post(validInput, ip("203.0.113.7"))).status).toBe(200);
      }
      const response = await post(validInput, ip("203.0.113.7"));
      expect(response.status).toBe(429);
      expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
      const body = await response.json();
      expect(body.error.code).toBe("rate_limited");
      expect(body.error.message).toMatch(/try again in/i);
      expect(generateOutfits).toHaveBeenCalledTimes(8);
    });

    it("limits each visitor separately", async () => {
      generateOutfits.mockResolvedValue({ ok: true, data: validOutput });
      for (let i = 0; i < 8; i += 1) await post(validInput, ip("203.0.113.7"));
      expect((await post(validInput, ip("203.0.113.7"))).status).toBe(429);
      expect((await post(validInput, ip("198.51.100.9"))).status).toBe(200);
    });

    it("does not count invalid requests against the allowance", async () => {
      generateOutfits.mockResolvedValue({ ok: true, data: validOutput });
      for (let i = 0; i < 20; i += 1) {
        const bad = await post({ ...validInput, styles: [] }, ip("203.0.113.7"));
        expect(bad.status).toBe(400);
      }
      expect((await post(validInput, ip("203.0.113.7"))).status).toBe(200);
    });
  });

  it.each([
    ["not_configured", 503],
    ["rate_limited", 429],
    ["timeout", 504],
    ["refused", 422],
    ["invalid_output", 502],
    ["upstream_error", 502],
  ])("maps generator failure %s to HTTP %i", async (code, status) => {
    generateOutfits.mockResolvedValue({ ok: false, code, message: "Sorry." });
    const response = await post(validInput);
    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(code);
  });
});
