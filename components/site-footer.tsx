import Link from "next/link";
import { Container } from "@/components/container";
import { brand } from "@/lib/brand";
import { footerGroups } from "@/lib/navigation";

/*
  The full footer. It is rendered by the homepage only (app/page.tsx), so no other
  page repeats these link lists. Legal and company pages stay reachable from
  My Account and by their own addresses.
*/
export function SiteFooter() {
  return (
    <footer className="border-t border-sand bg-ivory">
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="font-display text-2xl font-medium tracking-[0.28em]">{brand.name}</p>
            <p className="mt-2 font-display text-lg italic text-stone">{brand.tagline}</p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:col-span-8"
          >
            {footerGroups.map((group, index) => (
              <div
                key={group.title}
                // On phones the last (odd) group spans both columns so nothing hangs alone.
                className={index === footerGroups.length - 1 ? "col-span-2 sm:col-span-1" : ""}
              >
                <h2 className="text-xs uppercase tracking-[0.22em] text-stone">{group.title}</h2>
                <ul className="mt-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="flex min-h-11 items-center text-sm transition-colors duration-200 hover:text-stone"
                      >
                        {link.label}
                      </Link>
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
