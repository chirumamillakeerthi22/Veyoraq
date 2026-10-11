import { describe, expect, it } from "vitest";
import { validOutput } from "@/lib/stylist/fixtures";
import { canonicalJson, outfitKey } from "./outfit-key";

const outfit = validOutput.outfits[0];

describe("canonicalJson", () => {
  it("ignores the order of object fields", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe(
      canonicalJson({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });

  it("keeps array order, because order matters there", () => {
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
  });

  it("distinguishes strings, numbers, booleans and null", () => {
    const keys = [canonicalJson("1"), canonicalJson(1), canonicalJson(true), canonicalJson(null)];
    expect(new Set(keys).size).toBe(4);
  });

  it("drops undefined fields, as JSON storage does", () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe(canonicalJson({ a: 1 }));
  });
});

describe("outfitKey", () => {
  it("is the same for the copy from the AI and the copy read back from the database", () => {
    const fromDatabase = JSON.parse(JSON.stringify(outfit));
    // jsonb returns fields in its own order; reverse ours to prove order is irrelevant
    const reordered = Object.fromEntries(Object.entries(fromDatabase).reverse());
    expect(outfitKey(reordered as typeof outfit)).toBe(outfitKey(outfit));
  });

  it("differs for different looks", () => {
    expect(outfitKey({ ...outfit, name: "Another" })).not.toBe(outfitKey(outfit));
  });
});
