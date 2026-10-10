"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ButtonLink } from "@/components/button-link";
import { navLinks, stylistHref } from "@/lib/navigation";

// Menu button and drop-down panel shown below the lg breakpoint.
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="-mr-2 flex h-11 w-11 items-center justify-center"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 8h16M4 16h16" />
          )}
        </svg>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-sand bg-ivory shadow-lg shadow-espresso/10"
      >
        <nav aria-label="Mobile" className="px-5 pb-6 pt-2 sm:px-8">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href} className="border-b border-sand">
                <Link
                  href={link.href}
                  onClick={close}
                  className="flex min-h-14 items-center font-display text-2xl"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href={stylistHref} onClick={close} className="mt-6 w-full">
            Discover My Style
          </ButtonLink>
        </nav>
      </div>
    </div>
  );
}
