"use client";

import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/journal/article-card";
import { audienceLabels } from "@/lib/audience";
import { journalCategories, type JournalArticle, type JournalCategory } from "@/lib/journal/articles";
import { countByCategory, searchArticles } from "@/lib/journal/search";
import { useAudience } from "@/lib/use-audience";

const suggestions = ["color analysis", "workwear", "capsule wardrobe", "fit", "party", "hair", "sustainable"];

const chip =
  "inline-flex min-h-11 items-center gap-2 border px-4 text-sm transition-colors duration-200";

/*
  The searchable Journal. Search, the category filter and the audience scope combine.
  By default it shows articles for the audience chosen in My Account, with one tap to see
  both. Everything shown comes from the article dataset; nothing is generated.
*/
export function JournalBrowser({ articles }: { articles: JournalArticle[] }) {
  const audience = useAudience();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<JournalCategory | "all">("all");
  const [showAll, setShowAll] = useState(false);

  const scope = showAll ? "all" : audience;
  const result = useMemo(
    () => searchArticles(articles, { query, category, audience: scope }),
    [articles, query, category, scope],
  );
  const counts = useMemo(() => countByCategory(articles, query, scope), [articles, query, scope]);

  if (articles.length === 0) {
    return (
      <p role="alert" className="mt-10 max-w-xl border border-espresso p-5 leading-7">
        The Journal has no articles configured yet, so there is nothing to show. Please check back
        soon.
      </p>
    );
  }

  const filtering = query.trim() !== "" || category !== "all";
  const featured = !filtering ? result.articles.find((article) => article.featured) : undefined;
  const rest = featured ? result.articles.filter((article) => article !== featured) : result.articles;
  const otherAudienceHits = result.matchesInAll - (showAll ? result.articles.length : result.articles.length);
  const label = showAll ? "everyone" : audienceLabels[audience];

  function clearAll() {
    setQuery("");
    setCategory("all");
  }

  return (
    <div>
      <form role="search" onSubmit={(event) => event.preventDefault()} className="mt-8 max-w-2xl">
        <label htmlFor="journal-search" className="text-sm font-medium">
          Search the Journal
        </label>
        <div className="relative mt-2">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="6.500" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            id="journal-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={80}
            autoComplete="off"
            placeholder="Try “color analysis”, “workwear” or “capsule wardrobe”"
            className="min-h-14 w-full border border-espresso/30 bg-soft-white pl-12 pr-24 text-base placeholder:text-stone/70 focus:border-burgundy"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 inline-flex min-h-11 -translate-y-1/2 items-center px-3 text-sm text-burgundy underline underline-offset-4"
            >
              Clear
              <span className="sr-only"> search</span>
            </button>
          )}
        </div>
        {!query && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Search ideas">
            {suggestions.map((idea) => (
              <li key={idea}>
                <button
                  type="button"
                  onClick={() => setQuery(idea)}
                  className="inline-flex min-h-11 items-center border border-sand bg-soft-white px-3 text-sm text-stone transition-colors duration-200 hover:border-burgundy/40 hover:text-burgundy"
                >
                  {idea}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div role="group" aria-label="Categories" className="flex flex-wrap gap-2">
          {[{ id: "all" as const, label: "All" }, ...journalCategories].map((item) => {
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(item.id)}
                className={`${chip} ${
                  active ? "border-burgundy bg-burgundy text-ivory" : "border-sand bg-soft-white hover:border-burgundy/40"
                }`}
              >
                {item.label}
                <span className={`text-xs ${active ? "text-ivory/80" : "text-stone"}`}>{counts[item.id] ?? 0}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-pressed={showAll}
          onClick={() => setShowAll((value) => !value)}
          className={`${chip} self-start border-sand bg-soft-white hover:border-espresso/40`}
        >
          {showAll ? "Showing women’s and men’s" : `Showing ${audienceLabels[audience]}’s`}
          <span className="text-xs text-burgundy underline underline-offset-4">{showAll ? `Only ${audienceLabels[audience]}` : "Show both"}</span>
        </button>
      </div>

      <p role="status" aria-live="polite" className="mt-6 text-sm text-stone">
        {result.articles.length === 0
          ? "No articles match."
          : `${result.articles.length} ${result.articles.length === 1 ? "article" : "articles"}${
              query.trim() ? ` for “${query.trim()}”` : ""
            }${category !== "all" ? ` in ${journalCategories.find((c) => c.id === category)?.label}` : ""}${
              showAll ? "" : ` for ${label}`
            }.`}
      </p>

      {featured && (
        <section aria-label="Featured article" className="mt-4">
          <ArticleCard article={featured} variant="featured" />
        </section>
      )}

      {rest.length > 0 && (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {rest.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}

      {result.articles.length === 0 && (
        <div className="mt-4 max-w-xl border border-dashed border-espresso/40 bg-soft-white p-6">
          <p className="font-display text-2xl leading-8">Nothing found{query.trim() ? ` for “${query.trim()}”` : ""}.</p>
          <p className="mt-2 leading-7 text-stone">
            {!showAll && otherAudienceHits > 0
              ? `There ${otherAudienceHits === 1 ? "is 1 match" : `are ${otherAudienceHits} matches`} in the other audience’s articles.`
              : "We only show real articles from our list, so there may simply not be one on that yet. Try a broader word, or browse a category."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {!showAll && otherAudienceHits > 0 && (
              <button type="button" onClick={() => setShowAll(true)} className="inline-flex min-h-11 items-center bg-burgundy px-5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-burgundy-deep">
                Show both
              </button>
            )}
            <button type="button" onClick={clearAll} className="inline-flex min-h-11 items-center border border-espresso/30 px-5 text-xs font-medium uppercase tracking-[0.14em] hover:border-espresso">
              Clear search and filters
            </button>
          </div>
        </div>
      )}

      <p className="mt-12 max-w-2xl border-t border-sand pt-6 text-xs leading-5 text-stone">
        Every article is written and published by the publisher named on it; open it to read the
        full text on their site. VEYORAQ shows the headline, author and date, adds its own short
        summary, and does not reproduce the articles. Cover photos are VEYORAQ&rsquo;s own editorial
        photography, not the publishers&rsquo; images.
      </p>
    </div>
  );
}
