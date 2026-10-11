// FIX My Style's fixed choices. The forms, the validation schemas and the AI prompts
// all read from here so they cannot drift apart.

export const categoryValues = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "bags",
  "accessories",
] as const;
export type Category = (typeof categoryValues)[number];
export const categoryLabels: Record<Category, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  dresses: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  bags: "Bags",
  accessories: "Accessories",
};

export const colourValues = [
  "black",
  "white",
  "cream",
  "beige",
  "brown",
  "grey",
  "navy",
  "blue",
  "green",
  "olive",
  "red",
  "pink",
  "yellow",
  "orange",
  "purple",
  "multicolour",
] as const;
export type GarmentColour = (typeof colourValues)[number];
export const colourLabels: Record<GarmentColour, string> = {
  black: "Black",
  white: "White",
  cream: "Cream",
  beige: "Beige",
  brown: "Brown",
  grey: "Grey",
  navy: "Navy",
  blue: "Blue",
  green: "Green",
  olive: "Olive",
  red: "Red",
  pink: "Pink",
  yellow: "Yellow",
  orange: "Orange",
  purple: "Purple",
  multicolour: "Multicolour",
};

export const patternValues = [
  "solid",
  "striped",
  "checked",
  "floral",
  "printed",
  "textured",
  "embroidered",
  "other",
] as const;
export type Pattern = (typeof patternValues)[number];
export const patternLabels: Record<Pattern, string> = {
  solid: "Solid",
  striped: "Striped",
  checked: "Checked",
  floral: "Floral",
  printed: "Printed",
  textured: "Textured",
  embroidered: "Embroidered",
  other: "Other",
};

// "unsure" is a real answer: a photo rarely proves what a fabric is.
export const materialValues = [
  "unsure",
  "cotton",
  "linen",
  "denim",
  "wool",
  "knit",
  "silk",
  "satin",
  "leather",
  "synthetic",
] as const;
export type Material = (typeof materialValues)[number];
export const materialLabels: Record<Material, string> = {
  unsure: "Not sure",
  cotton: "Cotton",
  linen: "Linen",
  denim: "Denim",
  wool: "Wool",
  knit: "Knit",
  silk: "Silk",
  satin: "Satin",
  leather: "Leather",
  synthetic: "Synthetic",
};

export const seasonValues = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof seasonValues)[number];
export const seasonLabels: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

export const occasionValues = [
  "everyday",
  "work",
  "date-night",
  "party",
  "travel",
  "formal",
] as const;
export type Occasion = (typeof occasionValues)[number];
export const occasionLabels: Record<Occasion, string> = {
  everyday: "Everyday",
  work: "Work",
  "date-night": "Date night",
  party: "Party",
  travel: "Travel",
  formal: "Formal",
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
export type StyleName = (typeof styleValues)[number];
export const styleLabels: Record<StyleName, string> = {
  minimal: "Minimal",
  classic: "Classic",
  relaxed: "Relaxed",
  bold: "Bold",
  romantic: "Romantic",
  streetwear: "Streetwear",
  traditional: "Traditional",
  "indo-western": "Indo-western",
};

export const formalityValues = ["casual", "smart-casual", "formal"] as const;
export type Formality = (typeof formalityValues)[number];
export const formalityLabels: Record<Formality, string> = {
  casual: "Casual",
  "smart-casual": "Smart casual",
  formal: "Formal",
};

// Limits shared by the forms and the server checks.
export const limits = {
  nameLength: 60,
  itemsPerRequest: 40,
  mustInclude: 6,
  colourPerItem: 3,
  // Photo limits. The browser shrinks every photo before it is stored or sent.
  rawPhotoBytes: 15 * 1024 * 1024,
  preparedPhotoBytes: 1_200_000,
  longEdgePixels: 1280,
} as const;

export const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
