import { beforeEach, describe, expect, it, vi } from "vitest";
import { validInput, validOutput } from "@/lib/stylist/fixtures";

const generateOutfits = vi.fn();
vi.mock("@/lib/stylist/generate", () => ({ generateOutfits }));

const { POST } = await import("./route");

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
  beforeEach(() => generateOutfits.mockReset());

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
