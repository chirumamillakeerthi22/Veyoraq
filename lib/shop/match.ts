import { isShoppable, type Product } from "./product";

/*
  Matching real catalogue records to a colour palette. It works only on records that
  exist: it never creates, completes or guesses a product. With no catalogue it
  simply returns nothing, and the page says so.
*/

export type ProductFilters = {
  colourHex: string | null;
  category: string | null;
  occasion: string | null;
  budgetTier: "budget" | "mid" | "premium" | null;
  retailer: string | null;
};

export const noFilters: ProductFilters = {
  colourHex: null,
  category: null,
  occasion: null,
  budgetTier: null,
  retailer: null,
};

function rgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// A simple distance in RGB space (0 = identical, about 441 = opposite).
export function colourDistance(a: string, b: string): number {
  const x = rgb(a);
  const y = rgb(b);
  if (!x || !y) return Infinity;
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

// How close a product's colour must be to count as matching a palette colour.
export const MATCH_DISTANCE = 70;

export function matchesPalette(product: Product, paletteHexes: string[]): boolean {
  if (!product.colourHex) return false;
  return paletteHexes.some((hex) => colourDistance(product.colourHex!, hex) <= MATCH_DISTANCE);
}

export function filterProducts(
  products: Product[],
  paletteHexes: string[],
  filters: ProductFilters,
): Product[] {
  return products.filter((product) => {
    if (!isShoppable(product)) return false; // never show a record that cannot be bought
    if (!matchesPalette(product, paletteHexes)) return false;
    if (filters.colourHex && !(product.colourHex && colourDistance(product.colourHex, filters.colourHex) <= MATCH_DISTANCE)) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.occasion && !(product.occasions ?? []).includes(filters.occasion)) return false;
    if (filters.budgetTier && product.budgetTier !== filters.budgetTier) return false;
    if (filters.retailer && product.retailer !== filters.retailer) return false;
    return true;
  });
}
