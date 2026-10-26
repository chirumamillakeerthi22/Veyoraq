import { z } from "zod";
import { audienceValues, type Audience } from "@/lib/audience";
import type { PhotoName } from "@/lib/photos";

/*
  The Style Journal's articles.

  These are REFERENCES to real articles on the publishers' own sites. VEYORAQ does not
  copy or republish any article: each entry holds the facts that identify it (headline,
  publisher, author, date and link), a short summary written by VEYORAQ in its own
  words, and a cover picture from VEYORAQ's own licensed photography (never the
  publisher's image). Readers are sent to the publisher for the full text.

  How the list was made (2026-10-26): neither Who What Wear nor MR PORTER offers a public
  API or an RSS feed that can be used (the feed addresses redirect or are refused to
  automated requests, and MR PORTER refuses automated access altogether), so nothing is
  fetched automatically. Each article below was opened once in a normal browser and its
  headline, author, publication date and canonical address were read from the page's
  own metadata. Vogue, GQ, Esquire, Harper's Bazaar and others were not used because
  they could not be checked. To add an article, open it, copy those same facts, write a
  fresh summary, and add a row here; tests check that every row is well formed.
*/

export const journalCategories = [
  { id: "trends", label: "Trends" },
  { id: "color-styling", label: "Color & Styling" },
  { id: "outfit-ideas", label: "Outfit Ideas" },
  { id: "fit-silhouettes", label: "Fit & Silhouettes" },
  { id: "wardrobe-essentials", label: "Wardrobe Essentials" },
  { id: "hair-grooming", label: "Hair & Grooming" },
] as const;

export type JournalCategory = (typeof journalCategories)[number]["id"];

export const categoryLabel = Object.fromEntries(
  journalCategories.map((category) => [category.id, category.label]),
) as Record<JournalCategory, string>;

// Which website each publisher's articles must be on. A link to any other host is rejected.
export const publisherHosts = {
  "Who What Wear": "www.whowhatwear.com",
  "MR PORTER": "www.mrporter.com",
} as const;

export type Publisher = keyof typeof publisherHosts;

export type JournalArticle = {
  id: string;
  // The publisher's headline, exactly as shown on the article page.
  title: string;
  // Written by VEYORAQ, in its own words.
  summary: string;
  publisher: Publisher;
  author: string;
  // ISO dates as published. updatedAt only when the publisher shows an update.
  publishedAt: string;
  updatedAt?: string;
  // The publisher's own canonical address.
  url: string;
  category: JournalCategory;
  tags: string[];
  audience: Audience;
  // VEYORAQ's own cover photography (credited in lib/photos.ts).
  cover: PhotoName;
  featured?: boolean;
  // Content stays at the publisher; VEYORAQ only links to it.
  origin: "external-link";
};

