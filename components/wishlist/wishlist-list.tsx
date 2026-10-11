"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/button-link";
import { formatPrice, type WishlistItem } from "@/lib/wishlist/wishlist";
import { useWishlist, wishlistStore } from "@/lib/wishlist/use-wishlist";

const button =
  "inline-flex min-h-11 items-center justify-center border border-espresso/30 px-5 text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:cursor-not-allowed disabled:opacity-60";

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="max-w-md leading-7 text-stone">{children}</p>;
}

function Product({ item, busy }: { item: WishlistItem; busy: boolean }) {
  const [error, setError] = useState("");

  async function remove() {
    setError("");
    const result = await wishlistStore.remove(item.id);
    if (!result.ok) setError(result.message);
  }

  return (
    <li className="flex flex-col">
      <div className="aspect-[4/5] overflow-hidden border border-sand bg-sand">
        {item.imageUrl ? (
          // Product photos come from retailers' own addresses, so a plain <img> is used.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-stone">
            No image available
          </div>
        )}
      </div>
      <h3 className="mt-4 font-display text-2xl leading-tight">{item.name}</h3>
      {item.priceAmount !== null && item.priceCurrency && (
        <p className="mt-1">{formatPrice(item.priceAmount, item.priceCurrency)}</p>
      )}
      {item.retailer && <p className="mt-1 text-sm text-stone">{item.retailer}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {item.productUrl && (
          <a
            href={item.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={button}
          >
            View product
          </a>
        )}
        <button type="button" onClick={remove} disabled={busy} className={button}>
          {busy ? "Removing…" : "Remove"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm">
          {error}
        </p>
      )}
    </li>
  );
}

export function WishlistList() {
  const state = useWishlist();

  if (state.status === "idle" || state.status === "loading") {
    return <p className="text-stone">Loading your wishlist…</p>;
  }

  if (state.status === "signed-out") {
    return (
      <div className="max-w-md">
        <Notice>Sign in to see the items on your wishlist. It is private to your account.</Notice>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/account">Sign in</ButtonLink>
          <ButtonLink href="/account?mode=signup" variant="secondary">
            Create account
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (state.status === "unavailable") {
    return <Notice>{state.message ?? "Wishlist isn't available yet. Please check back soon."}</Notice>;
  }

  if (state.status === "error" && state.items.length === 0) {
    return (
      <div className="max-w-md">
        <Notice>{state.message ?? "We couldn't load your wishlist."}</Notice>
        <button
          type="button"
          onClick={() => void wishlistStore.refresh()}
          className="mt-4 min-h-11 underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="max-w-md">
        <Notice>
          Your wishlist is empty. Items you want to revisit or buy will appear here.
          Product recommendations aren&rsquo;t available yet, so there is nothing to add for now.
        </Notice>
        <div className="mt-6">
          <ButtonLink href="/stylist">Discover your style</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {state.items.map((item) => (
        <Product key={item.id} item={item} busy={state.busyIds.includes(item.id)} />
      ))}
    </ul>
  );
}
