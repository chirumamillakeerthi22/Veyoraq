"use client";

import { useEffect, useId, useRef, useState } from "react";
import { audienceLabels, audienceValues, type Audience } from "@/lib/audience";
import { setAudience, useAudience } from "@/lib/use-audience";

/*
  The "Women / Men" control in the header. A compact button shows the current choice
  and opens a two-option menu. It follows the usual menu keyboard pattern: Enter,
  Space or the arrow keys open it, the arrows move between options, Enter or Space
  chooses, and Escape or Tab closes it.
*/
export function AudienceMenu({ className = "" }: { className?: string }) {
  const audience = useAudience();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    // Move focus to the chosen option so the keyboard starts in the right place.
    items.current[audienceValues.indexOf(audience)]?.focus();
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
    // audience is read once at open time on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function choose(value: Audience) {
    setAudience(value);
    setOpen(false);
    trigger.current?.focus();
  }

  function onMenuKey(event: React.KeyboardEvent) {
    const current = items.current.findIndex((el) => el === document.activeElement);
    const last = audienceValues.length - 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      items.current[current >= last ? 0 : current + 1]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items.current[current <= 0 ? last : current - 1]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items.current[last]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Styling for ${audienceLabels[audience]}. Change audience`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex min-h-11 items-center gap-1 px-1 text-[0.8125rem] tracking-wide text-espresso transition-colors duration-200 hover:text-stone"
      >
        {audienceLabels[audience]}
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Styling for"
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-50 mt-1 min-w-36 border border-sand bg-ivory py-1 shadow-sm md:left-0 md:right-auto"
        >
          {audienceValues.map((value, index) => {
            const selected = audience === value;
            return (
              <button
                key={value}
                ref={(el) => {
                  items.current[index] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => choose(value)}
                className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm transition-colors duration-200 ${
                  selected ? "bg-espresso text-ivory" : "hover:bg-espresso/5"
                }`}
              >
                {audienceLabels[value]}
                {selected && (
                  <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="m2 6.5 2.5 2.5L10 3.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
