"use client";

import { useSyncExternalStore } from "react";
import { audienceLabels, audienceStore, audienceValues } from "@/lib/audience";

/*
  "Styling for": always visible, never in a dropdown. All four options stay in one
  row (they are short words), the chosen one is filled, and the choice is kept in the
  browser so it carries across pages and refreshes.
*/
export function AudienceSelector() {
  const { audience } = useSyncExternalStore(
    audienceStore.subscribe,
    audienceStore.getSnapshot,
    audienceStore.getServerSnapshot,
  );

  return (
    <div className="flex items-center gap-3 sm:gap-4" role="group" aria-label="Styling for">
      <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-stone">Styling for</span>
      <div className="grid min-w-0 flex-1 grid-cols-4 border border-sand sm:max-w-md">
        {audienceValues.map((value) => {
          const selected = audience === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => audienceStore.set({ audience: value })}
              className={`min-h-11 px-1 text-sm transition-colors duration-200 sm:px-3 ${
                selected ? "bg-espresso text-ivory" : "text-espresso hover:bg-espresso/5"
              }`}
            >
              {audienceLabels[value]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// The selector in its consistent place: a slim strip at the top of the page content.
export function AudienceBar() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-4 sm:px-8 lg:px-12">
      <AudienceSelector />
    </div>
  );
}
