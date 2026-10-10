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
      summary: "A calm, structured look for long days at the office.",
      palette: [
        { name: "Oatmeal", hex: "#D8CBB8" },
        { name: "Charcoal", hex: "#3A3A3C" },
      ],
      pieces: [
        { category: "top", description: "Crisp cotton shirt, relaxed fit", colour: "Ivory" },
        { category: "bottom", description: "High-waisted tapered trousers", colour: "Charcoal" },
        { category: "footwear", description: "Low-heeled leather loafers", colour: "Tan" },
      ],
      whyItWorks: "Light fabrics keep it comfortable while the tailoring keeps it sharp.",
      stylingTip: "Roll the sleeves once for an easy finish.",
    },
  ],
};
