import Link from "next/link";
import { Container } from "@/components/container";
import { brand } from "@/lib/brand";
import { footerGroups } from "@/lib/navigation";

export function SiteFooter() {
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
