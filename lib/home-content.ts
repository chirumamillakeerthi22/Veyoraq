import type { Audience } from "@/lib/audience";
import type { PhotoName } from "@/lib/photos";

/*
  The homepage content that depends on the selected audience. Each audience has its
  own photography and copy, so one audience's images are never used to represent the
  other. Genuinely shared content (the brand line, how it works, the closing call to
  action) stays in app/page.tsx.

  The pictures are editorial inspiration, not products. No catalogue is connected,
  so nothing here claims a product, price or availability.
*/

export type HomeLook = {
  title: string;
  text: string;
  photo: PhotoName;
  sizes: string;
  layout: string;
  frame: string;
};

export type HomeArticle = {
  topic: string;
  title: string;
  text: string;
  photo: PhotoName;
};

export type HomeContent = {
  heroText: string;
  heroPhoto: PhotoName;
  heroPosition: string;
  discover: { photo: PhotoName; text: string };
  hair: { photo: PhotoName; text: string };
  moreText: string;
  looksHeading: { pre: string; em: string };
  looksNote: string;
  looks: HomeLook[];
  fix: { photo: PhotoName };
  articles: HomeArticle[];
};

const lookLayouts = [
  { sizes: "(min-width: 768px) 40vw, 100vw", layout: "col-span-2 md:col-span-5", frame: "aspect-[4/5]" },
  { sizes: "(min-width: 768px) 32vw, 50vw", layout: "md:col-span-4 md:mt-28", frame: "aspect-[3/4]" },
  { sizes: "(min-width: 768px) 24vw, 50vw", layout: "md:col-span-3 md:mt-12", frame: "aspect-[3/4]" },
];

export const homeContent: Record<Audience, HomeContent> = {
  women: {
    heroText: "Find your personal style and get outfit ideas that fit your taste and budget.",
    heroPhoto: "hero",
    heroPosition: "50% 20%",
    discover: {
      photo: "colour",
      text: "A short quiz that turns your taste, colours and occasions into outfit ideas.",
    },
    hair: { photo: "hair", text: "Preview four new hairstyles on your own photo." },
    moreText:
      "FIX My Style, Color Analysis, the Journal and fit guidance. See what is ready and what is on its way.",
    looksHeading: { pre: "Three moods, ", em: "ready to shop." },
    looksNote:
      "Editorial inspiration only. These images are not products for sale, and Shop has no women’s products connected yet.",
    looks: [
      { title: "Effortless Everyday", text: "Soft layers and easy shapes for the days in between.", photo: "everyday", ...lookLayouts[0] },
      { title: "Modern Minimal", text: "Clean lines, quiet colour, nothing unnecessary.", photo: "minimal", ...lookLayouts[1] },
      { title: "Elevated Occasion", text: "Considered pieces for moments worth dressing for.", photo: "occasion", ...lookLayouts[2] },
    ],
    fix: { photo: "flatLay" },
    articles: [
      { topic: "Colour", title: "Finding the colours you love to wear", text: "A gentle way to notice which shades you reach for, and how to build on them.", photo: "journalColour" },
      { topic: "Proportion", title: "Styling silhouettes and proportions", text: "Simple ways to balance shapes, lengths and layers so an outfit feels right to you.", photo: "journalSilhouette" },
      { topic: "Texture", title: "Creating outfits with prints and textures", text: "How to mix knits, weaves and patterns without overthinking it.", photo: "journalTexture" },
      { topic: "Everyday", title: "Building versatile everyday looks", text: "A handful of pieces, combined well, that carry you through the week.", photo: "journalEveryday" },
      { topic: "Occasion", title: "Dressing for different occasions", text: "From relaxed gatherings to formal evenings: starting points for what to wear.", photo: "journalOccasion" },
    ],
  },
  men: {
    heroText: "Find your personal style and get menswear ideas that fit your taste and budget.",
    heroPhoto: "menCoat",
    heroPosition: "50% 25%",
    discover: {
      photo: "menRelaxed",
      text: "A short quiz that turns your taste, colours and occasions into menswear ideas.",
    },
    hair: { photo: "menHair", text: "Preview four new haircuts and styles on your own photo." },
    moreText:
      "FIX My Style, Color Analysis, the Journal and fit guidance. See what is ready and what is on its way.",
    looksHeading: { pre: "Three moods, ", em: "ready to shop." },
    looksNote:
      "Editorial inspiration only. These images are not products for sale, and Shop has no men’s products connected yet.",
    looks: [
      { title: "Effortless Everyday", text: "Easy knits and relaxed shapes for the days in between.", photo: "menEveryday", ...lookLayouts[0] },
      { title: "Modern Minimal", text: "Clean lines, quiet colour, nothing unnecessary.", photo: "menMinimal", ...lookLayouts[1] },
      { title: "Elevated Occasion", text: "Sharp tailoring for moments worth dressing for.", photo: "menOccasion", ...lookLayouts[2] },
    ],
    fix: { photo: "menFlatLay" },
    articles: [
      { topic: "Colour", title: "Finding the colours you love to wear", text: "A gentle way to notice which shades you reach for, and how to build on them.", photo: "menJournalColour" },
      { topic: "Proportion", title: "Tailoring, fit and proportion", text: "Simple ways to balance shoulders, length and taper so an outfit feels right to you.", photo: "menJournalSilhouette" },
      { topic: "Texture", title: "Knits, weaves and layering", text: "How to mix textures and layers without overthinking it.", photo: "menJournalTexture" },
      { topic: "Everyday", title: "Building versatile everyday looks", text: "A handful of pieces, combined well, that carry you through the week.", photo: "menJournalEveryday" },
      { topic: "Occasion", title: "Dressing for different occasions", text: "From relaxed gatherings to formal evenings: starting points for what to wear.", photo: "menJournalOccasion" },
    ],
  },
};

/*
  The Journal teasers most relevant to fit, for the audience. The Journal is a preview
  (no articles are published yet), so these are the same teasers shown on the
  homepage, never separate or invented articles.
*/
export function fitJournalPicks(audience: Audience): HomeArticle[] {
  const { articles } = homeContent[audience];
  return ["Proportion", "Everyday", "Colour"]
    .map((topic) => articles.find((article) => article.topic === topic))
    .filter((article): article is HomeArticle => Boolean(article));
}
