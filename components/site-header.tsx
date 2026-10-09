import Link from "next/link";
import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { MobileNav } from "@/components/mobile-nav";
import { navLinks, stylistHref } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-ivory">
      <Container className="flex h-16 items-center justify-between md:h-20">
        <Link
          href="/"
          aria-label="VEYORAQ home"
          className="flex min-h-11 items-center font-display text-2xl font-medium tracking-[0.28em] md:text-[1.75rem]"
        >
          VEYORAQ
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8 lg:gap-12">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-11 items-center text-sm tracking-wide text-stone transition-colors duration-200 hover:text-espresso"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
          <ButtonLink href={stylistHref}>Find My Style</ButtonLink>
        </div>

        <MobileNav />
      </Container>
    </header>
  );
}
