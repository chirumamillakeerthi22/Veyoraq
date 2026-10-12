import { getGeminiApiKey } from "@/lib/stylist/config";

/*
  Server-only. Image generation with a Gemini image model ("Nano Banana").

  This is deliberately OFF unless GEMINI_IMAGE_MODEL is set, because image
  generation is a separate model that is not available on Google's free tier and
  is billed per image. The text and vision model used elsewhere
  (GEMINI_MODEL, default gemini-3.5-flash-lite) can read images but cannot create
  them, so it is never called here.

  The key stays on the server, and nothing about the image or prompt is logged.
*/

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 55_000;

export type ImageFailureCode =
  | "not_configured"
  | "quota"
  | "rate_limited"
  | "timeout"
  | "refused"
  | "no_image"
  | "upstream_error";

export type ImageResult =
  | { ok: true; mimeType: string; data: string }
  | { ok: false; code: ImageFailureCode; message: string };

export function getImageModel(): string | undefined {
  const model = process.env.GEMINI_IMAGE_MODEL?.trim();
  return model ? model : undefined;
}

// True when an image model has been chosen and a key exists. It does not prove the
// project's plan allows image generation; that only shows when a request is made.
export function isImageGenerationConfigured(): boolean {
  return getImageModel() !== undefined && getGeminiApiKey() !== undefined;
}

const fail = (code: ImageFailureCode, message: string): ImageResult => ({ ok: false, code, message });

export async function generateImage(input: {
  prompt: string;
  // An optional reference photo (already validated by the caller).
  reference?: { mimeType: string; base64: string };
}): Promise<ImageResult> {
  const model = getImageModel();
  const apiKey = getGeminiApiKey();
  if (!model || !apiKey) {
    return fail(
      "not_configured",
      "AI image generation isn't switched on yet. The styling advice below still applies.",
    );
  }

  const parts: unknown[] = [];
  if (input.reference) {
    parts.push({ inlineData: { mimeType: input.reference.mimeType, data: input.reference.base64 } });
  }
  parts.push({ text: input.prompt });

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return fail("timeout", "Creating the image took too long. Please try again.");
    }
    console.error("[image] request failed:", error instanceof Error ? error.name : "unknown");
    return fail("upstream_error", "We couldn't create an image just now. Please try again.");
  }

  if (!response.ok) {
    let status = "";
    try {
      const body = (await response.json()) as { error?: { status?: string } };
      status = body.error?.status ?? "";
    } catch {
      // not JSON
    }
    console.error("[image] Gemini responded", response.status, status);
    if (response.status === 429) {
      // Google reports "no quota" and "too many requests" the same way. Image models
      // are not part of the free tier, so say that plainly instead of "try again".
      return fail(
        "quota",
        "AI image generation isn't available on the current plan. The styling advice below still applies.",
      );
    }
    return fail("upstream_error", "We couldn't create an image just now. Please try again.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return fail("upstream_error", "We couldn't create an image just now. Please try again.");
  }

  const candidate = (
    body as {
      promptFeedback?: { blockReason?: string };
      candidates?: {
        finishReason?: string;
        content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
      }[];
    }
  );
  if (candidate.promptFeedback?.blockReason) {
    return fail("refused", "We couldn't create an image for that photo.");
  }
  const first = candidate.candidates?.[0];
  const image = first?.content?.parts?.find(
    (part) => part.inlineData?.mimeType?.startsWith("image/") && part.inlineData.data,
  )?.inlineData;

  if (!image?.data || !image.mimeType) {
    if (first?.finishReason && first.finishReason !== "STOP") {
      return fail("refused", "We couldn't create an image for that photo.");
    }
    return fail("no_image", "No image came back this time. Please try again.");
  }
  return { ok: true, mimeType: image.mimeType, data: image.data };
}
