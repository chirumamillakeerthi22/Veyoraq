import { CoverImage } from "@/components/cover-image";
import { categoryLabel, formatJournalDate, type JournalArticle } from "@/lib/journal/articles";

/*
  One Journal article. The whole card is a link to the ORIGINAL article on the
  publisher's own site, opened in a new tab and clearly marked as external. VEYORAQ
  shows the publisher's headline, author and date, its own short summary, and its own
  cover photography; it does not reproduce the article.
*/

function ExternalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="inline h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4.500 2H2v8h8V7.500M7 2h3v3M10 2 5.500 6.500" />
    </svg>
  );
}

function Byline({ article }: { article: JournalArticle }) {
  return (
    <p className="text-xs leading-5 text-stone">
      <span className="font-medium text-espresso">{article.publisher}</span>
      <span aria-hidden="true"> · </span>
      {article.author}
      <span aria-hidden="true"> · </span>
      <time dateTime={article.publishedAt}>{formatJournalDate(article.publishedAt)}</time>
    </p>
  );
}

export function ArticleCard({
  article,
  variant = "grid",
}: {
  article: JournalArticle;
  variant?: "grid" | "featured";
}) {
  const featured = variant === "featured";
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block h-full overflow-hidden rounded-lg border border-sand bg-soft-white transition-[border-color,box-shadow] duration-300 hover:border-burgundy/40 hover:shadow-md hover:shadow-espresso/5 ${
        featured ? "md:grid md:grid-cols-2" : ""
      }`}
    >
      <CoverImage
        name={article.cover}
        icon="journal"
        sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"}
        className={featured ? "aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-80" : "aspect-[4/3] w-full"}
        imageClassName="object-[50%_30%]"
      />
      <div className={`flex flex-col p-5 ${featured ? "md:justify-center md:p-8" : "sm:p-6"}`}>
        <p className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em]">
          <span className="bg-rose/30 px-2 py-0.5 text-espresso">{categoryLabel[article.category]}</span>
          {featured && <span className="text-burgundy">Featured</span>}
        </p>
        <h3
          className={`mt-3 font-display leading-tight text-balance group-hover:text-burgundy ${
            featured ? "text-3xl md:text-4xl" : "text-2xl"
          }`}
        >
          {article.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone md:text-base md:leading-7">{article.summary}</p>
        <div className="mt-4">
          <Byline article={article} />
          <p className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-burgundy underline-offset-4 group-hover:underline">
            Read on {article.publisher}
            <ExternalIcon />
            <span className="sr-only"> (opens in a new tab)</span>
          </p>
        </div>
      </div>
    </a>
  );
}
