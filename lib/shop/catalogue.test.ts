import { describe, expect, it } from "vitest";
import { productsForAudience, productsForFit } from "./catalogue";
import type { Product } from "./product";

const item = (id: string, audience: Product["audience"], over: Partial<Product> = {}): Product => ({
  id,
  name: id,
  retailer: "Example Store",
  imageUrl: null,
  url: "https://shop.example/" + id,
  price: { amount: 999, currency: "INR" },
  checkedAt: "2026-10-12",
  audience,
  ...over,
});

describe("productsForAudience", () => {
  const all = [item("w1", "women"), item("m1", "men"), item("x", null), item("m2", "men", { price: null })];

  it("keeps each audience strictly apart", () => {
    expect(productsForAudience("women", all).map((p) => p.id)).toEqual(["w1"]);
    expect(productsForAudience("men", all).map((p) => p.id)).toEqual(["m1"]);
  });

  it("is empty for the empty catalogue (no invented products)", () => {
    expect(productsForAudience("women", [])).toEqual([]);
    expect(productsForAudience("men")).toEqual([]);
  });
});

describe("productsForFit", () => {
  const all = [
    item("w-top", "women", { category: "tops" }),
    item("w-bottom", "women", { category: "bottoms" }),
    item("m-top", "men", { category: "tops" }),
    item("w-none", "women", { category: null }),
  ];

  it("keeps the audience strict and filters by the garment types chosen", () => {
    expect(productsForFit("women", ["tops"], all).map((p) => p.id)).toEqual(["w-top"]);
    expect(productsForFit("men", ["tops"], all).map((p) => p.id)).toEqual(["m-top"]);
  });

  it("returns every category for the audience when none were chosen, and never the other audience", () => {
    expect(productsForFit("women", [], all).map((p) => p.id)).toEqual(["w-top", "w-bottom", "w-none"]);
  });

  it("is empty for the empty catalogue", () => {
    expect(productsForFit("women", ["tops"])).toEqual([]);
  });
});
