import type { Audience } from "@/lib/audience";
import { isShoppable, type Product } from "./product";

/*
  The product catalogue. VEYORAQ has no catalogue connected, so this list is empty
  and nothing anywhere invents a product. When a real catalogue or affiliate feed is
  connected, its records are loaded here, each carrying the audience it was
  classified for. Every screen that shows products goes through
  productsForAudience(), so Women's and Men's products can never be mixed.
*/
export const catalogue: Product[] = [];

// Buyable products classified for exactly this audience. Unclassified records and
// the other audience's records are excluded.
export function productsForAudience(audience: Audience, products: Product[] = catalogue): Product[] {
  return products.filter((product) => product.audience === audience && isShoppable(product));
}
