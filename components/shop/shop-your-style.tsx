import { isShoppable, type Product } from "@/lib/shop/product";

/*
  "Shop Your Style": the place real products will appear once a catalogue is
  connected. Until then it shows plain styling guidance and says clearly that no
  products are connected. It never shows a made-up product, price or link.
*/

export type StylingGuidance = { label: string; detail: string };

export function ProductCard({ product }: { product: Product }) {
  const shoppable = isShoppable(product);
  return (
    <article className="border border-sand bg-soft-white p-3">
      <div className="aspect-[3/4] overflow-hidden bg-sand">
        {product.imageUrl && (
          // Product photos come from retailers' own addresses, so a plain <img> is used.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <h3 className="mt-3 text-sm font-medium leading-5">{product.name}</h3>
      <p className="text-xs text-stone">{product.retailer}</p>
      {product.price && (
        <p className="mt-1 text-sm">
          {product.price.currency} {product.price.amount.toLocaleString("en-IN")}
        </p>
      )}
      {shoppable && product.url && (
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-3 inline-flex min-h-11 items-center border-b border-espresso/40 text-sm transition-colors duration-200 hover:border-espresso"
        >
          View at {product.retailer}
        </a>
      )}
    </article>
  );
}

export function ShopYourStyle({
  products = [],
  guidance = [],
}: {
  products?: Product[];
  guidance?: StylingGuidance[];
}) {
  const usable = products.filter(isShoppable);

  return (
    <section aria-labelledby="shop-your-style-heading" className="border-t border-sand pt-8">
      <p className="text-xs uppercase tracking-[0.22em] text-stone">Shop Your Style</p>
      <h2 id="shop-your-style-heading" className="mt-2 font-display text-3xl leading-tight">
        Pieces to look for.
      </h2>

      {usable.length > 0 ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {usable.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="mt-2 max-w-xl leading-7 text-stone">
            Matching products are coming soon. We don&rsquo;t have a product catalogue connected
            yet, so there are no listings, prices or links here. For now, this is what to look for.
          </p>
          {guidance.length > 0 && (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {guidance.map((item) => (
                <li key={item.label} className="border border-dashed border-espresso/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone">Styling guidance</p>
                  <p className="mt-1 font-display text-xl leading-6">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-stone">{item.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
