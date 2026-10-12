import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

// connection() only works inside a real Next.js request, so it is replaced here.
vi.mock("next/server", () => ({ connection: async () => {} }));

afterEach(() => vi.unstubAllEnvs());

async function status() {
  const response = await GET();
  return { response, body: await response.json() };
}

describe("GET /api/stylist/status", () => {
  it("reports everything off when nothing is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_IMAGE_MODEL", "");
    const { body } = await status();
    expect(body).toEqual({ text: false, images: false });
  });

  it("reports text on and images off with only a key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_IMAGE_MODEL", "");
    expect((await status()).body).toEqual({ text: true, images: false });
  });

  it("reports images on only when an image model is also chosen", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_IMAGE_MODEL", "some-image-model");
    expect((await status()).body).toEqual({ text: true, images: true });
  });

  it("never returns the key or model name, and is not cached", async () => {
    vi.stubEnv("GEMINI_API_KEY", "super-secret-key");
    vi.stubEnv("GEMINI_IMAGE_MODEL", "private-model-name");
    const { response, body } = await status();
    const text = JSON.stringify(body);
    expect(text).not.toContain("super-secret-key");
    expect(text).not.toContain("private-model-name");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
