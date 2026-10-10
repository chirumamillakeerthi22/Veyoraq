import { pieceCategoryLabels } from "@/lib/stylist/options";
import type { Outfit } from "@/lib/stylist/schema";

type OutfitResultsProps = {
  outfits: Outfit[];
};

export function OutfitResults({ outfits }: OutfitResultsProps) {
  return (
    <ol className="grid gap-10 lg:grid-cols-3 lg:gap-8">
      {outfits.map((outfit, index) => (
        <li key={`${outfit.name}-${index}`} className="border-t border-espresso/30 pt-6">
          <article>
            <p className="text-xs uppercase tracking-[0.22em] text-stone">
              Outfit {index + 1}
            </p>
            <h3 className="mt-2 font-display text-3xl leading-tight">
              {outfit.name}
            </h3>
            <p className="mt-3 leading-7 text-stone">{outfit.summary}</p>

            <h4 className="mt-6 text-xs uppercase tracking-[0.22em] text-stone">
              Palette
            </h4>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
              {outfit.palette.map((swatch) => (
                <li key={swatch.hex + swatch.name} className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 border border-sand"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  {swatch.name}
                </li>
              ))}
            </ul>

            <h4 className="mt-6 text-xs uppercase tracking-[0.22em] text-stone">
              The pieces
            </h4>
            <ul className="mt-3">
              {outfit.pieces.map((piece, pieceIndex) => (
                <li
                  key={`${piece.category}-${pieceIndex}`}
                  className="border-b border-sand py-3 first:pt-0"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-stone">
                    {pieceCategoryLabels[piece.category]}
                  </p>
                  <p className="mt-1 leading-6">
                    {piece.description}{" "}
                    <span className="text-stone">({piece.colour})</span>
                  </p>
                </li>
              ))}
            </ul>

            <h4 className="mt-6 text-xs uppercase tracking-[0.22em] text-stone">
              Why it works
            </h4>
            <p className="mt-2 leading-7">{outfit.whyItWorks}</p>

            <h4 className="mt-6 text-xs uppercase tracking-[0.22em] text-stone">
              Styling tip
            </h4>
            <p className="mt-2 leading-7">{outfit.stylingTip}</p>
          </article>
        </li>
      ))}
    </ol>
  );
}
