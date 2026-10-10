import Link from "next/link";
import { Container } from "@/components/container";
import { MobileNav } from "@/components/mobile-nav";
import { brand } from "@/lib/brand";
import { accountHref, navLinks } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-ivory">
      <Container className="flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link
          href="/"
          aria-label={`${brand.name} home`}
          className="flex min-h-11 items-center font-display text-2xl font-medium tracking-[0.28em] lg:text-[1.75rem]"
        >
          {brand.name}
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7 xl:gap-10">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-11 items-center text-[0.8125rem] tracking-wide text-stone transition-colors duration-200 hover:text-espresso"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href={accountHref}
            aria-label="Account"
            className="flex h-11 min-w-11 items-center justify-center gap-2 text-[0.8125rem] tracking-wide text-stone transition-colors duration-200 hover:text-espresso"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.200 1.900 7 5.500" />
            </svg>
            <span className="hidden sm:inline">Account</span>
          </Link>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
