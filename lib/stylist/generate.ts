import { z } from "zod";
import { getGeminiApiKey } from "./config";
import { buildRequest, instructions } from "./prompt";
import {
  stylistOutputSchema,
  type StylistErrorCode,
  type StylistInput,
  type StylistOutput,
} from "./schema";

/*
  Server-only: this reads GEMINI_API_KEY. Import it only from route handlers or
  server components, never from a "use client" file.

  Provider: Google Gemini, generateContent REST endpoint with a JSON schema.
  The schema goes in generationConfig.responseMimeType + responseJsonSchema. This was
  confirmed against the live API; the responseFormat shape shown in some docs
  pages was rejected with HTTP 400.
*/

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Google's model page recommends this for new projects as the fast, low-cost option.
// Override it with GEMINI_MODEL.
export const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 45_000;
const MAX_OUTPUT_TOKENS = 4_000;

export type GenerateResult =
  | { ok: true; data: StylistOutput }
  | { ok: false; code: StylistErrorCode; message: string };

function fail(code: StylistErrorCode, message: string): GenerateResult {
  return { ok: false, code, message };
}

// Keywords Gemini ignores or does not list as supported. Our own zod schema enforces
// these limits after the response arrives.
const UNSUPPORTED = new Set([
  "$schema",
  "minLength",
  "maxLength",
  "pattern",
  "format",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "default",
]);

function strip(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strip);
  if (node === null || typeof node !== "object") return node;

  return Object.fromEntries(
    Object.entries(node as Record<string, unknown>)
      .filter(([key]) => !UNSUPPORTED.has(key))
      .map(([key, value]) => {
        // Keys inside "properties" are field names, not schema keywords.
        if (key === "properties" && value && typeof value === "object") {
          return [
            key,
            Object.fromEntries(
              Object.entries(value as Record<string, unknown>).map(
                ([name, child]) => [name, strip(child)],
              ),
            ),
          ];
        }
        return [key, strip(value)];
      }),
  );
}

export function toGeminiSchema(schema: z.ZodType): Record<string, unknown> {
  return strip(z.toJSONSchema(schema)) as Record<string, unknown>;
}

const envelopeSchema = z.looseObject({
  promptFeedback: z.looseObject({ blockReason: z.string().optional() }).optional(),
  candidates: z
    .array(
      z.looseObject({
        finishReason: z.string().optional(),
        content: z
          .looseObject({
            parts: z
              .array(
                z.looseObject({
                  text: z.string().optional(),
                  thought: z.boolean().optional(),
                }),
              )
              .optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

// Finish reasons where Gemini withheld the answer on safety or policy grounds.
const WITHHELD = new Set([
  "SAFETY",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
  "RECITATION",
  "LANGUAGE",
  "IMAGE_SAFETY",
]);

const GENERIC = "We couldn't create outfit ideas just now. Please try again.";
const WITHHELD_MESSAGE =
  "We couldn't create ideas for that request. Try changing your notes.";

export async function generateOutfits(
  input: StylistInput,
): Promise<GenerateResult> {
  const apiKey = getGeminiApiKey();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  if (!apiKey) {
    return fail(
      "not_configured",
      "Outfit ideas aren't available yet. Please check back soon.",
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE}/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Sent as a header, never in the URL, so it stays out of request logs.
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instructions }] },
          contents: [{ role: "user", parts: [{ text: buildRequest(input) }] }],
          generationConfig: {
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            responseMimeType: "application/json",
            responseJsonSchema: toGeminiSchema(stylistOutputSchema),
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return fail("timeout", "That took too long. Please try again.");
    }
    console.error(
      "[stylist] request failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return fail("upstream_error", GENERIC);
  }

  if (!response.ok) {
    // Log the status and Google's error status/message so setup mistakes are easy to
    // diagnose. The key is redacted in case a message ever echoes it.
    let detail = "";
    try {
      const body = (await response.json()) as {
        error?: { status?: string; message?: string };
      };
      detail = `${body.error?.status ?? ""} ${body.error?.message ?? ""}`
        .replaceAll(apiKey, "[redacted]")
        .slice(0, 300)
        .trim();
    } catch {
      // ignore: the body was not JSON
    }
    console.error("[stylist] Gemini responded", response.status, detail);

    if (response.status === 429) {
      return fail(
        "rate_limited",
        "We're busy right now. Please try again in a moment.",
      );
    }
    return fail("upstream_error", GENERIC);
  }

  let envelope: z.infer<typeof envelopeSchema>;
  try {
    envelope = envelopeSchema.parse(await response.json());
  } catch {
    console.error("[stylist] unreadable response envelope");
    return fail("invalid_output", GENERIC);
  }

  if (envelope.promptFeedback?.blockReason) {
    console.error("[stylist] prompt blocked:", envelope.promptFeedback.blockReason);
    return fail("refused", WITHHELD_MESSAGE);
  }

  const candidate = envelope.candidates?.[0];
  if (!candidate) {
    console.error("[stylist] response had no candidates");
    return fail("invalid_output", GENERIC);
  }

  const finishReason = candidate.finishReason;
  if (finishReason && WITHHELD.has(finishReason)) {
    console.error("[stylist] answer withheld:", finishReason);
    return fail("refused", WITHHELD_MESSAGE);
  }
  if (finishReason && finishReason !== "STOP") {
    console.error("[stylist] finish reason:", finishReason);
    return fail("incomplete", GENERIC);
  }

  const raw = (candidate.content?.parts ?? [])
    .filter((part) => part.thought !== true)
    .map((part) => part.text ?? "")
    .join("");

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error("[stylist] output was not JSON");
    return fail("invalid_output", GENERIC);
  }

  const parsed = stylistOutputSchema.safeParse(json);
  if (!parsed.success) {
    console.error(
      "[stylist] output failed validation at:",
      parsed.error.issues.map((issue) => issue.path.join(".")).join(", "),
    );
    return fail("invalid_output", GENERIC);
  }

  return { ok: true, data: parsed.data };
}
