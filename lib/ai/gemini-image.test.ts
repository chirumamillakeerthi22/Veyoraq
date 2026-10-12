import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateImage, isImageGenerationConfigured } from "./gemini-image";

const fetchMock = vi.fn();

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  vi.stubEnv("GEMINI_IMAGE_MODEL", "test-image-model");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("image generation", () => {
  it("is off until an image model is chosen", async () => {
    vi.stubEnv("GEMINI_IMAGE_MODEL", "");
    expect(isImageGenerationConfigured()).toBe(false);
    const result = await generateImage({ prompt: "x" });
    expect(result).toMatchObject({ ok: false, code: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is off without a key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isImageGenerationConfigured()).toBe(false);
    expect(await generateImage({ prompt: "x" })).toMatchObject({ ok: false, code: "not_configured" });
  });

  it("returns the image and sends the reference photo with the key in a header", async () => {
    fetchMock.mockResolvedValue(
      reply({
        candidates: [
          { finishReason: "STOP", content: { parts: [{ inlineData: { mimeType: "image/png", data: "QUJD" } }] } },
        ],
      }),
    );
    const result = await generateImage({
      prompt: "restyle",
      reference: { mimeType: "image/jpeg", base64: "ZZZZ" },
    });
    expect(result).toEqual({ ok: true, mimeType: "image/png", data: "QUJD" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("test-image-model:generateContent");
    expect(String(url)).not.toContain("test-key");
    expect((options.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
    const sent = JSON.parse(options.body as string);
    expect(sent.contents[0].parts[0].inlineData.data).toBe("ZZZZ");
    expect(sent.generationConfig.responseModalities).toContain("IMAGE");
  });

  it("explains a quota error plainly instead of inventing an image", async () => {
    fetchMock.mockResolvedValue(reply({ error: { status: "RESOURCE_EXHAUSTED" } }, 429));
    const result = await generateImage({ prompt: "x" });
    expect(result).toMatchObject({ ok: false, code: "quota" });
  });

  it("reports a response with no image honestly", async () => {
    fetchMock.mockResolvedValue(
      reply({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "Sorry" }] } }] }),
    );
    expect(await generateImage({ prompt: "x" })).toMatchObject({ ok: false, code: "no_image" });
  });

  it("reports a withheld answer", async () => {
    fetchMock.mockResolvedValue(
      reply({ candidates: [{ finishReason: "IMAGE_SAFETY", content: { parts: [] } }] }),
    );
    expect(await generateImage({ prompt: "x" })).toMatchObject({ ok: false, code: "refused" });
  });

  it("handles a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect(await generateImage({ prompt: "x" })).toMatchObject({ ok: false, code: "upstream_error" });
  });

  it("never writes the prompt or key to the logs", async () => {
    fetchMock.mockResolvedValue(reply({ error: { status: "INTERNAL" } }, 500));
    await generateImage({ prompt: "SECRET-PROMPT" });
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).not.toContain("SECRET-PROMPT");
    expect(logged).not.toContain("test-key");
  });
});
