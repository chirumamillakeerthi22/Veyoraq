import { describe, expect, it } from "vitest";
import { BOARD, layoutBoard, shapeFor, shapes, type ShapeKey } from "./board";
import type { Outfit } from "./schema";

type Piece = Outfit["pieces"][number];

const piece = (
  category: Piece["category"],
  description = "A piece",
  hex = "#112233",
): Piece => ({ category, description, colour: "Colour", hex });

describe("shapeFor", () => {
  it.each<[Piece["category"], string, ShapeKey]>([
    ["top", "Linen shirt", "top"],
    ["outerwear", "Wool coat", "coat"],
    ["dress", "Slip dress", "dress"],
    ["jumpsuit", "Wide-leg jumpsuit", "jumpsuit"],
    ["bottom", "Tapered trousers", "trousers"],
    ["bottom", "Pleated midi skirt", "skirt"],
    ["bottom", "Linen shorts", "shorts"],
    ["footwear", "Leather loafers", "shoe"],
    ["footwear", "Ankle boots", "boot"],
    ["bag", "Structured tote", "bag"],
    ["accessory", "Silk scarf", "scarf"],
    ["jewellery", "Gold pendant", "necklace"],
  ])("%s '%s' is drawn as %s", (category, description, expected) => {
    expect(shapeFor({ category, description })).toBe(expected);
  });
});

describe("layoutBoard", () => {
  it("draws separates as top, bottom and shoes", () => {
    const placements = layoutBoard([
      piece("top"),
      piece("bottom"),
      piece("footwear"),
    ]);
    expect(placements.map((p) => p.shape)).toEqual(["top", "trousers", "shoe"]);
  });

  it("lets a dress replace the separate top and bottom", () => {
    const placements = layoutBoard([
      piece("dress"),
      piece("top"),
      piece("bottom"),
      piece("footwear"),
    ]);
    expect(placements.map((p) => p.shape)).toEqual(["dress", "shoe"]);
  });

  it("draws outerwear behind a one-piece outfit", () => {
    const placements = layoutBoard([
      piece("jumpsuit"),
      piece("outerwear"),
      piece("footwear"),
    ]);
    expect(placements.map((p) => p.shape)).toEqual(["coat", "jumpsuit", "shoe"]);
  });

  it("keeps one piece per role and at most two small accessories", () => {
    const placements = layoutBoard([
      piece("top"),
      piece("top"),
      piece("bottom"),
      piece("accessory"),
      piece("jewellery"),
      piece("accessory"),
    ]);
    const shapesDrawn = placements.map((p) => p.shape);
    expect(shapesDrawn.filter((s) => s === "top")).toHaveLength(1);
    expect(shapesDrawn.filter((s) => s === "scarf" || s === "necklace")).toHaveLength(2);
  });

  it("carries each piece's colour through to the drawing", () => {
    const [placement] = layoutBoard([piece("top", "Shirt", "#A1B2C3")]);
    expect(placement.hex).toBe("#A1B2C3");
  });

  it("keeps every drawn shape inside the picture", () => {
    const everything: Piece[] = [
      piece("outerwear"),
      piece("top"),
      piece("bottom"),
      piece("footwear"),
      piece("bag"),
      piece("accessory"),
      piece("jewellery"),
    ];
    const outfits = [
      everything,
      [piece("dress"), piece("outerwear"), piece("footwear"), piece("bag"), piece("jewellery")],
      [piece("jumpsuit"), piece("footwear")],
      [piece("bottom", "A short skirt"), piece("footwear", "Boots")],
    ];
    for (const pieces of outfits) {
      for (const p of layoutBoard(pieces)) {
        const size = shapes[p.shape];
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x + size.width * p.scale).toBeLessThanOrEqual(BOARD.width);
        expect(p.y + size.height * p.scale).toBeLessThanOrEqual(BOARD.artHeight);
      }
    }
  });

  it("returns nothing for an empty outfit", () => {
    expect(layoutBoard([])).toEqual([]);
  });
});
