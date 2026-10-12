import type { Metadata } from "next";
import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { ShopCatalogue } from "@/components/shop/shop-catalogue";
import { stylistHref, wishlistHref } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Shop",
  description: "Discover clothing that fits your style and budget. Product discovery is in development.",
};

const steps = [
  {
    title: "Real pieces, real prices.",
    text: "Every product will come from a real listing, with its price, retailer and the date the price was checked.",
  },
  {
    title: "Within the budget you set.",
    text: "Totals will be worked out from the listed prices. If a price is unknown, we will say so instead of guessing.",
  },
  {
    title: "Wishlist, not a cart.",
    text: "Heart the pieces you want to revisit. There is no basket or checkout here: you buy from the retailer.",
  },
];

// Product discovery has no catalogue connected yet, so this page says so plainly
// and shows no products rather than inventing any.
export default function ShopPage() {
  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Shop</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          Find pieces that <em>fit your style.</em>
        </h1>
        <ShopCatalogue />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={stylistHref}>Discover My Style</ButtonLink>
          <ButtonLink href={wishlistHref} variant="secondary">
            View Wishlist
          </ButtonLink>
        </div>
      </div>

      <section aria-labelledby="shop-how" className="mt-16 border-t border-sand pt-10 md:mt-24">
        <h2 id="shop-how" className="text-xs uppercase tracking-[0.22em] text-stone">
          How Shop will work
        </h2>
        <ol className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-14">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span aria-hidden="true" className="font-display text-5xl leading-none text-olive">
                {index + 1}
              </span>
              <h3 className="mt-4 font-display text-2xl leading-8">{step.title}</h3>
              <p className="mt-2 leading-7 text-stone">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </Container>
  );
}