export const articles: JournalArticle[] = [
  {
    id: "www-aw26-trends",
    title: "17 Autumn/Winter 2026 Trends That Will Define Style This Season",
    summary: "A runway-based roundup of the seventeen trends the editor expects to matter most this season, from colour-blocking to heavy texture and print.",
    publisher: "Who What Wear",
    author: "Rebecca Rhys-Evans",
    publishedAt: "2026-08-30",
    url: "https://www.whowhatwear.com/fashion/trends/autumn-winter-2026-trends",
    category: "trends",
    tags: ["trends", "autumn", "winter", "runway", "2026", "colour blocking", "texture", "prints"],
    audience: "women",
    cover: "journalOccasion",
    featured: true,
    origin: "external-link",
  },
  {
    id: "mrp-menswear-trends-2026",
    title: "6 Menswear Trends To Invest In For 2026",
    summary: "Six trends worth building a wardrobe around this year, including straight-leg trousers, small watches and brown.",
    publisher: "MR PORTER",
    author: "Ashley Ogawa Clarke",
    publishedAt: "2026-01-05",
    url: "https://www.mrporter.com/en-us/journal/fashion/menswear-trends-25148076",
    category: "trends",
    tags: ["trends", "2026", "trousers", "watches", "brown", "investment pieces"],
    audience: "men",
    cover: "menJournalSilhouette",
    origin: "external-link",
  },
  {
    id: "www-color-analysis-black",
    title: "I Mostly Wear Black—Here's What Happened When I Got My Colors Read",
    summary: "A writer who rarely strays from black books a personal colour analysis and reports what she learned about the shades that suit her.",
    publisher: "Who What Wear",
    author: "Audry Hiaoui",
    publishedAt: "2025-06-20",
    url: "https://www.whowhatwear.com/fashion/shopping/warm-spring-autumn-color-palette-analysis-dressing",
    category: "color-styling",
    tags: ["color analysis", "colour analysis", "seasonal color", "palette", "undertone", "personal color"],
    audience: "women",
    cover: "colour",
    origin: "external-link",
  },
  {
    id: "mrp-colour-analysis-revival",
    title: "How The Revival Of Colour Analysis Can Revolutionise Your Wardrobe",
    summary: "Experts explain how knowing your undertone can guide the shades you wear and help you look and feel your best.",
    publisher: "MR PORTER",
    author: "Mr Ben Olsen",
    publishedAt: "2023-08-31",
    url: "https://www.mrporter.com/en-us/journal/fashion/colour-analysis-style-personal-seasonal-color-theory-guide-men-24495470",
    category: "color-styling",
    tags: ["color analysis", "colour analysis", "undertone", "seasonal color", "palette", "color theory"],
    audience: "men",
    cover: "menJournalColour",
    origin: "external-link",
  },
  {
    id: "mrp-wearing-colour",
    title: "The Modern Man’s Guide To Wearing Colour",
    summary: "A long guide to wearing colour as a man, from dressing tonally to choosing shades that suit your complexion.",
    publisher: "MR PORTER",
    author: "Mr Adam Welch",
    publishedAt: "2021-03-28",
    url: "https://www.mrporter.com/en-us/journal/fashion/how-to-wear-more-colour-modern-men-style-guide-1750416",
    category: "color-styling",
    tags: ["color combinations", "colour combinations", "tonal", "complexion", "colour"],
    audience: "men",
    cover: "menJournalEveryday",
    origin: "external-link",
  },
  {
    id: "mrp-size-and-fit",
    title: "Five Easy Hacks To Find Your Perfect Size And Fit",
    summary: "Expert tips for getting menswear size and fit right, including why chest size alone is not enough.",
    publisher: "MR PORTER",
    author: "Finlay Renwick",
    publishedAt: "2026-04-23",
    url: "https://www.mrporter.com/en-us/journal/fashion/size-fit-guide-for-men-25470076",
    category: "fit-silhouettes",
    tags: ["fit", "size", "tailoring", "proportion", "shoulders", "silhouette", "body proportions"],
    audience: "men",
    cover: "fitTape",
    featured: true,
    origin: "external-link",
  },
  {
    id: "www-denim-body-type",
    title: "The Best Denim for Your Body Type",
    summary: "A denim designer's advice on the most flattering jean styles for different body types.",
    publisher: "Who What Wear",
    author: "Bobby Schuessler",
    publishedAt: "2016-01-14",
    updatedAt: "2019-08-14",
    url: "https://www.whowhatwear.com/best-denim-for-body-type",
    category: "fit-silhouettes",
    tags: ["jeans", "denim", "fit", "body type", "body proportions", "silhouette"],
    audience: "women",
    cover: "journalSilhouette",
    origin: "external-link",
  },
  {
    id: "www-capsule-essentials",
    title: "These Smart Capsule-Wardrobe Essentials Will Always Work Hard for You",
    summary: "A no-nonsense edit of the staples a capsule wardrobe is built around.",
    publisher: "Who What Wear",
    author: "Maxine Eggenberger",
    publishedAt: "2025-01-30",
    updatedAt: "2025-02-07",
    url: "https://www.whowhatwear.com/fashion/capsule-wardrobe-essentials",
    category: "wardrobe-essentials",
    tags: ["capsule wardrobe", "essentials", "basics", "staples", "wardrobe"],
    audience: "women",
    cover: "journalEveryday",
    origin: "external-link",
  },
  {
    id: "www-closet-carbon-footprint",
    title: "The Beginner's Guide to Cutting Your Closet's Carbon Footprint",
    summary: "Two experts explain how shopping habits affect the environment and offer ways to shrink your closet's footprint.",
    publisher: "Who What Wear",
    author: "Jasmine Fox-Suliaman",
    publishedAt: "2020-02-25",
    updatedAt: "2021-04-19",
    url: "https://www.whowhatwear.com/how-to-build-a-sustainable-wardrobe",
    category: "wardrobe-essentials",
    tags: ["sustainable fashion", "sustainability", "carbon footprint", "shopping", "wardrobe"],
    audience: "women",
    cover: "journalColour",
    origin: "external-link",
  },
  {
    id: "mrp-sustainable-wardrobe",
    title: "10 Small Steps Towards A More Sustainable Wardrobe",
    summary: "Ten approachable ways to shop for and wear clothes more sustainably.",
    publisher: "MR PORTER",
    author: "The MR PORTER Team",
    publishedAt: "2021-04-22",
    url: "https://www.mrporter.com/en-us/journal/fashion/sustainable-menswear-wardrobe-environmentally-friendly-1835196",
    category: "wardrobe-essentials",
    tags: ["sustainable fashion", "sustainability", "ethical", "shopping", "wardrobe"],
    audience: "men",
    cover: "menJournalTexture",
    origin: "external-link",
  },
  {
    id: "www-casual-work-outfits",
    title: "15 Casual Work Outfits That Make Office Dressing Feel Downright Effortless",
    summary: "Fifteen outfit ideas that make getting dressed for a relaxed office feel easy.",
    publisher: "Who What Wear",
    author: "Anna LaPlaca",
    publishedAt: "2022-09-06",
    updatedAt: "2025-04-04",
    url: "https://www.whowhatwear.com/casual-work-outfits",
    category: "outfit-ideas",
    tags: ["workwear", "office", "casual", "work outfits", "business casual"],
    audience: "women",
    cover: "everyday",
    origin: "external-link",
  },
  {
    id: "mrp-return-to-the-office",
    title: "How To Return To The Office In Style",
    summary: "Stylist Derek Guy shares a dependable formula for dressing well at work.",
    publisher: "MR PORTER",
    author: "Derek Guy",
    publishedAt: "2025-09-05",
    url: "https://www.mrporter.com/en-us/journal/fashion/stylish-workwear-mens-25325350",
    category: "outfit-ideas",
    tags: ["workwear", "office", "tailoring", "work outfits", "formula"],
    audience: "men",
    cover: "menMinimal",
    origin: "external-link",
  },
  {
    id: "www-wedding-guest",
    title: "Your Ultimate Guide for Being the Best Dressed Wedding Guest",
    summary: "A guide to what to wear as a wedding guest, from black tie to the beach.",
    publisher: "Who What Wear",
    author: "Nicole Akhtarzad Eshaghpour",
    publishedAt: "2025-07-23",
    updatedAt: "2025-09-16",
    url: "https://www.whowhatwear.com/wedding-guest-attire-editor-approved-guide",
    category: "outfit-ideas",
    tags: ["occasion", "party", "wedding guest", "dress code", "formal", "event"],
    audience: "women",
    cover: "occasion",
    origin: "external-link",
  },
  {
    id: "mrp-wedding-dress-codes",
    title: "The Definitive Dos And Don’ts Of Wedding Dress Codes For Men",
    summary: "Answers to the common questions about men's wedding dress codes, from ties and shoes to beach weddings.",
    publisher: "MR PORTER",
    author: "Teo van den Broeke",
    publishedAt: "2024-04-23",
    url: "https://www.mrporter.com/en-us/journal/fashion/dos-donts-wedding-dress-code-men-24955878",
    category: "outfit-ideas",
    tags: ["occasion", "party", "wedding", "dress code", "suit", "formal", "event"],
    audience: "men",
    cover: "menOccasion",
    origin: "external-link",
  },
  {
    id: "www-hair-trends-2026",
    title: "The Experts Have Spoken: These 7 Hair Trends Will Dominate 2026",
    summary: "Hairstylists name the seven hair trends they expect to be big in 2026, from the next colour trend to styling a bob.",
    publisher: "Who What Wear",
    author: "Eleanor Vousden",
    publishedAt: "2025-12-19",
    url: "https://www.whowhatwear.com/beauty/hair/hair-trends-2026",
    category: "hair-grooming",
    tags: ["hair", "haircut", "hair color", "hair colour", "bob", "trends", "2026"],
    audience: "women",
    cover: "hair",
    origin: "external-link",
  },
  {
    id: "mrp-thick-hair",
    title: "A Man’s Guide To Managing Thick Hair",
    summary: "Having thick hair is not always easy: advice on taming and styling it.",
    publisher: "MR PORTER",
    author: "Mr Hikmat Mohammed",
    publishedAt: "2021-06-29",
    url: "https://www.mrporter.com/en-us/journal/grooming/men-how-to-manage-thick-hair-2037244",
    category: "hair-grooming",
    tags: ["hair", "grooming", "thick hair", "haircut", "men's grooming"],
    audience: "men",
    cover: "menHair",
    origin: "external-link",
  },
];

