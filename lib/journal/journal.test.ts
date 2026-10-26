import { describe, expect, it } from "vitest";
import {
  articles,
  articlesFor,
  checkArticles,
  fitArticles,
  formatJournalDate,
  homeArticles,
  journalCategories,
  type JournalArticle,
} from "./articles";
import { countByCategory, normalise, searchArticles, tokenise } from "./search";

const titles = (list: JournalArticle[]) => list.map((a) => a.id);
const find = (query: string, extra: Partial<Parameters<typeof searchArticles>[1]> = {}) =>
  searchArticles(articles, { query, category: "all", audience: "all", ...extra });

describe("the article dataset", () => {
  it("is well formed: valid fields, unique ids and links, and links on the publisher's own site", () => {
    expect(checkArticles(articles)).toEqual([]);
  });

  it("rejects a link to the wrong site, an insecure link and duplicates", () => {
    const first = articles[0];
    expect(checkArticles([{ ...first, url: "https://example.com/a" }])).toEqual([expect.stringContaining("is not on")]);
    expect(checkArticles([{ ...first, url: "http://www.whowhatwear.com/a" }]).join()).toMatch(/https/);
    expect(checkArticles([first, first]).join()).toMatch(/duplicate/);
  });

  it("only ever links out: no VEYORAQ-hosted article text", () => {
    expect(articles.every((a) => a.origin === "external-link")).toBe(true);
  });

  it("covers every category for each audience, so no filter is ever empty", () => {
    for (const audience of ["women", "men"] as const) {
      for (const category of journalCategories) {
        expect(articlesFor(audience).some((a) => a.category === category.id)).toBe(true);
      }
    }
  });
});

describe("normalising and tokenising", () => {
  it("treats colour/color and men's/mens/men alike and drops filler words", () => {
    expect(normalise("Colour")).toBe("color");
    expect(normalise("Men’s styling")).toBe("men styling");
    expect(normalise("mens")).toBe("men");
    expect(tokenise("How to wear the colour")).toEqual(["wear", "color"]);
  });
});

describe("searchArticles", () => {
  it("finds colour analysis under either spelling, in both audiences", () => {
    expect(titles(find("color analysis").articles).sort()).toEqual(
      ["mrp-colour-analysis-revival", "www-color-analysis-black"].sort(),
    );
    expect(titles(find("colour analysis").articles)).toHaveLength(2);
  });

  it("matches tags, categories and everyday synonyms", () => {
    expect(titles(find("workwear").articles).sort()).toEqual(["mrp-return-to-the-office", "www-casual-work-outfits"]);
    expect(titles(find("capsule wardrobe").articles)).toContain("www-capsule-essentials");
    expect(titles(find("sustainable").articles)).toHaveLength(2);
    expect(titles(find("party").articles).sort()).toEqual(["mrp-wedding-dress-codes", "www-wedding-guest"]);
    expect(titles(find("grooming").articles).sort()).toEqual(["mrp-thick-hair", "www-hair-trends-2026"]);
    expect(titles(find("body proportions").articles)).toContain("mrp-size-and-fit");
  });

  it("understands audience words", () => {
    expect(find("men's styling").articles.every((a) => a.audience === "men")).toBe(true);
    expect(find("women").articles.every((a) => a.audience === "women")).toBe(true);
  });

  it("narrows with more words and never invents a match", () => {
    expect(find("color analysis men").articles.map((a) => a.id)).toEqual(["mrp-colour-analysis-revival"]);
    expect(find("zzzz nonexistent").articles).toEqual([]);
    expect(find("submarine").articles).toEqual([]);
  });

  it("combines text with a category and an audience", () => {
    expect(titles(find("2026", { category: "trends" }).articles).sort()).toEqual(["mrp-menswear-trends-2026", "www-aw26-trends"]);
    expect(titles(find("", { category: "hair-grooming", audience: "men" }).articles)).toEqual(["mrp-thick-hair"]);
  });

  it("with no query returns everything in scope, newest first", () => {
    const all = find("").articles;
    expect(all).toHaveLength(articles.length);
    const dates = all.map((a) => a.publishedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("reports matches in the other audience so the page can offer them", () => {
    const result = find("color analysis", { audience: "women" });
    expect(result.articles).toHaveLength(1);
    expect(result.matchesInAll).toBe(2);
  });

  it("counts articles per category for the filter chips", () => {
    const counts = countByCategory(articles, "", "all");
    expect(counts.all).toBe(articles.length);
    expect(counts["outfit-ideas"]).toBe(4);
  });
});

describe("reading the list", () => {
  it("formats dates the same everywhere", () => {
    expect(formatJournalDate("2025-06-20")).toBe("20 Jun 2025");
    expect(formatJournalDate("2026-01-05")).toBe("5 Jan 2026");
  });

  it("puts a featured article first on the homepage, only for that audience", () => {
    const women = homeArticles("women");
    expect(women[0].id).toBe("www-aw26-trends");
    expect(women.every((a) => a.audience === "women")).toBe(true);
    expect(homeArticles("men").every((a) => a.audience === "men")).toBe(true);
  });

  it("offers fit-related reading for the audience", () => {
    expect(fitArticles("men").map((a) => a.category)).toEqual(["fit-silhouettes", "wardrobe-essentials", "color-styling"]);
    expect(fitArticles("women").every((a) => a.audience === "women")).toBe(true);
  });
});
