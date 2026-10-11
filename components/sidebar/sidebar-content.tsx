"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "@/components/auth/account-menu";
import { NavIconGlyph, StarGlyph } from "@/components/sidebar/nav-icon";
import { brand } from "@/lib/brand";
import { collectionLinks, isActiveLink, navLinks, type NavLink } from "@/lib/navigation";

type SidebarContentProps = {
  // Called after any link inside is used, so the mobile drawer can close itself.
  onNavigate?: () => void;
  // The drawer passes its close button here; the desktop sidebar has none.
  closeButton?: React.ReactNode;
};

function SidebarLink({
  link,
  active,
  onNavigate,
}: {
  link: NavLink;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group relative flex min-h-11 items-center gap-3.5 rounded-sm px-4 text-[0.9375rem] tracking-wide transition-colors duration-300 ${
        active ? "text-espresso" : "text-stone hover:text-espresso"
      }`}
    >
      {/* Soft champagne wash: always there when active, fades in on hover otherwise. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-sm bg-gradient-to-r from-champagne via-champagne/70 to-champagne/0 transition-opacity duration-300 ${
          active
            ? "opacity-100 shadow-[0_0_22px_-6px_rgba(179,149,86,0.55)]"
            : "opacity-0 group-hover:opacity-80"
        }`}
      />
      {/* The indicator: a fine gold line that grows from the centre. */}
      <span
        aria-hidden="true"
        className={`absolute bottom-2 left-0 top-2 w-px origin-center bg-gold transition-transform duration-300 ${
          active ? "scale-y-100" : "scale-y-0"
        }`}
      />
      <NavIconGlyph
        name={link.icon}
        className={`relative h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-6 ${
          active ? "text-gold" : ""
        }`}
      />
      <span className="relative">{link.label}</span>
      <StarGlyph
        className={`relative ml-auto h-2.5 w-2.5 text-gold transition-all duration-300 ${
          active ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      />
    </Link>
  );
}

function SectionLabel({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <p
      id={id}
      className="mb-2 flex items-center gap-3 px-4 text-[0.6875rem] uppercase tracking-[0.24em] text-stone"
    >
      {children}
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-gold/50 to-transparent" />
    </p>
  );
}

/*
  The contents of the phone drawer: the wordmark, the main destinations, the
  personal collection and the account section. Link data comes from
  lib/navigation.ts, the same source as the top bar.
*/
export function SidebarContent({ onNavigate, closeButton }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="relative flex h-full flex-col bg-gradient-to-b from-soft-white via-ivory to-champagne/60">
      {/* A barely visible constellation. Clipped to its own layer so the account
          menu is never cut off by it. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          viewBox="0 0 280 420"
          className="absolute -right-4 bottom-20 h-auto w-44 text-gold opacity-40"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
        >
          <path d="M40 40 L110 90 L170 60 L230 130 L190 210" />
          <path d="M110 90 L90 170" />
          <g fill="currentColor" stroke="none">
            <circle cx="40" cy="40" r="1.6" />
            <circle cx="110" cy="90" r="2.2" />
            <circle cx="170" cy="60" r="1.4" />
            <circle cx="230" cy="130" r="1.8" />
            <circle cx="190" cy="210" r="1.4" />
            <circle cx="90" cy="170" r="1.2" />
          </g>
        </svg>
      </div>

      <div className="relative flex items-start justify-between px-6 pb-6 pt-8">
        <Link
          href="/"
          onClick={onNavigate}
          aria-label={`${brand.name} home`}
          className="block"
        >
          <span className="flex items-start gap-1.5 font-display text-[1.75rem] font-medium leading-none tracking-[0.26em]">
            {brand.name}
            <StarGlyph className="sparkle mt-0.5 h-2.5 w-2.5 text-gold" />
          </span>
          <span className="mt-2 block font-display text-base italic text-stone">
            {brand.tagline}
          </span>
        </Link>
        {closeButton}
      </div>

      <div className="relative flex-1 overflow-y-auto px-3 pb-4">
        <nav aria-label="Main">
          <ul className="space-y-0.5">
            {navLinks.map((link) => (
              <li key={link.href}>
                <SidebarLink
                  link={link}
                  active={isActiveLink(pathname, link.href, link.activeUnder)}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="sidebar-collection" className="mt-8">
          <SectionLabel id="sidebar-collection">Your collection</SectionLabel>
          <ul className="space-y-0.5">
            {collectionLinks.map((link) => (
              <li key={link.href}>
                <SidebarLink
                  link={link}
                  active={isActiveLink(pathname, link.href, link.activeUnder)}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="relative border-t border-sand/80 px-3 py-3">
        <AccountMenu onNavigate={onNavigate} />
      </div>
    </div>
  );
}
