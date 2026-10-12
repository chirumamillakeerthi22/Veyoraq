"use client";

import { useEffect, useId, useRef } from "react";

/*
  A panel that rises from the bottom on phones and sits centred on larger screens.
  It uses a native <dialog>: a real focus trap, Escape to close, and a dimmed
  backdrop. Its height is capped to the visible viewport so it stays usable with an
  on-screen keyboard, and it keeps clear of the home indicator.
*/
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-xl border-t border-sand bg-ivory p-0 text-espresso backdrop:bg-espresso/50 md:m-auto md:max-w-2xl md:rounded-xl md:border"
    >
      {open && (
        <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="font-display text-3xl leading-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center"
            >
              <span className="sr-only">Close</span>
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
          </div>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
