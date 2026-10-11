import { describe, expect, it } from "vitest";
import {
  countActiveFilters,
  emptyFilters,
  filterItems,
  outfitId,
  toSummary,
  type WardrobeItem,
} from "./wardrobe";

function item(overrides: Partial<WardrobeItem>): WardrobeItem {
  return {
    id: "a",
    name: "Cream knit",
    category: "tops",
    colours: ["cream"],
    pattern: "solid",
    material: "knit",
    style: null,
    seasons: [],
    occasions: [],
    photo: new Blob(),
    suggestedByAi: false,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("filterItems", () => {
  const items = [
    item({ id: "1", category: "tops", colours: ["cream"], seasons: ["winter"], occasions: ["work"] }),
    item({ id: "2", category: "bottoms", colours: ["navy"], seasons: [], occasions: ["everyday"] }),
    item({ id: "3", category: "shoes", colours: ["black", "white"], seasons: ["summer"], occasions: [] }),
  ];

  it("returns everything with no filters", () => {
    expect(filterItems(items, emptyFilters)).toHaveLength(3);
  });

  it("filters by category and colour", () => {
    expect(filterItems(items, { ...emptyFilters, category: "bottoms" }).map((i) => i.id)).toEqual(["2"]);
    expect(filterItems(items, { ...emptyFilters, colour: "white" }).map((i) => i.id)).toEqual(["3"]);
  });

  it("keeps items with no season recorded when a season is chosen", () => {
    const ids = filterItems(items, { ...emptyFilters, season: "winter" }).map((i) => i.id);
    expect(ids).toEqual(["1", "2"]);
  });

  it("only returns items that have the chosen occasion", () => {
    expect(filterItems(items, { ...emptyFilters, occasion: "work" }).map((i) => i.id)).toEqual(["1"]);
  });

  it("counts active filters", () => {
    expect(countActiveFilters(emptyFilters)).toBe(0);
    expect(countActiveFilters({ ...emptyFilters, category: "tops", season: "summer" })).toBe(2);
  });
});

describe("outfitId and toSummary", () => {
  it("gives the same id to the same combination, whatever the order", () => {
    const a = outfitId({ itemIds: ["x", "y"], kind: "owned", title: "Easy Monday" });
    const b = outfitId({ itemIds: ["y", "x"], kind: "owned", title: "Easy Monday" });
    expect(a).toBe(b);
  });

  it("separates owned outfits from ones that need additions", () => {
    const owned = outfitId({ itemIds: ["x"], kind: "owned", title: "T" });
    const needs = outfitId({ itemIds: ["x"], kind: "needs_additions", title: "T" });
    expect(owned).not.toBe(needs);
  });

  it("never includes the photo in what is sent to the AI", () => {
    const summary = toSummary(item({}));
    expect(summary).not.toHaveProperty("photo");
    expect(summary).toMatchObject({ id: "a", category: "tops" });
  });
});
