import Link from "next/link";
import { Container } from "@/components/container";
import { HeaderNav } from "@/components/header-nav";
import { MobileNav } from "@/components/mobile-nav";
import { brand } from "@/lib/brand";

/*
  The top bar. The logo is the way home. From md up it shows Explore, Shop, Saved,
  Wishlist and the Account icon; below that, a menu button opens the drawer.
*/
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-ivory">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link
          href="/"
          aria-label={`${brand.name} home`}
          className="flex min-h-11 items-center font-display text-2xl font-medium tracking-[0.28em] lg:text-[1.75rem]"
        >
          {brand.name}
        </Link>
        <HeaderNav />
        <MobileNav />
      </Container>
    </header>
  );
}
