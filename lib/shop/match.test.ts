import { describe, expect, it } from "vitest";
import { colourDistance, filterProducts, matchesPalette, noFilters } from "./match";
import type { Product } from "./product";

const product = (overrides: Partial<Product> = {}): Product => ({
  id: "p",
  name: "Shirt",
  retailer: "Example Store",
  imageUrl: null,
  url: "https://shop.example/shirt",
  price: { amount: 1999, currency: "INR" },
  checkedAt: "2026-10-12",
  colourHex: "#8a3b1f",
  category: "tops",
  occasions: ["everyday"],
  budgetTier: "mid",
  audience: "women",
  ...overrides,
});

const palette = ["#8b3c20", "#2b2540"];

describe("colourDistance and matching", () => {
  it("treats close colours as a match and distant ones as not", () => {
    expect(colourDistance("#000000", "#000000")).toBe(0);
    expect(matchesPalette(product(), palette)).toBe(true);
    expect(matchesPalette(product({ colourHex: "#33ccff" }), palette)).toBe(false);
  });

  it("never matches a product with no known colour", () => {
    expect(matchesPalette(product({ colourHex: null }), palette)).toBe(false);
  });
});

describe("filterProducts", () => {
  it("returns nothing when the catalogue is empty", () => {
    expect(filterProducts([], palette, noFilters)).toEqual([]);
  });

  it("never returns a record that cannot be bought", () => {
    const list = [product({ url: null }), product({ id: "b", price: null }), product({ id: "c" })];
    expect(filterProducts(list, palette, noFilters).map((p) => p.id)).toEqual(["c"]);
  });

  it("applies each filter", () => {
    const list = [
      product({ id: "a" }),
      product({ id: "b", category: "bags" }),
      product({ id: "c", occasions: ["work"] }),
      product({ id: "d", budgetTier: "premium" }),
      product({ id: "e", retailer: "Other" }),
    ];
    expect(filterProducts(list, palette, { ...noFilters, category: "bags" }).map((p) => p.id)).toEqual(["b"]);
    expect(filterProducts(list, palette, { ...noFilters, occasion: "work" }).map((p) => p.id)).toEqual(["c"]);
    expect(filterProducts(list, palette, { ...noFilters, budgetTier: "premium" }).map((p) => p.id)).toEqual(["d"]);
    expect(filterProducts(list, palette, { ...noFilters, retailer: "Other" }).map((p) => p.id)).toEqual(["e"]);
  });
});

describe("audience separation", () => {
  const list = [
    product({ id: "w", audience: "women" }),
    product({ id: "m", audience: "men" }),
    product({ id: "u", audience: null }),
  ];

  it("returns only the selected audience and never unclassified records", () => {
    expect(filterProducts(list, palette, { ...noFilters, audience: "women" }).map((p) => p.id)).toEqual(["w"]);
    expect(filterProducts(list, palette, { ...noFilters, audience: "men" }).map((p) => p.id)).toEqual(["m"]);
  });

  it("returns nothing, not the other audience, when the selected one has no products", () => {
    const onlyWomen = [product({ id: "w", audience: "women" })];
    expect(filterProducts(onlyWomen, palette, { ...noFilters, audience: "men" })).toEqual([]);
  });
});

