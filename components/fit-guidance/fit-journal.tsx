import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { PerAudience } from "@/components/per-audience";
import { fitJournalPicks } from "@/lib/home-content";

/*
  A short, secondary Style Journal section for people who want to read more. It
  reuses the Journal teasers that already exist (the same content as the homepage),
  chosen for fit, proportion and everyday dressing, and follows the audience chosen in
  My Account. The Journal is a preview, so the cards lead to its homepage section and
  say plainly that full articles are not published yet.
*/
export function FitJournal() {
  return (
    <section aria-labelledby="fit-journal-heading" className="border-t border-sand pt-10">
      <p className="text-xs uppercase tracking-[0.22em] text-stone">Style Journal</p>
      <h2 id="fit-journal-heading" className="mt-2 font-display text-3xl leading-tight md:text-4xl">
        Keep learning.
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-stone">
        A preview of guides we are writing on fit, proportion and everyday dressing. The Journal
        isn&rsquo;t published yet, so there are no full articles to open.
      </p>

      <PerAudience>
        {(audience) => (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {fitJournalPicks(audience).map((article) => (
              <li key={article.title}>
                <Link
                  href="/#style-journal"
                  className="group block h-full overflow-hidden rounded-lg border border-sand bg-soft-white transition-colors duration-200 hover:border-espresso/40"
                >
                  <CoverImage
                    name={article.photo}
                    icon="journal"
                    sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
                    className="aspect-[4/3] w-full"
                    position="50% 30%"
                  />
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-stone">
                      {article.topic} · Preview
                    </p>
                    <h3 className="mt-2 font-display text-2xl leading-7">{article.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone">{article.text}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PerAudience>
    </section>
  );
}
