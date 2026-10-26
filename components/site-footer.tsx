import Link from "next/link";
import { Container } from "@/components/container";
import { HomeLink } from "@/components/home-link";
import { brand } from "@/lib/brand";
import { footerGroups } from "@/lib/navigation";

type Group = (typeof footerGroups)[number];

const linkClass =
  "flex min-h-11 items-center text-sm transition-colors duration-200 hover:text-burgundy";

function GroupLinks({ group }: { group: Group }) {
  return (
    <ul>
      {group.links.map((link) => (
        <li key={link.label}>
          {link.href === "/" ? (
            <HomeLink className={linkClass}>{link.label}</HomeLink>
          ) : (
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

/*
  The full footer, rendered by the homepage only (app/page.tsx), so no other page
  repeats these links. One set of link groups (lib/navigation.ts) is shown two ways:
  - Phones: compact, collapsible groups (native <details>, so they work without
    scripts and with a keyboard), which keeps the footer short.
  - Tablets and up: open columns (two across on tablets, four on desktop).
  Legal and company pages are also reachable from My Account.
*/
export function SiteFooter() {
  return (
    <footer className="border-t border-sand bg-cream">
      <Container className="py-8 md:py-14">
        <div className="grid gap-6 md:gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="font-display text-xl font-medium tracking-[0.28em] md:text-2xl">{brand.name}</p>
            <p className="mt-1 font-display text-base italic text-stone md:mt-2 md:text-lg">{brand.tagline}</p>
          </div>

          {/* Phones: collapsible groups */}
          <nav aria-label="Footer" className="md:hidden">
            {footerGroups.map((group) => (
              <details key={group.title} className="group border-t border-sand last:border-b">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-espresso [&::-webkit-details-marker]:hidden">
                  {group.title}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 12 12"
                    className="h-3 w-3 transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="m2.500 4.500 3.500 3.500 3.500-3.500" />
                  </svg>
                </summary>
                <div className="pb-2 pl-1">
                  <GroupLinks group={group} />
                </div>
              </details>
            ))}
          </nav>

          {/* Tablets and up: open columns */}
          <nav
            aria-label="Footer"
            className="hidden gap-x-8 gap-y-8 md:grid md:grid-cols-2 lg:col-span-8 lg:grid-cols-4"
          >
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-burgundy">{group.title}</h2>
                <div className="mt-2">
                  <GroupLinks group={group} />
                </div>
              </div>
            ))}
          </nav>
        </div>

        <p className="mt-6 flex flex-col gap-1 text-xs leading-5 text-stone md:mt-10 md:flex-row md:justify-between md:border-t md:border-sand md:pt-6">
          <span>© 2026 {brand.name}</span>
          <span>Editorial photography by Unsplash contributors.</span>
        </p>
      </Container>
    </footer>
  );
}
