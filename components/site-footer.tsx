import Link from "next/link";
import { Container } from "@/components/container";
import { brand } from "@/lib/brand";
import { footerGroups } from "@/lib/navigation";

type SiteFooterProps = {
  // "full" is the editorial footer for the homepage and discovery pages. "compact"
  // is a single slim line for focused tools, so they stay short.
  variant?: "full" | "compact";
};

const companyLinks = footerGroups.find((group) => group.title === "Company")?.links ?? [];

function CompactFooter() {
  return (
    <footer className="border-t border-sand bg-ivory">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-5 py-4 text-xs tracking-wide text-stone sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p>© 2026 {brand.name}</p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-1">
          <Link href="/" className="inline-flex min-h-11 items-center px-2 hover:text-espresso">
            Home
          </Link>
          {companyLinks.map((link) =>
            link.href ? (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex min-h-11 items-center px-2 hover:text-espresso"
              >
                {link.label}
              </Link>
            ) : (
              <span key={link.label} className="inline-flex min-h-11 items-center gap-1 px-2">
                {link.label}
                <span className="border border-espresso/20 px-1 text-[0.5625rem] uppercase tracking-[0.12em]">
                  Soon
                </span>
              </span>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}

export function SiteFooter({ variant = "full" }: SiteFooterProps) {
  if (variant === "compact") return <CompactFooter />;
  return (
    <footer className="border-t border-sand bg-ivory">
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-display text-2xl font-medium tracking-[0.28em]">
              {brand.name}
            </p>
            <p className="mt-2 font-display text-lg italic text-stone">
              {brand.tagline}
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7"
          >
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs uppercase tracking-[0.22em] text-stone">
                  {group.title}
                </h2>
                <ul className="mt-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.href ? (
                        <Link
                          href={link.href}
                          className="flex min-h-11 items-center text-sm transition-colors duration-200 hover:text-stone"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <span className="flex min-h-11 items-center gap-2 text-sm text-stone">
                          {link.label}
                          <span className="border border-espresso/20 px-1.5 py-0.5 text-[0.625rem] uppercase tracking-[0.14em]">
                            Soon
                          </span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-sand pt-6 text-xs tracking-wide text-stone sm:flex-row sm:justify-between">
          <p>© 2026 {brand.name}</p>
          <p>Editorial photography by Unsplash contributors.</p>
        </div>
      </Container>
    </footer>
  );
}
