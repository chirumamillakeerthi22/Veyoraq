import { describe, expect, it } from "vitest";
import { productsForAudience } from "./catalogue";
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
