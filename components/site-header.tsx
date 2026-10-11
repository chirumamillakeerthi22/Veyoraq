import Link from "next/link";
import { AccountMenu } from "@/components/auth/account-menu";
import { Container } from "@/components/container";
import { MobileNav } from "@/components/mobile-nav";
import { brand } from "@/lib/brand";
import { collectionLinks, navLinks } from "@/lib/navigation";

// Small icons so the two collection links fit beside the main menu on laptops.
const icons: Record<string, React.ReactNode> = {
  "/saved": <path d="M7 4h10v16l-5-3.5L7 20z" />,
  "/wishlist": (
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" />
  ),
};

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

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6 xl:gap-10">
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

        <div className="flex items-center">
          <nav aria-label="Your collection" className="hidden lg:block">
            <ul className="flex items-center">
              {collectionLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex h-11 min-w-11 items-center justify-center gap-2 text-[0.8125rem] tracking-wide text-stone transition-colors duration-200 hover:text-espresso"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    >
                      {icons[link.href]}
                    </svg>
                    <span className="sr-only xl:not-sr-only">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <AccountMenu />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
