"use client";

import { useState } from "react";
import { DeleteSavedButton } from "@/components/saved/delete-saved-button";
import { Sheet } from "@/components/sheet";
import { OutfitBoard } from "@/components/stylist/outfit-board";
import { OutfitCard } from "@/components/stylist/outfit-card";
import { audienceLabels } from "@/lib/audience";
import type { SavedOutfit } from "@/lib/saved/saved-outfits";

/*
  A compact card for the two-column Saved Styles grid: the illustrated board is the
  focus, then the name and the Remove action. Tapping the picture or the name opens
  the full outfit (pieces, why it works, tip) in a sheet.
*/
export function SavedCard({ item, showAudience = false }: { item: SavedOutfit; showAudience?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="flex h-full flex-col">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="block w-full text-left"
      >
        <span className="block overflow-hidden border border-sand">
          <OutfitBoard outfit={item.outfit} />
        </span>
        <span className="mt-2 block font-display text-lg leading-6 [overflow-wrap:anywhere] sm:text-xl">
          {item.outfit.name}
        </span>
        {showAudience && item.audience && (
          <span className="mt-0.5 block text-xs uppercase tracking-[0.14em] text-stone">
            {audienceLabels[item.audience]}
          </span>
        )}
        <span className="sr-only">. Open details.</span>
      </button>

      <div className="mt-auto pt-2">
        <DeleteSavedButton id={item.id} itemKey={item.key} compact />
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={item.outfit.name}>
        <OutfitCard outfit={item.outfit} />
      </Sheet>
    </article>
  );
}
