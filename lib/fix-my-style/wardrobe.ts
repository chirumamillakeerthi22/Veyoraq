import type {
  Category,
  GarmentColour,
  Material,
  Occasion,
  Pattern,
  Season,
  StyleName,
} from "./options";
import type { CleanOutfit, ItemSummary } from "./schema";

// One garment in the person's wardrobe, as stored on their device.
export type WardrobeItem = {
  id: string;
  name: string;
  category: Category;
  colours: GarmentColour[];
  pattern: Pattern | null;
  material: Material | null;
  style: StyleName | null;
  seasons: Season[];
  occasions: Occasion[];
  photo: Blob;
  // True when the details began as an AI suggestion (they may have been corrected since).
  suggestedByAi: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SavedOutfit = CleanOutfit & {
  id: string;
  savedAt: number;
};

export type WardrobeFilters = {
  category: Category | null;
  colour: GarmentColour | null;
  season: Season | null;
  occasion: Occasion | null;
};

export const emptyFilters: WardrobeFilters = {
  category: null,
  colour: null,
  season: null,
  occasion: null,
};

export function countActiveFilters(filters: WardrobeFilters): number {
  return Object.values(filters).filter((value) => value !== null).length;
}

// An item with no season recorded suits every season, so a season filter keeps it.
export function filterItems(items: WardrobeItem[], filters: WardrobeFilters): WardrobeItem[] {
  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.colour && !item.colours.includes(filters.colour)) return false;
    if (filters.season && item.seasons.length > 0 && !item.seasons.includes(filters.season)) {
      return false;
    }
    if (filters.occasion && !item.occasions.includes(filters.occasion)) return false;
    return true;
  });
}

export function toSummary(item: WardrobeItem): ItemSummary {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    colours: item.colours,
    pattern: item.pattern,
    material: item.material,
    seasons: item.seasons,
    occasions: item.occasions,
  };
}

// The same combination always gets the same id, so saving it twice (or retrying)
// replaces the earlier copy instead of adding a duplicate.
export function outfitId(outfit: Pick<CleanOutfit, "itemIds" | "kind" | "title">): string {
  const ids = [...outfit.itemIds].sort().join("+");
  return `${outfit.kind}:${ids}:${outfit.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
}

// Item ids are used in AI requests and must match /^[A-Za-z0-9_-]{1,64}$/.
export function newItemId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `i${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
