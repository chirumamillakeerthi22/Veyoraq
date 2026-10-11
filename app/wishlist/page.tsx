import type { Metadata } from "next";
import { Container } from "@/components/container";
import { WishlistList } from "@/components/wishlist/wishlist-list";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Items you want to revisit or buy.",
};

export default function WishlistPage() {
  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Wishlist</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          Your <em>wishlist.</em>
        </h1>
        <p className="mt-5 leading-7 text-stone">
          Individual pieces you want to revisit or buy. Complete outfits live in Saved Styles.
        </p>
      </div>
      <div className="mt-10">
        <WishlistList />
      </div>
    </Container>
  );
}