/* ---------- Checks (also run in the tests) ---------- */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const articleSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().trim().min(5).max(160),
    summary: z.string().trim().min(20).max(220),
    publisher: z.enum(Object.keys(publisherHosts) as [Publisher, ...Publisher[]]),
    author: z.string().trim().min(2).max(80),
    publishedAt: isoDate,
    updatedAt: isoDate.optional(),
    url: z.string().url(),
    category: z.enum(journalCategories.map((c) => c.id) as [JournalCategory, ...JournalCategory[]]),
    tags: z.array(z.string().trim().min(2).max(40)).min(1).max(12),
    audience: z.enum(audienceValues),
    cover: z.string().min(1),
    featured: z.boolean().optional(),
    origin: z.literal("external-link"),
  })
  .strict();

// Returns a list of problems; empty means the dataset is sound.
export function checkArticles(list: JournalArticle[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const urls = new Set<string>();
  for (const article of list) {
    const parsed = articleSchema.safeParse(article);
    if (!parsed.success) {
      problems.push(`${article.id}: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      continue;
    }
    if (seen.has(article.id)) problems.push(`${article.id}: duplicate id`);
    seen.add(article.id);
    if (urls.has(article.url)) problems.push(`${article.id}: duplicate url`);
    urls.add(article.url);
    const url = new URL(article.url);
    if (url.protocol !== "https:") problems.push(`${article.id}: link must be https`);
    if (url.hostname !== publisherHosts[article.publisher]) {
      problems.push(`${article.id}: link is not on ${publisherHosts[article.publisher]}`);
    }
    if (article.updatedAt && article.updatedAt < article.publishedAt) {
      problems.push(`${article.id}: updated before published`);
    }
  }
  return problems;
}

/* ---------- Reading the list ---------- */

const newestFirst = (a: JournalArticle, b: JournalArticle) =>
  b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id);

export function articlesFor(audience: Audience, list: JournalArticle[] = articles): JournalArticle[] {
  return list.filter((article) => article.audience === audience).sort(newestFirst);
}

// A fixed, locale-independent date such as "20 Jun 2025", so server and browser agree.
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatJournalDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${months[month - 1]} ${year}`;
}

// The articles for the homepage: the featured one first, then the newest others.
export function homeArticles(audience: Audience, count = 5, list: JournalArticle[] = articles): JournalArticle[] {
  const mine = articlesFor(audience, list);
  const featured = mine.find((article) => article.featured) ?? mine[0];
  if (!featured) return [];
  return [featured, ...mine.filter((article) => article !== featured)].slice(0, count);
}

// Fit-related reading for the Fit Guidance page.
export function fitArticles(audience: Audience, list: JournalArticle[] = articles): JournalArticle[] {
  const wanted: JournalCategory[] = ["fit-silhouettes", "wardrobe-essentials", "color-styling"];
  return wanted
    .map((category) => articlesFor(audience, list).find((article) => article.category === category))
    .filter((article): article is JournalArticle => Boolean(article));
}
