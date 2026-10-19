"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "@/components/auth/account-menu";
import { NavIconGlyph } from "@/components/nav-icon";
import {
  collectionLinks,
  isActiveLink,
  navLinks,
  shopHref,
  type NavLink,
} from "@/lib/navigation";

function TopLink({ link, active, withIcon }: { link: NavLink; active: boolean; withIcon: boolean }) {
  const text = link.shortLabel ?? link.label;
  return (
    <Link
      href={link.href}
      // The short label is what shows; the full name is what is announced.
      aria-label={link.shortLabel ? link.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`group relative flex min-h-11 items-center gap-2 px-1 text-[0.8125rem] tracking-wide transition-colors duration-200 ${
        active ? "text-espresso" : "text-stone hover:text-espresso"
      }`}
    >
      {withIcon && (
        <NavIconGlyph
          name={link.icon}
          className="h-[1.125rem] w-[1.125rem] transition-transform duration-300 group-hover:-translate-y-0.5"
        />
      )}
      {text}
      <span
        aria-hidden="true"
        className={`absolute inset-x-1 bottom-1.5 h-px origin-left bg-gold transition-transform duration-300 ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}

/*
  Right side of the header.
  - md and up: Explore, Shop, Saved, Wishlist and the Account icon.
  - Phones: just a Shop icon and the Account icon; the other destinations are in
    the bottom bar (components/bottom-nav.tsx).
*/
export function HeaderNav() {
  const pathname = usePathname();
  const shopActive = isActiveLink(pathname, shopHref);

  return (
    <div className="flex items-center gap-1 md:gap-6 lg:gap-9">
      <nav aria-label="Main" className="hidden md:block">
        <ul className="flex items-center gap-6 lg:gap-9">
          {[...navLinks, ...collectionLinks].map((link) => (
            <li key={link.href}>
              <TopLink
                link={link}
                active={isActiveLink(pathname, link.href, link.activeUnder)}
                withIcon={collectionLinks.includes(link)}
              />
            </li>
          ))}
        </ul>
      </nav>

      <Link
        href={shopHref}
        aria-label="Shop"
        aria-current={shopActive ? "page" : undefined}
        className={`flex h-11 w-11 items-center justify-center transition-colors duration-200 md:hidden ${
          shopActive ? "text-espresso" : "text-stone"
        }`}
      >
        <NavIconGlyph name="shop" className="h-[1.375rem] w-[1.375rem]" />
      </Link>

      <AccountMenu />
    </div>
  );
}
