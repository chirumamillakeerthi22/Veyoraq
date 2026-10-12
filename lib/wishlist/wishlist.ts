/*
  Wishlist: individual items a person may want to revisit or buy. This is separate from
  Saved Styles, which holds complete outfits.

  The database table (wishlist_items) is PROPOSED in
  supabase/migrations/20261012000000_wishlist_items.sql and has not been applied yet,
  so until it exists the page reports that the wishlist isn't available. Nothing is
  invented: a field that is not known is simply not shown.
*/

import { isAudience, type Audience } from "@/lib/audience";

export const WISHLIST_TABLE = "wishlist_items";
export const WISHLIST_LIMIT = 200;

export type WishlistItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  priceAmount: number | null;
  priceCurrency: string | null;
  retailer: string | null;
  productUrl: string | null;
  createdAt: string;
  // The audience the product was classified for, or null when not recorded
  // (older items, or the column has not been added yet). Never guessed.
  audience: Audience | null;
};

// Only secure web addresses are ever used for images and product links.
export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const text = (value: unknown, max: number): string | null =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

export function parseWishlistRows(rows: unknown): WishlistItem[] {
  if (!Array.isArray(rows)) return [];
  const items: WishlistItem[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : null;
    const name = text(record.name, 120);
    if (!id || !name) continue;

    const amount =
      typeof record.price_amount === "number"
        ? record.price_amount
        : typeof record.price_amount === "string" && record.price_amount !== ""
          ? Number(record.price_amount)
          : null;
    const currency =
      typeof record.price_currency === "string" && /^[A-Za-z]{3}$/.test(record.price_currency)
        ? record.price_currency.toUpperCase()
        : null;

    items.push({
      id,
      name,
      imageUrl: safeHttpsUrl(record.image_url),
      // A price is only shown when both the amount and its currency are known.
      priceAmount: amount !== null && Number.isFinite(amount) && currency ? amount : null,
      priceCurrency: amount !== null && Number.isFinite(amount) && currency ? currency : null,
      retailer: text(record.retailer, 80),
      productUrl: safeHttpsUrl(record.product_url),
      createdAt: typeof record.created_at === "string" ? record.created_at : "",
      audience: isAudience(record.audience) ? record.audience : null,
    });
  }
  return items;
}

export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function friendlyWishlistError(
  error: { code?: string | null; message?: string | null } | null | undefined,
): { unavailable: boolean; message: string } {
  const code = error?.code ?? "";
  const message = (error?.message ?? "").toLowerCase();
  if (code === "PGRST205" || code === "42P01" || message.includes("schema cache")) {
    return { unavailable: true, message: "Wishlist isn't available yet. Please check back soon." };
  }
  if (code === "42501" || message.includes("row-level security")) {
    return { unavailable: false, message: "Please sign in to use your wishlist." };
  }
  return { unavailable: false, message: "We couldn't load your wishlist just now. Please try again." };
}
