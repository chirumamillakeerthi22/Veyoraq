import { HomeLink } from "@/components/home-link";
import { Container } from "@/components/container";
import { HeaderNav } from "@/components/header-nav";
import { brand } from "@/lib/brand";

/*
  The top bar: the logo (home) and the right-hand navigation. On phones it is kept
  compact (wordmark, Shop, Account) and the bottom bar does the rest.
*/
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-ivory pt-[env(safe-area-inset-top)]">
      <Container className="flex h-14 items-center justify-between gap-2 md:h-16 lg:h-20">
        <HomeLink
          href="/"
          aria-label={`${brand.name} home`}
          className="flex min-h-11 items-center font-display text-[1.375rem] font-medium tracking-[0.24em] max-[359px]:text-lg max-[359px]:tracking-[0.12em] md:text-2xl md:tracking-[0.28em] lg:text-[1.75rem]"
        >
          {brand.name}
        </HomeLink>
        <HeaderNav />
      </Container>
    </header>
  );
}
