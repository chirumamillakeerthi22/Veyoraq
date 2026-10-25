import type { Audience } from "@/lib/audience";

/*
  Fit Guidance: the choices people can make. Shared by the browser and the server so
  both agree on exactly what is allowed.

  Body-shape names are optional style descriptors for talking about proportions in
  clothing. They are not medical or scientific categories, and nobody has to fit one.
*/

export const shapeValues = [
  "hourglass",
  "pear",
  "apple",
  "rectangle",
  "inverted-triangle",
  "trapezoid",
  "unsure",
] as const;
export type Shape = (typeof shapeValues)[number];

// Which descriptors are offered for each audience, in the order shown.
export const shapesByAudience: Record<Audience, readonly Shape[]> = {
  women: ["hourglass", "pear", "apple", "rectangle", "inverted-triangle", "unsure"],
  men: ["rectangle", "trapezoid", "inverted-triangle", "pear", "apple", "unsure"],
};

export const shapeLabels: Record<Audience, Record<Shape, string>> = {
  women: {
    hourglass: "Hourglass",
    pear: "Pear or triangle",
    apple: "Apple or oval",
    rectangle: "Rectangle",
    "inverted-triangle": "Inverted triangle",
    trapezoid: "Trapezoid",
    unsure: "Not sure or another description",
  },
  men: {
    hourglass: "Hourglass",
    pear: "Triangle",
    apple: "Oval",
    rectangle: "Rectangle",
    "inverted-triangle": "Inverted triangle",
    trapezoid: "Trapezoid",
    unsure: "Not sure or another description",
  },
};

export const shapeHints: Record<Audience, Partial<Record<Shape, string>>> = {
  women: {
    hourglass: "Shoulders and hips are similar, with a defined waist",
    pear: "Hips are a little fuller than the shoulders",
    apple: "More fullness around the middle, often with slimmer legs",
    rectangle: "Shoulders, waist and hips are fairly even",
    "inverted-triangle": "Shoulders or bust are broader than the hips",
  },
  men: {
    rectangle: "Shoulders, waist and hips are fairly even",
    trapezoid: "Broad shoulders and chest tapering to the waist",
    "inverted-triangle": "Very broad shoulders and chest, with a narrower waist",
    pear: "Hips are a little fuller than the shoulders",
    apple: "More fullness around the middle",
  },
};

export const methodValues = ["known", "measurements", "sizes", "photo", "tips"] as const;
export type Method = (typeof methodValues)[number];

export const unitValues = ["cm", "in"] as const;
export type Unit = (typeof unitValues)[number];

export const fitPrefValues = ["relaxed", "regular", "tailored", "close"] as const;
export const fitPrefLabels: Record<(typeof fitPrefValues)[number], string> = {
  relaxed: "Relaxed",
  regular: "Regular",
  tailored: "Tailored",
  close: "Close-fitting",
};

export const categoryValues = ["tops", "bottoms", "dresses", "outerwear"] as const;
export type Category = (typeof categoryValues)[number];
export const categoryLabels: Record<Audience, Record<Category, string>> = {
  women: {
    tops: "Tops and shirts",
    bottoms: "Trousers and skirts",
    dresses: "Dresses and jumpsuits",
    outerwear: "Jackets and coats",
  },
  men: {
    tops: "Shirts and tops",
    bottoms: "Trousers and shorts",
    dresses: "",
    outerwear: "Jackets and coats",
  },
};
export const categoriesByAudience: Record<Audience, readonly Category[]> = {
  women: ["tops", "bottoms", "dresses", "outerwear"],
  men: ["tops", "bottoms", "outerwear"],
};

export const occasionValues = ["everyday", "work", "occasion", "travel"] as const;
export const occasionLabels: Record<(typeof occasionValues)[number], string> = {
  everyday: "Everyday",
  work: "Work",
  occasion: "Parties and occasions",
  travel: "Travel",
};

// Things the person may want their outfits to do. All optional, all preference-led.
export const focusValues = [
  "define-waist",
  "balance-proportions",
  "add-structure",
  "lengthen-line",
  "keep-easy",
] as const;
export const focusLabels: Record<(typeof focusValues)[number], string> = {
  "define-waist": "Show off my waist",
  "balance-proportions": "Balance my upper and lower halves",
  "add-structure": "Add structure and shape",
  "lengthen-line": "Create a longer, leaner line",
  "keep-easy": "Keep things easy and unfussy",
};

export const comfortValues = [
  "covered-arms",
  "longer-hemlines",
  "no-tight-waist",
  "stretch",
  "easy-movement",
] as const;
export const comfortLabels: Record<(typeof comfortValues)[number], string> = {
  "covered-arms": "Covered arms",
  "longer-hemlines": "Longer hemlines and more coverage",
  "no-tight-waist": "No tight waistbands",
  stretch: "Fabrics with some stretch",
  "easy-movement": "Easy movement",
};

// What can be measured, with plain instructions. Only a small set is ever needed.
export type MeasureKey = "shoulders" | "chest" | "waist" | "hips";

export const measureFields: Record<
  Audience,
  { key: MeasureKey; label: string; how: string; required: boolean }[]
> = {
  women: [
    { key: "chest", label: "Bust", how: "Around the fullest part of your chest, with the tape level.", required: true },
    { key: "waist", label: "Waist", how: "Around your natural waist, the narrowest part of your middle.", required: true },
    { key: "hips", label: "Hips", how: "Around the fullest part of your hips and seat, feet together.", required: true },
    { key: "shoulders", label: "Shoulder width (optional)", how: "Straight across the back, from one shoulder point to the other.", required: false },
  ],
  men: [
    { key: "chest", label: "Chest", how: "Around the fullest part of your chest, under the arms, with the tape level.", required: true },
    { key: "waist", label: "Waist", how: "Around your natural waist, just above the hip bones.", required: true },
    { key: "hips", label: "Hips (optional)", how: "Around the fullest part of your hips and seat, feet together.", required: false },
    { key: "shoulders", label: "Shoulder width (optional)", how: "Straight across the back, from one shoulder point to the other.", required: false },
  ],
};

// Usual clothing sizes, by category. These are supporting context only.
export const sizeFields: Record<Audience, { key: string; label: string }[]> = {
  women: [
    { key: "tops", label: "Tops" },
    { key: "bottoms", label: "Trousers" },
    { key: "dresses", label: "Dresses" },
  ],
  men: [
    { key: "tops", label: "Shirts and tops" },
    { key: "bottoms", label: "Trousers" },
    { key: "jackets", label: "Jackets" },
  ],
};
export const SIZE_PATTERN = /^[A-Za-z0-9 ./-]{1,12}$/;
export const sizeSuggestions = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
