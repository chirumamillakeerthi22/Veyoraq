/*
  The shape of a real catalogue record. VEYORAQ has no product catalogue yet, so
  nothing creates these today. The Shop Your Style section and the product card are
  built against this type so a real catalogue or affiliate feed can be connected
  later without changing the screens.

  A record is only shown as purchasable when it has a real https address and a
  known price with an explicit currency. Anything less is treated as unusable, so
  a half-filled record can never appear as a buyable product.
*/

export type Product = {
  id: string;
  name: string;
  retailer: string;
  // Only a permitted image address from the retailer or catalogue.
  imageUrl: string | null;
  // The destination address. Null means there is nowhere to send the person.
  url: string | null;
  price: { amount: number; currency: "INR" | "USD" | "GBP" | "EUR" } | null;
  // When the price and availability were last checked (ISO date).
  checkedAt: string | null;
};

export function isShoppable(product: Product): boolean {
  if (!product.url || !product.price) return false;
  try {
    return new URL(product.url).protocol === "https:";
  } catch {
    return false;
  }
}
