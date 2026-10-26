import Link from "next/link";
import { ArticleCard } from "@/components/journal/article-card";
import { PerAudience } from "@/components/per-audience";
import { fitArticles } from "@/lib/journal/articles";
import { journalHref } from "@/lib/navigation";

/*
  A short, secondary Style Journal section for people who want to read more. It uses
  the same real, attributed articles as the Journal (chosen for fit, wardrobe and
  colour) and follows the audience chosen in My Account. Each card opens the original
  article on the publisher's site.
*/
export function FitJournal() {
  return (
    <section aria-labelledby="fit-journal-heading" className="border-t border-sand pt-10">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-burgundy">Style Journal</p>
      <h2 id="fit-journal-heading" className="mt-2 font-display text-3xl leading-tight md:text-4xl">
        Keep learning.
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-stone">
        Articles from fashion publishers on fit, wardrobe building and colour. They open on the
        publisher&rsquo;s own site.{" "}
        <Link href={journalHref} className="underline underline-offset-4">
          Browse the whole Journal
        </Link>
        .
      </p>

      <PerAudience>
        {(audience) => (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {fitArticles(audience).map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        )}
      </PerAudience>
    </section>
  );
}
