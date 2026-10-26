import type { Audience } from "@/lib/audience";
import { categoryLabel, type JournalArticle, type JournalCategory } from "./articles";

/*
  Searching the Journal's own dataset. It looks only at what the articles actually
  contain (title, summary, category, tags, publisher and author), so every result is a
  real entry and nothing is ever invented. It runs instantly in the browser on a small
  list, so there is no need to wait (debounce) before searching.
*/

const STOPWORDS = new Set(["a", "an", "and", "the", "for", "to", "of", "in", "on", "how", "what", "my", "me", "your", "with"]);

// Everyday search words that mean the same thing as words used in the articles.
const SYNONYMS: Record<string, string[]> = {
  workwear: ["office", "business"],
  party: ["occasion", "wedding", "event", "formal"],
  occasion: ["wedding", "party", "event", "formal"],
  grooming: ["hair", "haircut"],
  capsule: ["essentials", "staples", "basics"],
  essentials: ["capsule", "staples", "basics"],
  proportions: ["proportion", "fit", "silhouette"],
  proportion: ["proportions", "fit", "silhouette"],
  silhouettes: ["silhouette", "fit"],
  sustainable: ["sustainability", "ethical", "carbon"],
  casual: ["everyday", "relaxed"],
  shopping: ["shop", "buy", "wardrobe"],
  hairstyle: ["hair", "haircut"],
  hairstyles: ["hair", "haircut"],
};

// Normalises spelling and possessives so "Men's", "mens" and "men" all match.
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/colour/g, "color")
    .replace(/[’']s\b/g, "")
    .replace(/[’']/g, "")
    .replace(/\bmens\b/g, "men")
    .replace(/\bwomens\b/g, "women")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenise(text: string): string[] {
  return normalise(text)
    .split(" ")
    .filter((word) => word.length > 0 && !STOPWORDS.has(word));
}

type Field = { words: string[]; weight: number };

function fieldsOf(article: JournalArticle): Field[] {
  return [
    { words: tokenise(article.title), weight: 6 },
    { words: article.tags.flatMap(tokenise), weight: 5 },
    { words: tokenise(categoryLabel[article.category]), weight: 4 },
    { words: tokenise(article.summary), weight: 2 },
    { words: tokenise(`${article.publisher} ${article.author}`), weight: 1 },
    // The audience is searchable too ("men", "women").
    { words: [article.audience], weight: 3 },
  ];
}

const matchesWord = (word: string, query: string) => word === query || (query.length >= 3 && word.startsWith(query));

/*
  A score for one query word: the best weight among the fields containing it (or a word
  meaning the same). Zero means the article does not match that word.
*/
function wordScore(fields: Field[], queryWord: string): number {
  const alternatives = [queryWord, ...(SYNONYMS[queryWord] ?? [])];
  let best = 0;
  for (const field of fields) {
    for (const [index, alternative] of alternatives.entries()) {
      if (field.words.some((word) => matchesWord(word, alternative))) {
        // A synonym counts for a little less than the exact word.
        best = Math.max(best, index === 0 ? field.weight : field.weight * 0.6);
      }
    }
  }
  return best;
}

export type SearchOptions = {
  query: string;
  category: JournalCategory | "all";
  // Limit to one audience, or "all" to include both.
  audience: Audience | "all";
};

export type SearchResult = {
  articles: JournalArticle[];
  // How many articles match the text and category in total across both audiences.
  matchesInAll: number;
};

const newestFirst = (a: JournalArticle, b: JournalArticle) =>
  b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id);

function run(list: JournalArticle[], words: string[], category: SearchOptions["category"]): { article: JournalArticle; score: number }[] {
  const out: { article: JournalArticle; score: number }[] = [];
  for (const article of list) {
    if (category !== "all" && article.category !== category) continue;
    if (words.length === 0) {
      out.push({ article, score: 0 });
      continue;
    }
    const fields = fieldsOf(article);
    let total = 0;
    let matchedAll = true;
    for (const word of words) {
      const score = wordScore(fields, word);
      if (score === 0) {
        matchedAll = false;
        break;
      }
      total += score;
    }
    if (matchedAll) out.push({ article, score: total });
  }
  return out;
}

// Every query word must match (so more words narrow the results), best matches first.
export function searchArticles(list: JournalArticle[], options: SearchOptions): SearchResult {
  const words = tokenise(options.query);
  const everywhere = run(list, words, options.category);
  const scoped =
    options.audience === "all" ? everywhere : everywhere.filter((entry) => entry.article.audience === options.audience);

  scoped.sort((a, b) => b.score - a.score || newestFirst(a.article, b.article));
  return { articles: scoped.map((entry) => entry.article), matchesInAll: everywhere.length };
}

export function countByCategory(
  list: JournalArticle[],
  query: string,
  audience: Audience | "all",
): Record<JournalCategory | "all", number> {
  const counts = { all: 0 } as Record<JournalCategory | "all", number>;
  const categories = new Set(list.map((article) => article.category));
  for (const category of categories) {
    counts[category] = searchArticles(list, { query, category, audience }).articles.length;
  }
  counts.all = searchArticles(list, { query, category: "all", audience }).articles.length;
  return counts;
}
