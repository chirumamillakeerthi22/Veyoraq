"use client";

import Link from "next/link";
import { ProductCard } from "@/components/shop/shop-your-style";
import { audienceLabels } from "@/lib/audience";
import { seasonLabels } from "@/lib/color-analysis/schema";
import { useColourReports } from "@/lib/color-analysis/use-colour-reports";
import type { Category } from "@/lib/fit-guidance/options";
import { productsForFit } from "@/lib/shop/catalogue";
import { useAudience } from "@/lib/use-audience";

/*
  "Your Personal Colors": the person's real saved Color Analysis, newest first. Nothing
  is made up here: with no saved analysis it simply links to Color Analysis. Body shape
  does not decide a colour season, and this section never implies that it does.
*/
export function FitPersonalColours() {
  const reports = useColourReports();
  const latest = reports.status === "ready" ? reports.looks[0] : undefined;

  return (
    <section aria-labelledby="fit-colours-heading">
      <h2 id="fit-colours-heading" className="font-display text-3xl leading-tight">
        Your personal colors
      </h2>
      {latest ? (
        <div className="mt-3 max-w-2xl">
          <p className="leading-7 text-stone">
            From your saved Color Analysis:{" "}
            <span className="font-medium text-espresso">
              {latest.analysis.likelySeason === "uncertain"
                ? "Colours to explore"
                : seasonLabels[latest.analysis.likelySeason]}
            </span>
            . Colour is separate from fit, so use these alongside the cuts above.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Your colours">
            {[...latest.analysis.recommendedColors, ...latest.analysis.neutralColors, ...latest.analysis.accentColors]
              .slice(0, 10)
              .map((swatch) => (
                <li key={`${swatch.name}-${swatch.hex}`} className="flex items-center gap-2 border border-sand bg-soft-white py-1 pl-1 pr-3 text-xs">
                  <span aria-hidden="true" className="h-6 w-6 border border-espresso/15" style={{ backgroundColor: swatch.hex }} />
                  {swatch.name}
                </li>
              ))}
          </ul>
          <Link href="/saved#color-analysis" className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4">
            Open your saved Color Analysis
          </Link>
        </div>
      ) : (
        <p className="mt-3 max-w-2xl leading-7 text-stone">
          {reports.status === "ready"
            ? "You don’t have a saved Color Analysis yet. "
            : "Checking for a saved Color Analysis… "}
          <Link href="/color-analysis" className="underline underline-offset-4">
            Try Color Analysis
          </Link>{" "}
          to get a personal palette.
        </p>
      )}
    </section>
  );
}

/*
  "Shop Your Fit": real catalogue products only, for the selected audience and the
  garment types chosen. There is no catalogue connected, so today this is an honest
  empty state. When products exist they are matched on category (size and fit are not
  part of the product records yet, so they are not claimed here).
*/
export function FitShop({ categories }: { categories: Category[] }) {
  const audience = useAudience();
  const label = audienceLabels[audience];
  const products = productsForFit(audience, categories);

  return (
    <section aria-labelledby="fit-shop-heading" className="border-t border-sand pt-8">
      <h2 id="fit-shop-heading" className="font-display text-3xl leading-tight">
        Shop your fit
      </h2>
      {products.length > 0 ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 max-w-2xl leading-7 text-stone">
          No {label.toLowerCase()}&rsquo;s products are available yet: VEYORAQ doesn&rsquo;t have a
          product catalogue connected, so there are no listings, sizes, prices or links here. Your
          guidance is complete without it, and we never show the other audience&rsquo;s products
          instead.
        </p>
      )}
    </section>
  );
}
