"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SidebarContent } from "@/components/sidebar/sidebar-content";

/*
  The phone navigation (below md): a menu button and a slide-in drawer holding the
  same destinations as the top bar. It uses a native <dialog>, which gives a real focus trap,
  Escape to close, a dimmed backdrop, and returns focus to the button on close.
*/
export function MobileNav() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Remembering WHERE it was opened means moving to another page closes it by itself.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() focuses the first link; start on the close button instead.
      dialog.querySelector<HTMLElement>("[data-initial-focus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Keep the page behind the drawer from scrolling.
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [open]);

  const close = () => setOpenOn(null);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpenOn(pathname)}
        className="-mr-2 flex h-11 w-11 items-center justify-center"
      >
        <span className="sr-only">Open menu</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={close}
        onClick={(event) => {
          // A click on the dimmed area outside the panel lands on the dialog itself.
          if (event.target === event.currentTarget) close();
        }}
        className="drawer-panel m-0 h-dvh max-h-none w-[min(20rem,88vw)] max-w-none overflow-visible border-r border-sand bg-ivory p-0 text-espresso backdrop:bg-espresso/40"
      >
        {open && (
          <>
            <h2 id={titleId} className="sr-only">
              Menu
            </h2>
            <SidebarContent
              onNavigate={close}
              closeButton={
                <button
                  type="button"
                  onClick={close}
                  data-initial-focus
                  className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center"
                >
                  <span className="sr-only">Close menu</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              }
            />
          </>
        )}
      </dialog>
    </div>
  );
}
