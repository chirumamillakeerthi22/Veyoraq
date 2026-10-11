"use client";

import {
  categoryLabels,
  occasionLabels,
} from "@/lib/fix-my-style/options";
import type { Addition, CleanOutfit } from "@/lib/fix-my-style/schema";
import type { WardrobeItem } from "@/lib/fix-my-style/wardrobe";
import { GarmentPhoto, primaryButton, secondaryButton } from "./ui";

export function AdditionList({
  additions,
  items,
  heading,
}: {
  additions: Addition[];
  items: Map<string, WardrobeItem>;
  heading: string;
}) {
  if (additions.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs uppercase tracking-[0.18em] text-stone">{heading}</h4>
      <ul className="mt-2 space-y-3">
        {additions.map((addition) => {
          const names = addition.worksWith
            .map((id) => items.get(id)?.name)
            .filter((name): name is string => Boolean(name));
          return (
            <li key={`${addition.name}-${addition.category}`} className="border border-sand bg-soft-white p-3">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {addition.name}
                <span className="border border-espresso/25 px-1.5 py-0.5 text-[0.6875rem] font-normal uppercase tracking-[0.12em] text-stone">
                  {addition.importance === "essential" ? "Essential" : "Optional"}
                </span>
              </p>
              <p className="mt-1 text-xs text-stone">
                {categoryLabels[addition.category]} · {addition.colourSuggestion}
              </p>
              <p className="mt-2 text-sm leading-6">{addition.why}</p>
              {names.length > 0 && (
                <p className="mt-1 text-xs leading-5 text-stone">Works with: {names.join(", ")}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function OutfitCard({
  outfit,
  items,
  saved,
  busy = false,
  onToggleSave,
}: {
  outfit: CleanOutfit;
  items: Map<string, WardrobeItem>;
  saved: boolean;
  busy?: boolean;
  onToggleSave: () => void;
}) {
  const needsAdditions = outfit.kind === "needs_additions";

  return (
    <article
      className={`border bg-soft-white p-4 sm:p-5 ${
        needsAdditions ? "border-dashed border-espresso/40" : "border-sand"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-stone">
        {needsAdditions ? "Needs something new" : "Uses only what you own"}
      </p>
      <h3 className="mt-1 font-display text-2xl leading-8">{outfit.title}</h3>

      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {outfit.itemIds.map((id) => {
          const item = items.get(id);
          return (
            <li key={id}>
              <div className="aspect-[3/4] overflow-hidden border border-sand bg-sand">
                {item ? (
                  <GarmentPhoto blob={item.photo} alt={item.name} />
                ) : (
                  <p className="flex h-full items-center justify-center p-2 text-center text-xs text-stone">
                    This item was removed
                  </p>
                )}
              </div>
              <p className="mt-1 text-xs leading-4 [overflow-wrap:anywhere]">
                {item?.name ?? "Removed item"}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 space-y-3 text-sm leading-6">
        <p>
          <span className="font-medium">How to wear it: </span>
          {outfit.layering}
        </p>
        <p>
          <span className="font-medium">Why it works: </span>
          {outfit.whyItWorks}
        </p>
        <p className="text-stone">
          Suits: {outfit.occasions.map((occasion) => occasionLabels[occasion]).join(", ")}
        </p>
        {outfit.variations.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-stone">
            {outfit.variations.map((variation) => (
              <li key={variation}>{variation}</li>
            ))}
          </ul>
        )}
      </div>

      {needsAdditions && (
        <div className="mt-4">
          <AdditionList additions={outfit.additions} items={items} heading="You would need" />
        </div>
      )}

      <div className="mt-4">
        <button
          type="button"
          disabled={busy}
          aria-pressed={saved}
          onClick={onToggleSave}
          className={saved ? secondaryButton : primaryButton}
        >
          {saved ? "Saved · Remove" : "Save outfit"}
        </button>
      </div>
    </article>
  );
}
