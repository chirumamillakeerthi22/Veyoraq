import { SaveOutfitButton } from "@/components/saved/save-outfit-button";
import { OutfitCard } from "@/components/stylist/outfit-card";
import type { SavedAnswers } from "@/lib/saved/saved-outfits";
import type { Outfit } from "@/lib/stylist/schema";

type OutfitResultsProps = {
  outfits: Outfit[];
  // The questionnaire choices (never the free-text notes), kept with a saved look.
  answers: SavedAnswers | null;
};

export function OutfitResults({ outfits, answers }: OutfitResultsProps) {
  return (
    <ol className="grid gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {outfits.map((outfit, index) => (
        <li key={`${outfit.name}-${index}`}>
          <OutfitCard outfit={outfit}>
            <SaveOutfitButton outfit={outfit} answers={answers} />
          </OutfitCard>
        </li>
      ))}
    </ol>
  );
}
