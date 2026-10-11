"use client";

import { useEffect, useId, useRef } from "react";

/* Shared styling and small building blocks for the FIX My Style screens. */

const buttonBase =
  "inline-flex min-h-12 items-center justify-center px-6 text-center text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";
export const primaryButton = `${buttonBase} bg-espresso text-ivory hover:bg-stone`;
export const secondaryButton = `${buttonBase} border border-espresso/30 text-espresso hover:border-espresso hover:bg-espresso/5`;
export const textButton =
  "inline-flex min-h-11 items-center justify-center px-2 text-sm underline underline-offset-4 transition-colors duration-200 hover:text-stone disabled:opacity-50";
export const fieldClass =
  "mt-1 block min-h-12 w-full border border-sand bg-soft-white px-3 text-base";
export const labelClass = "text-sm text-stone";
export const headingClass = "font-display text-2xl leading-8";

// Photos live in memory as Blobs. One address per Blob is made on first use and
// reused, so a re-render never creates a second one.
const urls = new WeakMap<Blob, string>();

export function photoUrl(blob: Blob): string {
  let url = urls.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    urls.set(blob, url);
  }
  return url;
}

export function releasePhoto(blob: Blob) {
  const url = urls.get(blob);
  if (url) {
    URL.revokeObjectURL(url);
    urls.delete(blob);
  }
}

// A garment photo. A plain <img> is used because the source is a local Blob.
export function GarmentPhoto({
  blob,
  alt,
  className = "",
}: {
  blob: Blob;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl(blob)}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

// A selectable pill: a real checkbox or radio underneath, so keyboards and screen
// readers behave natively.
export function Chip({
  type = "checkbox",
  name,
  value,
  label,
  checked,
  disabled = false,
  onChange,
}: {
  type?: "checkbox" | "radio";
  name: string;
  value: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label className="cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="flex min-h-11 items-center border border-sand bg-soft-white px-4 text-sm transition-colors duration-200 hover:border-espresso/50 peer-checked:border-espresso peer-checked:bg-espresso peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso">
        {label}
      </span>
    </label>
  );
}

/*
  A panel that rises from the bottom on phones and sits centred on larger screens.
  It uses a native <dialog>: a real focus trap, Escape to close, and a dimmed
  backdrop. It is capped to the visible height so it stays usable with a keyboard.
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
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-xl border-t border-sand bg-ivory p-0 text-espresso backdrop:bg-espresso/50 md:m-auto md:max-w-xl md:rounded-xl md:border"
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

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`border p-4 text-sm leading-6 ${
        tone === "error" ? "border-espresso bg-soft-white" : "border-sand bg-soft-white text-stone"
      }`}
    >
      {children}
    </p>
  );
}
