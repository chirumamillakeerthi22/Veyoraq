import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MODEL, generateOutfits } from "./generate";
import { validInput, validOutput } from "./fixtures";

const SECRET = "test-secret-key-value";

function apiResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function answer(text: string, finishReason = "STOP") {
  return {
    candidates: [{ finishReason, content: { parts: [{ text }] } }],
  };
}

describe("generateOutfits (Gemini)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", SECRET);
    vi.stubEnv("GEMINI_MODEL", "test-model");
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports not_configured, without calling out, when the key is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const result = await generateOutfits(validInput);
    expect(result).toMatchObject({ ok: false, code: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns validated outfits and sends the key in a header, not the URL", async () => {
    fetchMock.mockResolvedValue(
      apiResponse(answer(JSON.stringify(validOutput))),
    );
    const result = await generateOutfits(validInput);
    expect(result).toEqual({ ok: true, data: validOutput });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent",
    );
    expect(url).not.toContain(SECRET);
    expect(init.headers["x-goog-api-key"]).toBe(SECRET);

    const sent = JSON.parse(init.body);
    expect(sent.generationConfig.responseMimeType).toBe("application/json");
    expect(sent.generationConfig.responseJsonSchema.type).toBe("object");
    expect(sent.systemInstruction.parts[0].text).toContain("VEYORAQ");
    expect(JSON.parse(sent.contents[0].parts[0].text)).toEqual(validInput);
  });

  it("falls back to the default model when GEMINI_MODEL is unset", async () => {
    vi.stubEnv("GEMINI_MODEL", "");
    fetchMock.mockResolvedValue(
      apiResponse(answer(JSON.stringify(validOutput))),
    );
    await generateOutfits(validInput);
    expect(fetchMock.mock.calls[0][0]).toContain(`/models/${DEFAULT_MODEL}:`);
  });

  it("ignores thought parts when reading the answer", async () => {
    fetchMock.mockResolvedValue(
      apiResponse({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [
                { text: "thinking about outfits…", thought: true },
                { text: JSON.stringify(validOutput) },
              ],
            },
          },
        ],
      }),
    );
    expect(await generateOutfits(validInput)).toEqual({
      ok: true,
      data: validOutput,
    });
  });

  it("maps a blocked prompt to refused", async () => {
    fetchMock.mockResolvedValue(
      apiResponse({ promptFeedback: { blockReason: "SAFETY" } }),
    );
    expect(await generateOutfits(validInput)).toMatchObject({
      ok: false,
      code: "refused",
    });
  });

  it("maps a withheld answer to refused", async () => {
    fetchMock.mockResolvedValue(apiResponse(answer("", "SAFETY")));
    expect(await generateOutfits(validInput)).toMatchObject({
      ok: false,
      code: "refused",
    });
  });

  it("maps MAX_TOKENS to incomplete", async () => {
    fetchMock.mockResolvedValue(apiResponse(answer("{", "MAX_TOKENS")));
    expect(await generateOutfits(validInput)).toMatchObject({
      ok: false,
      code: "incomplete",
    });
  });

  it("rejects output that fails validation", async () => {
    const withPrice = {
      outfits: [{ ...validOutput.outfits[0], price: 100 }],
    };
    fetchMock.mockResolvedValue(
      apiResponse(answer(JSON.stringify(withPrice))),
    );
    expect(await generateOutfits(validInput)).toMatchObject({
      ok: false,
      code: "invalid_output",
    });
  });

  it("rejects output that is not JSON, and a response with no candidates", async () => {
    fetchMock.mockResolvedValueOnce(apiResponse(answer("not json")));
    expect(await generateOutfits(validInput)).toMatchObject({
      code: "invalid_output",
    });
    fetchMock.mockResolvedValueOnce(apiResponse({}));
    expect(await generateOutfits(validInput)).toMatchObject({
      code: "invalid_output",
    });
  });

  it("maps 429 to rate_limited and other failures to upstream_error", async () => {
    fetchMock.mockResolvedValueOnce(apiResponse({ error: {} }, 429));
    expect(await generateOutfits(validInput)).toMatchObject({
      code: "rate_limited",
    });
    fetchMock.mockResolvedValueOnce(apiResponse({ error: {} }, 500));
    expect(await generateOutfits(validInput)).toMatchObject({
      code: "upstream_error",
    });
  });

  it("maps a timeout", async () => {
    const error = new Error("timed out");
    error.name = "TimeoutError";
    fetchMock.mockRejectedValue(error);
    expect(await generateOutfits(validInput)).toMatchObject({
      ok: false,
      code: "timeout",
    });
  });

  it("never exposes the API key in a returned message or a log line", async () => {
    fetchMock.mockResolvedValue(
      apiResponse(
        {
          error: {
            status: "INVALID_ARGUMENT",
            message: `Bad request for key ${SECRET}`,
          },
        },
        400,
      ),
    );
    const result = await generateOutfits(validInput);
    expect(JSON.stringify(result)).not.toContain(SECRET);
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).not.toContain(SECRET);
    expect(logged).toContain("[redacted]");
  });
});
