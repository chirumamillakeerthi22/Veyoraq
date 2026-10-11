import Link from "next/link";
import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { Photo } from "@/components/photo";
import { brand } from "@/lib/brand";
import { exploreHref, fixMyStyleHref, shopHref, stylistHref } from "@/lib/navigation";
import type { PhotoName } from "@/lib/photos";

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

const looks: {
  title: string;
  text: string;
  photo: PhotoName;
  sizes: string;
  layout: string;
  frame: string;
}[] = [
  {
    title: "Effortless Everyday",
    text: "Soft layers and easy shapes for the days in between.",
    photo: "everyday",
    sizes: "(min-width: 768px) 40vw, 100vw",
    layout: "col-span-2 md:col-span-5",
    frame: "aspect-[4/5]",
  },
  {
    title: "Modern Minimal",
    text: "Clean lines, quiet colour, nothing unnecessary.",
    photo: "minimal",
    sizes: "(min-width: 768px) 32vw, 50vw",
    layout: "md:col-span-4 md:mt-28",
    frame: "aspect-[3/4]",
  },
  {
    title: "Elevated Occasion",
    text: "Considered pieces for moments worth dressing for.",
    photo: "occasion",
    sizes: "(min-width: 768px) 24vw, 50vw",
    layout: "md:col-span-3 md:mt-12",
    frame: "aspect-[3/4]",
  },
];

const articles: {
  topic: string;
  title: string;
  text: string;
  photo: PhotoName;
}[] = [
  {
    topic: "Colour",
    title: "Finding the colours you love to wear",
    text: "A gentle way to notice which shades you reach for, and how to build on them.",
    photo: "journalColour",
  },
  {
    topic: "Proportion",
    title: "Styling silhouettes and proportions",
    text: "Simple ways to balance shapes, lengths and layers so an outfit feels right to you.",
    photo: "journalSilhouette",
  },
  {
    topic: "Texture",
    title: "Creating outfits with prints and textures",
    text: "How to mix knits, weaves and patterns without overthinking it.",
    photo: "journalTexture",
  },
  {
    topic: "Everyday",
    title: "Building versatile everyday looks",
    text: "A handful of pieces, combined well, that carry you through the week.",
    photo: "journalEveryday",
  },
  {
    topic: "Occasion",
    title: "Dressing for different occasions",
    text: "From relaxed gatherings to formal evenings: starting points for what to wear.",
    photo: "journalOccasion",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.22em] text-stone">{children}</p>
  );
}

function SoonTag() {
  return (
    <span className="inline-block border border-espresso/25 px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.18em] text-stone">
      Coming soon
    </span>
  );
}

