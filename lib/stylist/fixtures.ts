// Shared sample data for tests. Not used by the application.
import type { StylistInput, StylistOutput } from "./schema";

export const validInput: StylistInput = {
  occasion: "work",
  styles: ["minimal", "classic"],
  colours: ["neutrals"],
  budgetTier: "mid",
  currency: "INR",
  notes: "I run warm, so lighter fabrics please.",
};

export const validOutput: StylistOutput = {
  outfits: [
    {
      name: "Quiet Tailoring",
      summary: "A calm, structured look for long days.",
      palette: [
        { name: "Oatmeal", hex: "#D8CBB8" },
        { name: "Charcoal", hex: "#3A3A3C" },
      ],
      pieces: [
        { category: "top", description: "Crisp cotton shirt, relaxed fit", colour: "Ivory", hex: "#F4EFE6" },
        { category: "bottom", description: "High-waisted tapered trousers", colour: "Charcoal", hex: "#3A3A3C" },
        { category: "footwear", description: "Low-heeled leather loafers", colour: "Tan", hex: "#B08968" },
      ],
      whyItWorks: "Light fabrics keep it comfortable while the tailoring stays sharp.",
      stylingTip: "Roll the sleeves once for an easy finish.",
    },
  ],
};
