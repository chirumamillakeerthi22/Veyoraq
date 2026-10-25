import Link from "next/link";
import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { PerAudience } from "@/components/per-audience";
import { Photo } from "@/components/photo";
import { SiteFooter } from "@/components/site-footer";
import { homeContent } from "@/lib/home-content";
import { exploreHref, fixMyStyleHref, hairStudioHref, shopHref, stylistHref } from "@/lib/navigation";

/*
  The homepage follows the audience chosen in My Account (Styling Preferences). The
  parts that depend on it are rendered once per audience, each wrapped in data-for;
  the page's CSS shows only the chosen one (and <html data-audience> is set before
  first paint), so the other audience's images and text are not shown or read out.
  Sections that are the same for everyone (the brand line, how it works, the closing
  call to action) are rendered once.
*/

const steps = [
  {
    title: "Tell us about your style.",
    text: "Share what you like to wear, the colours you enjoy and the occasions you dress for.",
  },
  {
    title: "Explore personalized outfit inspiration.",
    text: "Browse outfit ideas shaped around your preferences, and refine them as you go.",
  },
  {
    title: "Save your favourites and discover pieces within your budget.",
    text: "Keep the looks you love and find pieces that work with the budget you set.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.22em] text-stone">{children}</p>
  );
}

const sectionHeading =
  "mt-4 font-display text-4xl leading-[1.08] md:text-5xl lg:text-6xl";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <PerAudience>
        {(audience) => {
          const content = homeContent[audience];
          return (
            <section aria-labelledby={`hero-heading-${audience}`}>
              <Container className="grid gap-6 pb-10 pt-4 md:grid-cols-2 md:items-center md:gap-10 md:pb-24 md:pt-12 lg:gap-20 lg:pb-28 lg:pt-16">
                <div>
                  <div className="[@media(max-height:700px)]:hidden md:!block">
                    <Eyebrow>Personal styling, in development</Eyebrow>
                  </div>
                  <h1
                    id={`hero-heading-${audience}`}
                    className="mt-3 font-display md:mt-5 text-[clamp(2.75rem,7.2vw,5.75rem)] text-balance leading-[1.02] tracking-tight"
                  >
                    Style that <em>feels like you.</em>
                  </h1>
                  <p className="mt-4 max-w-md text-base leading-7 text-stone md:mt-6 md:text-lg md:leading-8 lg:mt-8">
                    {content.heroText}
                  </p>
                  <div className="mt-6 flex flex-col gap-3 md:mt-8 md:flex-col md:items-start lg:mt-10 xl:flex-row">
                    <ButtonLink href={stylistHref} className="w-full md:w-auto">
                      Discover My Style
                    </ButtonLink>
                    {/* One clear action on phones; the Journal is one tap away in Explore. */}
                    <div className="hidden md:block">
                      <ButtonLink href="/#style-journal" variant="secondary">
                        Explore the Journal
                      </ButtonLink>
                    </div>
                  </div>
                </div>

                <Photo
                  name={content.heroPhoto}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="order-first h-[34dvh] min-h-44 md:order-none md:h-auto md:aspect-[3/4] lg:aspect-[4/5]"
                  position={content.heroPosition}
                  // Only the default audience's hero is preloaded; the other loads when shown.
                  preload={audience === "women"}
                />
              </Container>
            </section>
          );
        }}
      </PerAudience>

      {/* Featured styling services: a short, curated selection. The full list lives at /explore. */}
      <PerAudience>
        {(audience) => {
          const content = homeContent[audience];
          return (
            <section
              id={`features-${audience}`}
              aria-labelledby={`features-heading-${audience}`}
              className="scroll-mt-16 border-t border-sand lg:scroll-mt-20"
            >
              <Container className="py-12 md:py-24 lg:py-32">
                <div className="max-w-3xl">
                  <Eyebrow>Featured services</Eyebrow>
                  <h2 id={`features-heading-${audience}`} className={sectionHeading}>
                    Start with what feels <em>most like you.</em>
                  </h2>
                </div>

                {/* Phones: compact rows with a small photo. md and up: tall photo cards. */}
                <ul className="mt-8 grid gap-6 md:mt-16 md:grid-cols-3 md:gap-8 lg:gap-12">
                  <li>
                    <Link href={stylistHref} className="group flex gap-4 md:block">
                      <Photo
                        name={content.discover.photo}
                        sizes="(min-width: 768px) 33vw, 112px"
                        className="aspect-square w-28 shrink-0 md:aspect-[4/5] md:w-auto"
                      />
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.22em] text-stone md:mt-5">Available</p>
                        <h3 className="mt-1 font-display text-2xl leading-7 md:mt-2 md:text-3xl md:leading-normal">
                          Discover Your Style
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-stone md:mt-2 md:text-base md:leading-7">
                          {content.discover.text}
                        </p>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href={hairStudioHref} className="group flex gap-4 md:block">
                      <Photo
                        name={content.hair.photo}
                        sizes="(min-width: 768px) 33vw, 112px"
                        className="aspect-square w-28 shrink-0 md:aspect-[4/5] md:w-auto"
                      />
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.22em] text-stone md:mt-5">Available</p>
                        <h3 className="mt-1 font-display text-2xl leading-7 md:mt-2 md:text-3xl md:leading-normal">
                          Hair Studio
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-stone md:mt-2 md:text-base md:leading-7">
                          {content.hair.text}
                        </p>
                      </div>
                    </Link>
                  </li>
                  <li className="flex flex-col justify-end border-t border-espresso/20 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0 lg:pl-12">
                    <p aria-hidden="true" className="font-display text-xl italic text-olive">
                      and more
                    </p>
                    <h3 className="mt-3 font-display text-3xl">The full collection.</h3>
                    <p className="mt-2 leading-7 text-stone">{content.moreText}</p>
                    <ButtonLink href={exploreHref} variant="secondary" className="mt-6 w-full sm:w-auto">
                      Explore all services
                    </ButtonLink>
                  </li>
                </ul>
              </Container>
            </section>
          );
        }}
      </PerAudience>

      {/* How it works (the same for everyone) */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="scroll-mt-16 border-y border-sand bg-soft-white lg:scroll-mt-20"
      >
        <Container className="py-12 md:py-24 lg:py-28">
          <div className="max-w-2xl">
            <Eyebrow>How it will work</Eyebrow>
            <h2 id="how-heading" className={sectionHeading}>
              Three steps, <em>at your pace.</em>
            </h2>
          </div>
          <ol className="mt-10 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-8 lg:gap-14">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-5 md:block">
                <span
                  aria-hidden="true"
                  className="w-9 shrink-0 font-display text-5xl leading-none text-olive md:block md:w-auto md:text-6xl"
                >
                  {index + 1}
                </span>
                <div className="md:mt-6 md:border-t md:border-sand md:pt-6">
                  <h3 className="font-display text-2xl leading-8">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-7 text-stone">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Shop the Look: editorial looks that lead into Shop. They are inspiration, not products. */}
      <div id="shop-the-look" className="scroll-mt-16 lg:scroll-mt-20" />
      <PerAudience>
        {(audience) => {
          const content = homeContent[audience];
          return (
            <section aria-labelledby={`looks-heading-${audience}`}>
              <Container className="py-12 md:py-24 lg:py-32">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
                  <div>
                    <Eyebrow>Shop the Look</Eyebrow>
                    <h2 id={`looks-heading-${audience}`} className={sectionHeading}>
                      {content.looksHeading.pre}
                      <em>{content.looksHeading.em}</em>
                    </h2>
                  </div>
                  <div className="max-w-xs">
                    <p className="text-sm leading-6 text-stone">{content.looksNote}</p>
                    <ButtonLink href={shopHref} variant="secondary" className="mt-4 w-full sm:w-auto">
                      Go to Shop
                    </ButtonLink>
                  </div>
                </div>
                <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-16 md:grid-cols-12 md:items-start md:gap-x-8 lg:gap-x-12">
                  {content.looks.map((look, index) => (
                    <li key={look.title} className={look.layout}>
                      <figure className="group">
                        <Photo name={look.photo} sizes={look.sizes} className={look.frame} />
                        <figcaption className="mt-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-stone">
                            Look 0{index + 1}
                          </p>
                          <h3 className="mt-2 font-display text-2xl md:text-[1.75rem]">
                            {look.title}
                          </h3>
                          <p className="mt-1 leading-7 text-stone">{look.text}</p>
                        </figcaption>
                      </figure>
                    </li>
                  ))}
                </ul>
              </Container>
            </section>
          );
        }}
      </PerAudience>

      {/* FIX My Style spotlight */}
      <div id="fix-my-style" className="scroll-mt-16 lg:scroll-mt-20" />
      <PerAudience>
        {(audience) => (
          <section aria-labelledby={`fix-heading-${audience}`} className="bg-sand/60">
            <Container className="grid gap-10 py-16 md:grid-cols-2 md:items-center md:gap-12 md:py-24 lg:gap-24 lg:py-28">
              <Photo
                name={homeContent[audience].fix.photo}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="aspect-square md:aspect-[4/5]"
              />
              <div>
                <span className="inline-block border border-espresso/25 px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.18em] text-stone">
                  Available now
                </span>
                <p className="mt-6 text-xs uppercase tracking-[0.22em] text-stone">
                  FIX My Style
                </p>
                <h2 id={`fix-heading-${audience}`} className={sectionHeading}>
                  More ways to wear what you already own.
                </h2>
                <p className="mt-6 max-w-md text-lg leading-8 text-stone">
                  Your wardrobe has more possibilities than you think. Explore
                  fresh combinations, thoughtful layering, and new ways to style
                  your favourite pieces. Upload a photo of your outfit to begin.
                </p>
                <ButtonLink href={fixMyStyleHref} className="mt-8 w-full sm:w-auto">
                  Open FIX My Style
                </ButtonLink>
              </div>
            </Container>
          </section>
        )}
      </PerAudience>

      {/* Style Journal preview */}
      <div id="style-journal" className="scroll-mt-16 lg:scroll-mt-20" />
      <PerAudience>
        {(audience) => {
          const articles = homeContent[audience].articles;
          return (
            <section aria-labelledby={`journal-heading-${audience}`}>
              <Container className="py-12 md:py-24 lg:py-32">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
                  <div>
                    <Eyebrow>Style Journal</Eyebrow>
                    <h2 id={`journal-heading-${audience}`} className={sectionHeading}>
                      Practical guides, <em>kindly written.</em>
                    </h2>
                  </div>
                  <p className="max-w-xs text-sm leading-6 text-stone">
                    A preview of what we&rsquo;re writing. The Journal isn&rsquo;t
                    published yet.
                  </p>
                </div>

                <ul className="mt-10 grid gap-10 md:mt-16 lg:grid-cols-12 lg:gap-16">
                  <li className="lg:col-span-5">
                    <article>
                      <Photo
                        name={articles[0].photo}
                        sizes="(min-width: 1024px) 40vw, 100vw"
                        className="aspect-[4/3] lg:aspect-[4/5]"
                      />
                      <p className="mt-5 text-xs uppercase tracking-[0.22em] text-stone">
                        {articles[0].topic}
                      </p>
                      <h3 className="mt-2 font-display text-3xl md:text-4xl">
                        {articles[0].title}
                      </h3>
                      <p className="mt-3 max-w-md leading-7 text-stone">
                        {articles[0].text}
                      </p>
                    </article>
                  </li>
                  <li className="lg:col-span-7">
                    <ul>
                      {articles.slice(1).map((article, index) => (
                        <li
                          key={article.title}
                          className={`border-t border-sand py-6 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-6 ${
                            index >= 2 ? "hidden md:block" : ""
                          }`}
                        >
                          <article className="flex gap-5 md:gap-8">
                            <Photo
                              name={article.photo}
                              sizes="160px"
                              className="aspect-square w-24 shrink-0 md:w-36"
                            />
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-stone">
                                {article.topic}
                              </p>
                              <h3 className="mt-2 font-display text-2xl leading-7 md:text-[1.75rem] md:leading-9">
                                {article.title}
                              </h3>
                              <p className="mt-2 leading-7 text-stone">
                                {article.text}
                              </p>
                            </div>
                          </article>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </Container>
            </section>
          );
        }}
      </PerAudience>

      {/* Final call to action (the same for everyone) */}
      <section
        aria-labelledby="closing-heading"
        className="on-dark bg-espresso text-ivory"
      >
        <Container className="flex flex-col items-center py-20 text-center md:py-28 lg:py-36">
          <h2
            id="closing-heading"
            className="font-display text-5xl leading-[1.05] md:text-6xl lg:text-7xl"
          >
            Your style story <em>starts here.</em>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-ivory/80">
            Explore new possibilities, make your wardrobe work harder, and find
            looks that feel like you.
          </p>
          <ButtonLink
            href={stylistHref}
            variant="inverse"
            className="mt-10 w-full sm:w-auto"
          >
            Discover My Style
          </ButtonLink>
        </Container>
      </section>

      <SiteFooter />
    </>
  );
}
