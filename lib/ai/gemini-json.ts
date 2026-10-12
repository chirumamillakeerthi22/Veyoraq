import { z } from "zod";
import { getGeminiApiKey } from "@/lib/stylist/config";
import { DEFAULT_MODEL, toGeminiSchema } from "@/lib/stylist/generate";

/*
  Server-only: this reads GEMINI_API_KEY. Import it only from route handlers or
  server components, never from a "use client" file.

  A small, generic "ask Gemini for JSON and validate it" call, used by FIX My Style.
  It uses the same endpoint, request shape and key as the outfit stylist
  (lib/stylist/generate.ts); it differs by accepting image parts and any schema.
  It never logs the request body, so photos and wardrobe text stay out of logs.
*/

// Gemini rejects deeply nested schemas that carry array size limits ("too many
// states"; verified against the live API). Our own zod schema still enforces
// every limit after the answer arrives, so these keywords are not sent.
const NOT_SENT = new Set(["minItems", "maxItems"]);

function withoutSizeLimits(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(withoutSizeLimits);
  if (node === null || typeof node !== "object") return node;
  return Object.fromEntries(
    Object.entries(node as Record<string, unknown>)
      .filter(([key, value]) => !(NOT_SENT.has(key) && typeof value === "number"))
      .map(([key, value]) => [key, withoutSizeLimits(value)]),
  );
}

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GeminiFailureCode =
  | "not_configured"
  | "rate_limited"
  | "timeout"
  | "refused"
  | "incomplete"
  | "invalid_output"
  | "upstream_error";

export type GeminiJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: GeminiFailureCode; message: string };

type Options<T> = {
  // Short name used in server logs, e.g. "fix-analyze".
  label: string;
  system: string;
  parts: GeminiPart[];
  schema: z.ZodType<T>;
  maxOutputTokens: number;
  timeoutMs: number;
  notConfiguredMessage: string;
  genericMessage: string;
  withheldMessage: string;
};

const envelopeSchema = z.looseObject({
  promptFeedback: z.looseObject({ blockReason: z.string().optional() }).optional(),
  candidates: z
    .array(
      z.looseObject({
        finishReason: z.string().optional(),
        content: z
          .looseObject({
            parts: z
              .array(z.looseObject({ text: z.string().optional(), thought: z.boolean().optional() }))
              .optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

const WITHHELD = new Set([
  "SAFETY",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
  "RECITATION",
  "LANGUAGE",
  "IMAGE_SAFETY",
]);

export async function callGeminiJson<T>(options: Options<T>): Promise<GeminiJsonResult<T>> {
  const { label } = options;
  const fail = (code: GeminiFailureCode, message: string): GeminiJsonResult<T> => ({
    ok: false,
    code,
    message,
  });

  const apiKey = getGeminiApiKey();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  if (!apiKey) return fail("not_configured", options.notConfiguredMessage);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // A header, never the URL, so the key stays out of request logs.
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: [{ role: "user", parts: options.parts }],
        generationConfig: {
          maxOutputTokens: options.maxOutputTokens,
          responseMimeType: "application/json",
          responseJsonSchema: withoutSizeLimits(toGeminiSchema(options.schema)),
        },
      }),
      signal: AbortSignal.timeout(options.timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return fail("timeout", "That took too long. Please try again.");
    }
    console.error(`[${label}] request failed:`, error instanceof Error ? error.name : "unknown");
    return fail("upstream_error", options.genericMessage);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { error?: { status?: string; message?: string } };
      detail = `${body.error?.status ?? ""} ${body.error?.message ?? ""}`
        .replaceAll(apiKey, "[redacted]")
        .slice(0, 300)
        .trim();
    } catch {
      // the body was not JSON
    }
    console.error(`[${label}] Gemini responded`, response.status, detail);
    if (response.status === 429) {
      return fail("rate_limited", "We're busy right now. Please try again in a moment.");
    }
    return fail("upstream_error", options.genericMessage);
  }

  let envelope: z.infer<typeof envelopeSchema>;
  try {
    envelope = envelopeSchema.parse(await response.json());
  } catch {
    console.error(`[${label}] unreadable response envelope`);
    return fail("invalid_output", options.genericMessage);
  }

  if (envelope.promptFeedback?.blockReason) {
    console.error(`[${label}] prompt blocked:`, envelope.promptFeedback.blockReason);
    return fail("refused", options.withheldMessage);
  }

  const candidate = envelope.candidates?.[0];
  if (!candidate) {
    console.error(`[${label}] response had no candidates`);
    return fail("invalid_output", options.genericMessage);
  }

  const finishReason = candidate.finishReason;
  if (finishReason && WITHHELD.has(finishReason)) {
    console.error(`[${label}] answer withheld:`, finishReason);
    return fail("refused", options.withheldMessage);
  }
  if (finishReason && finishReason !== "STOP") {
    console.error(`[${label}] finish reason:`, finishReason);
    return fail("incomplete", options.genericMessage);
  }

  const raw = (candidate.content?.parts ?? [])
    .filter((part) => part.thought !== true)
    .map((part) => part.text ?? "")
    .join("");

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error(`[${label}] output was not JSON`);
    return fail("invalid_output", options.genericMessage);
  }

  const parsed = options.schema.safeParse(json);
  if (!parsed.success) {
    console.error(
      `[${label}] output failed validation at:`,
      parsed.error.issues.map((issue) => issue.path.join(".")).join(", "),
    );
    return fail("invalid_output", options.genericMessage);
  }

  return { ok: true, data: parsed.data };
}
