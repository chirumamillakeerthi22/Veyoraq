"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeLink } from "@/components/home-link";
import { NavIconGlyph } from "@/components/nav-icon";
import { bottomNavLinks, isActiveLink } from "@/lib/navigation";

/*
  The phone navigation: Home, Explore, Saved and Wishlist, fixed to the bottom so
  they sit under the thumb. It is hidden from md up, where the header carries the
  same destinations. The page leaves room for it (see the body padding in
  app/layout.tsx) and the bar itself keeps clear of the home indicator.
*/
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 transform-gpu border-t border-sand bg-ivory pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {bottomNavLinks.map((link) => {
          const active = isActiveLink(pathname, link.href, link.activeUnder);
          const text = link.shortLabel ?? link.label;
          // Home always returns to the top of the homepage, even from the homepage.
          const NavLink = link.href === "/" ? HomeLink : Link;
          return (
            <li key={link.href}>
              <NavLink
                href={link.href}
                aria-current={active ? "page" : undefined}
                aria-label={link.shortLabel ? link.label : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-xs tracking-wide transition-colors duration-200 ${
                  active ? "text-burgundy" : "text-stone"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-6 top-0 h-px bg-burgundy transition-opacity duration-200 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                <NavIconGlyph
                  name={link.icon}
                  className={`h-6 w-6 ${active ? "text-burgundy" : ""}`}
                />
                {text}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
