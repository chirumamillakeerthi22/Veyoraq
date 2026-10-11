import { describe, expect, it } from "vitest";
import { cleanOutput } from "./outfits";
import {
  outfitOutputSchema,
  outfitRequestSchema,
  type OutfitOutput,
  type OutfitRequest,
} from "./schema";

const summary = (id: string, category: OutfitRequest["items"][number]["category"]) => ({
  id,
  name: `Item ${id}`,
  category,
  colours: ["cream" as const],
  pattern: null,
  material: null,
  seasons: [],
  occasions: [],
});

const request: OutfitRequest = {
  mode: "outfits",
  anchorId: null,
  items: [summary("top1", "tops"), summary("bot1", "bottoms"), summary("shoe1", "shoes")],
  preferences: {
    occasion: null,
    season: null,
    aesthetic: null,
    formality: null,
    colours: [],
    mustInclude: [],
  },
};

const idea = (
  title: string,
  itemIds: string[],
  additions: OutfitOutput["outfits"][number]["additions"] = [],
) => ({
  title,
  itemIds,
  layering: "Wear together",
  whyItWorks: "Balanced colours.",
  occasions: ["everyday" as const],
  variations: [],
  additions,
});

const addition = {
  name: "Tan belt",
  category: "accessories" as const,
  why: "Defines the waist.",
  worksWith: ["top1", "ghost"],
  colourSuggestion: "Tan",
  importance: "optional" as const,
};

const wrap = (outfits: OutfitOutput["outfits"]): OutfitOutput => ({
  outfits,
  recommendations: [],
  limitations: "",
});

describe("cleanOutput", () => {
  it("keeps valid outfits and labels them from their additions", () => {
    const out = cleanOutput(
      wrap([idea("A", ["top1", "bot1"]), idea("B", ["top1", "shoe1"], [addition])]),
      request,
    );
    expect(out?.outfits.map((o) => [o.title, o.kind])).toEqual([
      ["A", "owned"],
      ["B", "needs_additions"],
    ]);
  });

  it("drops outfits that use an item the person does not own", () => {
    const out = cleanOutput(
      wrap([idea("Ghost", ["top1", "invented"]), idea("Real", ["top1", "bot1"])]),
      request,
    );
    expect(out?.outfits.map((o) => o.title)).toEqual(["Real"]);
  });

  it("returns null when nothing usable is left", () => {
    expect(cleanOutput(wrap([idea("Ghost", ["invented"])]), request)).toBeNull();
  });

  it("removes repeats of the same combination", () => {
    const out = cleanOutput(
      wrap([idea("A", ["top1", "bot1"]), idea("B", ["bot1", "top1"])]),
      request,
    );
    expect(out?.outfits).toHaveLength(1);
  });

  it("removes unknown ids from additions", () => {
    const out = cleanOutput(wrap([idea("B", ["top1"], [addition])]), request);
    expect(out?.outfits[0].additions[0].worksWith).toEqual(["top1"]);
  });

  it("requires the chosen item in every outfit", () => {
    const withMust = {
      ...request,
      preferences: { ...request.preferences, mustInclude: ["shoe1"] },
    };
    const out = cleanOutput(
      wrap([idea("No shoes", ["top1", "bot1"]), idea("Shoes", ["top1", "shoe1"])]),
      withMust,
    );
    expect(out?.outfits.map((o) => o.title)).toEqual(["Shoes"]);
  });

  it("in item mode keeps only outfits built around the anchor", () => {
    const anchored: OutfitRequest = { ...request, mode: "item", anchorId: "bot1" };
    const out = cleanOutput(
      wrap([idea("Without", ["top1", "shoe1"]), idea("With", ["top1", "bot1"])]),
      anchored,
    );
    expect(out?.outfits.map((o) => o.title)).toEqual(["With"]);
  });
});

describe("outfit schemas", () => {
  it("rejects a request for an item that is not in the wardrobe", () => {
    const bad = { ...request, preferences: { ...request.preferences, mustInclude: ["nope"] } };
    expect(outfitRequestSchema.safeParse(bad).success).toBe(false);
    const noAnchor = { ...request, mode: "item" as const, anchorId: "nope" };
    expect(outfitRequestSchema.safeParse(noAnchor).success).toBe(false);
  });

  it("rejects prices and links in model text", () => {
    const priced = wrap([{ ...idea("A", ["top1"]), whyItWorks: "Buy now for $20" }]);
    expect(outfitOutputSchema.safeParse(priced).success).toBe(false);
    const linked = wrap([{ ...idea("A", ["top1"]), layering: "see https://shop.example" }]);
    expect(outfitOutputSchema.safeParse(linked).success).toBe(false);
  });

  it("rejects unknown fields from the model", () => {
    const extra = { ...wrap([idea("A", ["top1"])]), price: 10 };
    expect(outfitOutputSchema.safeParse(extra).success).toBe(false);
  });
});