const sectionHeading =
  "mt-4 font-display text-4xl leading-[1.08] md:text-5xl lg:text-6xl";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-heading">
        <Container className="grid gap-8 pb-16 pt-8 md:grid-cols-2 md:items-center md:gap-10 md:pb-24 md:pt-12 lg:gap-20 lg:pb-28 lg:pt-16">
          <div>
            <Eyebrow>Personal styling, in development</Eyebrow>
            <h1
              id="hero-heading"
              className="mt-5 font-display text-[clamp(2.75rem,7.2vw,5.75rem)] text-balance leading-[1.02] tracking-tight"
            >
              Style that <em>feels like you.</em>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-stone lg:mt-8">
              {brand.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row md:flex-col md:items-start lg:mt-10 xl:flex-row">
              <ButtonLink href={stylistHref}>Discover My Style</ButtonLink>
              <ButtonLink href="/#style-journal" variant="secondary">
                Explore the Journal
              </ButtonLink>
            </div>
          </div>

          <Photo
            name="hero"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5]"
            position="50% 20%"
            preload
          />
        </Container>
      </section>

      {/* Featured styling services: a short, curated selection. The full list lives at /explore. */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="scroll-mt-16 border-t border-sand lg:scroll-mt-20"
      >
        <Container className="py-16 md:py-24 lg:py-32">
          <div className="max-w-3xl">
            <Eyebrow>Featured services</Eyebrow>
            <h2 id="features-heading" className={sectionHeading}>
              Start with what feels <em>most like you.</em>
            </h2>
          </div>

          <ul className="mt-10 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-8 lg:gap-12">
            <li>
              <Link href={stylistHref} className="group block">
                <Photo
                  name="colour"
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="aspect-[4/5]"
                />
                <p className="mt-5 text-xs uppercase tracking-[0.22em] text-stone">Available</p>
                <h3 className="mt-2 font-display text-3xl">Discover Your Style</h3>
                <p className="mt-2 leading-7 text-stone">
                  A short quiz that turns your taste, colours and occasions into outfit ideas.
                </p>
              </Link>
            </li>
            <li>
              <div>
                <Photo
                  name="hair"
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="aspect-[4/5]"
                />
                <p className="mt-5 text-xs uppercase tracking-[0.22em] text-stone">Coming soon</p>
                <h3 className="mt-2 font-display text-3xl">Hair Studio</h3>
                <p className="mt-2 leading-7 text-stone">
                  Hairstyle inspiration shaped by your preferences and how much upkeep you want.
                </p>
              </div>
            </li>
            <li className="flex flex-col justify-end border-t border-espresso/20 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0 lg:pl-12">
              <p aria-hidden="true" className="font-display text-xl italic text-olive">
                and more
              </p>
              <h3 className="mt-3 font-display text-3xl">The full collection.</h3>
              <p className="mt-2 leading-7 text-stone">
                FIX My Style, the Journal, colour and fit guidance. See what is ready and what is
                on its way.
              </p>
              <ButtonLink href={exploreHref} variant="secondary" className="mt-6 w-full sm:w-auto">
                Explore all services
              </ButtonLink>
            </li>
          </ul>
        </Container>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="scroll-mt-16 border-y border-sand bg-soft-white lg:scroll-mt-20"
      >
        <Container className="py-16 md:py-24 lg:py-28">
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
      <section id="shop-the-look" aria-labelledby="looks-heading" className="scroll-mt-16 lg:scroll-mt-20">
        <Container className="py-16 md:py-24 lg:py-32">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
            <div>
              <Eyebrow>Shop the Look</Eyebrow>
              <h2 id="looks-heading" className={sectionHeading}>
                Three moods, <em>ready to shop.</em>
              </h2>
            </div>
            <div className="max-w-xs">
              <p className="text-sm leading-6 text-stone">
                Editorial inspiration only. These images are not products for sale, and Shop
                has no products connected yet.
              </p>
              <ButtonLink href={shopHref} variant="secondary" className="mt-4 w-full sm:w-auto">
                Go to Shop
              </ButtonLink>
            </div>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-16 md:grid-cols-12 md:items-start md:gap-x-8 lg:gap-x-12">
            {looks.map((look, index) => (
              <li key={look.title} className={look.layout}>
                <figure className="group">
                  <Photo
                    name={look.photo}
                    sizes={look.sizes}
                    className={look.frame}
                  />
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

      {/* FIX My Style spotlight */}
      <section
        id="fix-my-style"
        aria-labelledby="fix-heading"
        className="scroll-mt-16 bg-sand/60 lg:scroll-mt-20"
      >
        <Container className="grid gap-10 py-16 md:grid-cols-2 md:items-center md:gap-12 md:py-24 lg:gap-24 lg:py-28">
          <Photo
            name="flatLay"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-square md:aspect-[4/5]"
          />
          <div>
            <SoonTag />
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-stone">
              FIX My Style
            </p>
            <h2 id="fix-heading" className={sectionHeading}>
              More ways to wear what you already own.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-stone">
              Your wardrobe has more possibilities than you think. Explore
              fresh combinations, thoughtful layering, and new ways to style
              your favourite pieces.
            </p>
            <ButtonLink href={fixMyStyleHref} className="mt-8 w-full sm:w-auto">
              Explore FIX My Style
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Style Journal preview */}
      <section
        id="style-journal"
        aria-labelledby="journal-heading"
        className="scroll-mt-16 lg:scroll-mt-20"
      >
        <Container className="py-16 md:py-24 lg:py-32">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
            <div>
              <Eyebrow>Style Journal</Eyebrow>
              <h2 id="journal-heading" className={sectionHeading}>
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
                {articles.slice(1).map((article) => (
                  <li
                    key={article.title}
                    className="border-t border-sand py-6 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-6"
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

      {/* Final call to action */}
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
    </>
  );
}
