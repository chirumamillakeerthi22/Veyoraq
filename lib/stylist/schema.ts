import { z } from "zod";
import {
  budgetTierValues,
  colourValues,
  currencyValues,
  limits,
  occasionValues,
  pieceCategoryValues,
  styleValues,
} from "./options";

const unique = (values: readonly string[]) =>
  new Set(values).size === values.length;

export const stylistInputSchema = z
  .object({
    occasion: z.enum(occasionValues),
    styles: z
      .array(z.enum(styleValues))
      .min(1)
      .max(limits.styles)
      .refine(unique, "Choose each style once"),
    colours: z
      .array(z.enum(colourValues))
      .max(limits.colours)
      .refine(unique, "Choose each colour group once"),
    budgetTier: z.enum(budgetTierValues),
    currency: z.enum(currencyValues),
    notes: z.string().trim().max(limits.notes),
  })
  .strict();

export type StylistInput = z.infer<typeof stylistInputSchema>;

/*
  What the AI may return. There is deliberately no field for a price, a brand,
  a link or a product ID, and unknown fields are rejected. The text check below
  also refuses prices, links and offers written into ordinary text.
*/
const commercialText =
  /https?:\/\/|www\.|[₹$£€]|\b(?:rs\.?|inr|usd|gbp|eur)\s*\d|\d\s*%\s*off|\b(?:discount|sale price|buy now|add to cart)\b/i;

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(
      (value) => !commercialText.test(value),
      "Must not contain prices, links or offers",
    );

export const outfitSchema = z
  .object({
    name: text(60),
    summary: text(200),
    palette: z
      .array(
        z
          .object({
            name: text(30),
            hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
          })
          .strict(),
      )
      .min(2)
      .max(5),
    pieces: z
      .array(
        z
          .object({
            category: z.enum(pieceCategoryValues),
            description: text(140),
            colour: text(40),
          })
          .strict(),
      )
      .min(3)
      .max(6),
    whyItWorks: text(400),
    stylingTip: text(200),
  })
  .strict();

export type Outfit = z.infer<typeof outfitSchema>;

export const stylistOutputSchema = z
  .object({
    outfits: z.array(outfitSchema).min(1).max(limits.outfits),
  })
  .strict();

export type StylistOutput = z.infer<typeof stylistOutputSchema>;

// Error codes returned to the browser by the API route.
export type StylistErrorCode =
  | "invalid_input"
  | "forbidden"
  | "too_large"
  | "not_configured"
  | "rate_limited"
  | "timeout"
  | "refused"
  | "incomplete"
  | "invalid_output"
  | "upstream_error";
