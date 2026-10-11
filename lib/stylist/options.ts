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
] as const;

export const occasionLabels: Record<(typeof occasionValues)[number], string> = {
  everyday: "Everyday",
  work: "Work",
  "casual-outing": "Casual outing",
  "date-night": "Date night",
  celebration: "Celebration",
  festive: "Festive",
  travel: "Travel",
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
};

export const colourValues = [
  "neutrals",
  "earth-tones",
  "pastels",
  "jewel-tones",
  "monochrome",
  "brights",
] as const;

export const colourLabels: Record<(typeof colourValues)[number], string> = {
  neutrals: "Neutrals",
  "earth-tones": "Earth tones",
  pastels: "Pastels",
  "jewel-tones": "Jewel tones",
  monochrome: "Black and white",
  brights: "Brights",
};

export const budgetTierValues = ["value", "mid", "premium"] as const;

export const budgetTierLabels: Record<
  (typeof budgetTierValues)[number],
  { label: string; hint: string }
> = {
  value: { label: "Value", hint: "Keep it affordable" },
  mid: { label: "Mid-range", hint: "A balance of price and quality" },
  premium: { label: "Investment", hint: "Pieces worth spending on" },
};

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
  notes: 300,
  outfits: 3,
} as const;
