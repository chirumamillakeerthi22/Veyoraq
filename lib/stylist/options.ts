// The questionnaire's choices. The form, the validation schema and the AI prompt
// all read from here so they cannot drift apart.

export const occasionValues = [
  "everyday",
  "work",
  "casual-outing",
  "date-night",
  "celebration",
  "festive",
  "travel",
  // Added with the step-by-step quiz.
  "college",
  "party",
  "wedding",
  "special",
] as const;

export const occasionLabels: Record<(typeof occasionValues)[number], string> = {
  everyday: "Everyday",
  work: "Work",
  "casual-outing": "Casual outing",
  "date-night": "Date night",
  celebration: "Celebration",
  festive: "Festive",
  travel: "Travel",
  college: "College or university",
  party: "Parties and events",
  wedding: "Weddings and celebrations",
  special: "Special occasions",
};

export const styleValues = [
  "minimal",
  "classic",
  "relaxed",
  "bold",
  "romantic",
  "streetwear",
  "traditional",
  "indo-western",
  // Added with the step-by-step quiz.
  "trendy",
  "boho",
] as const;

export const styleLabels: Record<(typeof styleValues)[number], string> = {
  minimal: "Minimal",
  classic: "Classic",
  relaxed: "Relaxed",
  bold: "Bold",
  romantic: "Romantic",
  streetwear: "Streetwear",
  traditional: "Traditional",
  "indo-western": "Indo-western",
  trendy: "Modern and trendy",
  boho: "Boho and relaxed",
};

export const colourValues = [
  "neutrals",
  "earth-tones",
  "pastels",
  "jewel-tones",
  "monochrome",
  "brights",
  // Added with the step-by-step quiz.
  "warm-tones",
  "cool-tones",
  "mixed",
] as const;

export const colourLabels: Record<(typeof colourValues)[number], string> = {
  neutrals: "Neutrals",
  "earth-tones": "Earth tones",
  pastels: "Pastels",
  "jewel-tones": "Jewel tones",
  monochrome: "Black and white",
  brights: "Brights",
  "warm-tones": "Warm tones",
  "cool-tones": "Cool tones",
  mixed: "A mix of colours",
};

export const fitValues = ["relaxed", "regular", "fitted", "oversized", "mixed"] as const;

export const fitLabels: Record<(typeof fitValues)[number], string> = {
  relaxed: "Relaxed",
  regular: "Regular",
  fitted: "Fitted",
  oversized: "Oversized",
  mixed: "A mix, depending on the outfit",
};

// Quick "anything else" choices. Plain preferences only: nothing about bodies.
export const considerationValues = [
  "comfort-first",
  "light-fabrics",
  "cotton-linen",
  "prints-patterns",
  "solid-colours",
  "covered-arms",
  "covered-legs",
  "no-heels",
  "avoid-bright-colours",
  "avoid-tight-fits",
] as const;

export const considerationLabels: Record<(typeof considerationValues)[number], string> = {
  "comfort-first": "Comfort first",
  "light-fabrics": "Light, airy fabrics",
  "cotton-linen": "Cotton and linen",
  "prints-patterns": "I like prints",
  "solid-colours": "I prefer solid colours",
  "covered-arms": "Covered arms",
  "covered-legs": "Covered legs",
  "no-heels": "No heels",
  "avoid-bright-colours": "Avoid bright colours",
  "avoid-tight-fits": "Avoid tight fits",
};

export const budgetTierValues = ["value", "mid", "premium", "none"] as const;

export const budgetTierLabels: Record<
  (typeof budgetTierValues)[number],
  { label: string; hint: string }
> = {
  value: { label: "Value", hint: "Keep it affordable" },
  mid: { label: "Mid-range", hint: "A balance of price and quality" },
  premium: { label: "Investment", hint: "Pieces worth spending on" },
  none: { label: "No new purchases", hint: "Use what I already own" },
};

/*
  The budget choices shown in the quiz, in Indian rupees. Edit this list to change
  the ranges: each one maps to a tier the AI understands. The amounts are only
  labels for the person; the AI is told the tier and never an amount.
*/
export const budgetOptions = [
  { id: "under-1500", label: "Under ₹1,500", hint: "Keep it light", tier: "value" },
  { id: "1500-4000", label: "₹1,500 to ₹4,000", hint: "A balance of price and quality", tier: "mid" },
  { id: "4000-plus", label: "₹4,000 and above", hint: "Pieces worth investing in", tier: "premium" },
  { id: "none", label: "No new purchases for now", hint: "Style what I already own", tier: "none" },
] as const;

export const currencyValues = ["INR", "USD", "GBP", "EUR"] as const;

export const pieceCategoryValues = [
  "top",
  "bottom",
  "dress",
  "jumpsuit",
  "outerwear",
  "footwear",
  "bag",
  "accessory",
  "jewellery",
] as const;

export const pieceCategoryLabels: Record<
  (typeof pieceCategoryValues)[number],
  string
> = {
  top: "Top",
  bottom: "Bottom",
  dress: "Dress",
  jumpsuit: "Jumpsuit",
  outerwear: "Outerwear",
  footwear: "Footwear",
  bag: "Bag",
  accessory: "Accessory",
  jewellery: "Jewellery",
};

export const limits = {
  styles: 3,
  colours: 4,
  occasions: 3,
  considerations: 6,
  notes: 300,
  outfits: 3,
} as const;
