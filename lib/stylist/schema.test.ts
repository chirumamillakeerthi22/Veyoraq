import { describe, expect, it } from "vitest";
import { toGeminiSchema } from "./generate";
import { validInput, validOutput } from "./fixtures";
import { stylistInputSchema, stylistOutputSchema } from "./schema";

describe("stylistInputSchema", () => {
  it("accepts a valid request", () => {
    expect(stylistInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("trims the notes", () => {
    const parsed = stylistInputSchema.parse({ ...validInput, notes: "  hi  " });
    expect(parsed.notes).toBe("hi");
  });

  it.each([
    ["unknown occasion", { occasion: "gala" }],
    ["no styles", { styles: [] }],
    ["too many styles", { styles: ["minimal", "classic", "relaxed", "bold"] }],
    ["duplicate styles", { styles: ["minimal", "minimal"] }],
    ["too many colours", { colours: ["neutrals", "pastels", "brights", "monochrome", "earth-tones"] }],
    ["unknown currency", { currency: "JPY" }],
    ["notes too long", { notes: "a".repeat(301) }],
    ["unexpected field", { extra: "x" }],
  ])("rejects %s", (_label, patch) => {
    expect(
      stylistInputSchema.safeParse({ ...validInput, ...patch }).success,
    ).toBe(false);
  });
});

describe("stylistOutputSchema", () => {
  it("accepts a valid result", () => {
    expect(stylistOutputSchema.safeParse(validOutput).success).toBe(true);
  });

  it("rejects extra fields such as a price", () => {
    const outfit = { ...validOutput.outfits[0], price: 4999 };
    expect(
      stylistOutputSchema.safeParse({ outfits: [outfit] }).success,
    ).toBe(false);
  });

  it.each([
    ["a link", "Available at https://shop.example/shirt"],
    ["a rupee price", "A shirt for ₹1,999"],
    ["a dollar price", "Only $40 for this shirt"],
    ["an offer", "Now 30% off"],
  ])("rejects text containing %s", (_label, description) => {
    const outfit = structuredClone(validOutput.outfits[0]);
    outfit.pieces[0].description = description;
    expect(
      stylistOutputSchema.safeParse({ outfits: [outfit] }).success,
    ).toBe(false);
  });

  it("rejects a bad hex colour", () => {
    const outfit = structuredClone(validOutput.outfits[0]);
    outfit.palette[0].hex = "beige";
    expect(
      stylistOutputSchema.safeParse({ outfits: [outfit] }).success,
    ).toBe(false);
  });

  it("rejects more than three outfits", () => {
    const outfit = validOutput.outfits[0];
    expect(
      stylistOutputSchema.safeParse({ outfits: [outfit, outfit, outfit, outfit] })
        .success,
    ).toBe(false);
  });
});

describe("toGeminiSchema", () => {
  const schema = toGeminiSchema(stylistOutputSchema);
  // Gemini ignores these, so they are removed before sending.
  const forbidden = ["minLength", "maxLength", "pattern", "$schema"];

  // Walk every schema node and collect problems for the schema sent to Gemini.
  function problems(node: unknown, path = "root"): string[] {
    if (Array.isArray(node)) return node.flatMap((n, i) => problems(n, `${path}[${i}]`));
    if (!node || typeof node !== "object") return [];
    const record = node as Record<string, unknown>;
    const found: string[] = [];

    for (const key of forbidden) {
      if (key in record) found.push(`${path} has ${key}`);
    }
    if (record.type === "object") {
      const props = Object.keys((record.properties as object) ?? {});
      const required = (record.required as string[]) ?? [];
      if (record.additionalProperties !== false) found.push(`${path} allows extra properties`);
      for (const prop of props) {
        if (!required.includes(prop)) found.push(`${path}.${prop} is not required`);
      }
    }
    for (const [key, value] of Object.entries(record)) {
      found.push(...problems(value, `${path}.${key}`));
    }
    return found;
  }

  it("is an object at the root", () => {
    expect(schema.type).toBe("object");
  });

  it("has no unsupported keywords, requires every field and forbids extras", () => {
    expect(problems(schema)).toEqual([]);
  });
});
