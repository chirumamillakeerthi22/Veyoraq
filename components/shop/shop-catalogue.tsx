"use client";

import { ProductCard } from "@/components/shop/shop-your-style";
import { audienceLabels } from "@/lib/audience";
import { productsForAudience } from "@/lib/shop/catalogue";
import { useAudience } from "@/lib/use-audience";

/*
  The Shop results for the selected audience. Only products classified for that
  audience are shown. When there are none (today, because no catalogue is connected)
  it says so plainly and never falls back to the other audience's products.
*/
export function ShopCatalogue() {
  const audience = useAudience();
  const label = audienceLabels[audience];
  const products = productsForAudience(audience);

  return (
    <section aria-labelledby="shop-results" className="mt-10">
      <h2 id="shop-results" className="text-xs uppercase tracking-[0.22em] text-stone">
        Shopping for {label}
      </h2>
      {products.length === 0 ? (
        <p className="mt-3 max-w-2xl text-lg leading-8 text-stone">
          There are no {label.toLowerCase()}&rsquo;s products here yet. Product discovery isn&rsquo;t
          open, and no catalogue is connected, so we have nothing to show for {label} today. We
          never fill this page with the other audience&rsquo;s products instead.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
