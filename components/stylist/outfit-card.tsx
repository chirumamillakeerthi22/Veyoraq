import { OutfitBoard } from "@/components/stylist/outfit-board";
import { pieceCategoryLabels } from "@/lib/stylist/options";
import type { Outfit } from "@/lib/stylist/schema";

type OutfitCardProps = {
  outfit: Outfit;
  // Actions shown under the card, such as Save or Remove.
  children?: React.ReactNode;
  // Controls laid over the top-right of the image, such as a quick-save bookmark.
  overlay?: React.ReactNode;
};

// One outfit: its illustrated board, a short summary, the pieces, and the details.
// Shared by the results page and the Saved Styles page.
export function OutfitCard({ outfit, children, overlay }: OutfitCardProps) {
  return (
    <article>
      <div className="relative">
        <div className="overflow-hidden border border-sand">
          <OutfitBoard outfit={outfit} />
        </div>
        {overlay}
      </div>

      <h3 className="mt-5 font-display text-3xl leading-tight">{outfit.name}</h3>
      <p className="mt-1 leading-7 text-stone">{outfit.summary}</p>

      <ul className="mt-5">
        {outfit.pieces.map((piece, pieceIndex) => (
          <li
            key={`${piece.category}-${pieceIndex}`}
            className="flex items-center gap-3 border-t border-sand py-2.5 first:border-t-0"
          >
            <span
              aria-hidden="true"
              className="h-4 w-4 shrink-0 border border-espresso/30"
              style={{ backgroundColor: piece.hex }}
            />
            <span className="w-[5.5rem] shrink-0 text-[0.6875rem] uppercase tracking-[0.12em] text-stone">
              {pieceCategoryLabels[piece.category]}
            </span>
            <span className="leading-6">
              <span className="sr-only">{piece.colour}, </span>
              {piece.description}
            </span>
          </li>
        ))}
      </ul>

      <details className="group mt-4 border-t border-sand">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
          Why it works
          <span
            aria-hidden="true"
            className="text-lg leading-none transition-transform duration-200 group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <p className="leading-7">{outfit.whyItWorks}</p>
        <p className="mt-2 leading-7 text-stone">
          <span className="font-medium text-espresso">Tip: </span>
          {outfit.stylingTip}
        </p>
      </details>

      {children && <div className="mt-4 border-t border-sand pt-4">{children}</div>}
    </article>
  );
}
