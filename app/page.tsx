import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { EditorialArt, type ArtVariant } from "@/components/editorial-art";
import { stylistHref } from "@/lib/navigation";

const benefits = [
  {
    title: "Understand Your Style",
    text: "Discover the silhouettes, colors, and details that feel most like you.",
  },
  {
    title: "Style What You Own",
    text: "Find fresh ways to combine pieces already in your wardrobe.",
  },
  {
    title: "Discover Your Next Piece",
    text: "Explore curated fashion that complements your preferences and budget.",
  },
];

const steps = [
  {
    title: "Tell us what you love.",
    text: "Share the occasions, colors and pieces you reach for most.",
  },
  {
    title: "Explore your personal style direction.",
    text: "See the shapes, palettes and details that suit your taste.",
  },
  {
    title: "Build outfits and discover pieces that fit your life.",
    text: "Combine what you own with considered additions, within your budget.",
  },
];

const inspirations: {
  title: string;
  text: string;
  variant: ArtVariant;
  alt: string;
}[] = [
  {
    title: "Effortless Everyday",
    text: "Soft layers and easy shapes for the days in between.",
    variant: "shirt",
    alt: "Illustration of a white tee on a hanger against a soft rose circle",
  },
  {
    title: "Modern Minimal",
    text: "Clean lines, quiet color and nothing unnecessary.",
    variant: "trousers",
    alt: "Illustration of dark tailored trousers against a muted olive panel",
  },
  {
    title: "Elevated Occasion",
    text: "Considered pieces for the moments worth dressing for.",
    variant: "dress",
    alt: "Illustration of an olive dress on a hanger inside a rose arch",
  },
];

const samplePalette = [
  { name: "Ivory", className: "bg-ivory" },
  { name: "Taupe", className: "bg-taupe" },
  { name: "Rose", className: "bg-rose" },
  { name: "Olive", className: "bg-olive" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.22em] text-stone">{children}</p>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-heading">
        <Container className="grid gap-10 pb-20 pt-10 md:grid-cols-2 md:items-center md:gap-10 md:pb-24 md:pt-16 lg:gap-20 lg:pb-32 lg:pt-20">
          <div>
            <Eyebrow>Personal styling, made clearer</Eyebrow>
            <h1
              id="hero-heading"
              className="mt-5 font-display text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.95] tracking-tight"
            >
              Style, <em className="block">decoded.</em>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-stone lg:mt-8 lg:text-xl lg:leading-9">
              Get to know your style. Make more of your wardrobe. Discover
              pieces that feel like you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row md:flex-col md:items-start lg:mt-10 xl:flex-row">
              <ButtonLink href={stylistHref}>Discover My Style</ButtonLink>
              <ButtonLink href="/#how-it-works" variant="secondary">
                Explore the Experience
              </ButtonLink>
            </div>
          </div>

          <div className="relative mb-8 md:mb-0">
            <div className="aspect-[5/4] overflow-hidden sm:aspect-[3/2] md:aspect-[4/5]">
              <EditorialArt
                variant="coat"
                alt="Illustration of a taupe coat on a hanger inside a soft white arch"
              />
            </div>
            <div className="absolute -bottom-8 left-4 border border-sand bg-soft-white px-4 py-3 shadow-sm md:-left-6 md:bottom-10 lg:px-5 lg:py-4">
              <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-stone">
                Sample palette
              </p>
              <ul className="mt-2 flex gap-2" aria-label="Sample palette colors">
                {samplePalette.map((swatch) => (
                  <li
                    key={swatch.name}
                    className={`h-7 w-7 border border-sand lg:h-8 lg:w-8 ${swatch.className}`}
                  >
                    <span className="sr-only">{swatch.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Value proposition */}
      <section
        id="discover"
        aria-labelledby="discover-heading"
        className="scroll-mt-20 border-t border-sand md:scroll-mt-24"
      >
        <Container className="py-16 md:py-24 lg:py-32">
          <div className="max-w-2xl">
            <Eyebrow>What we&rsquo;re building</Eyebrow>
            <h2
              id="discover-heading"
              className="mt-4 font-display text-4xl leading-tight md:text-5xl lg:text-6xl"
            >
              A clearer way to get dressed.
            </h2>
          </div>
          <ul className="mt-10 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-8 lg:gap-14">
            {benefits.map((benefit, index) => (
              <li key={benefit.title} className="border-t border-espresso/20 pt-6">
                <p
                  aria-hidden="true"
                  className="font-display text-2xl italic text-olive"
                >
                  0{index + 1}
                </p>
                <h3 className="mt-4 font-display text-2xl md:text-[1.75rem] md:leading-9">
                  {benefit.title}
                </h3>
                <p className="mt-3 leading-7 text-stone">{benefit.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="scroll-mt-20 border-y border-sand bg-soft-white md:scroll-mt-24"
      >
        <Container className="grid gap-10 py-16 md:py-24 lg:grid-cols-12 lg:gap-16 lg:py-32">
          <div className="lg:col-span-5">
            <Eyebrow>How it works</Eyebrow>
            <h2
              id="how-heading"
              className="mt-4 font-display text-4xl leading-tight md:text-5xl lg:text-6xl"
            >
              Three steps, <em>at your pace.</em>
            </h2>
            <p className="mt-6 max-w-md leading-7 text-stone">
              This is the journey we&rsquo;re designing. The guided experience
              is in development and isn&rsquo;t available yet.
            </p>
          </div>
          <ol className="lg:col-span-7">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-5 border-t border-sand py-7 first:border-t-0 first:pt-0 md:gap-8 lg:first:border-t lg:first:pt-7"
              >
                <span
                  aria-hidden="true"
                  className="w-10 shrink-0 font-display text-4xl leading-none text-olive md:w-14 md:text-5xl"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-2xl leading-8 md:text-[1.75rem] md:leading-9">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-7 text-stone">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Editorial style showcase */}
      <section
        id="style-journal"
        aria-labelledby="journal-heading"
        className="scroll-mt-20 md:scroll-mt-24"
      >
        <Container className="py-16 md:py-24 lg:py-32">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
            <div>
              <Eyebrow>Style Journal</Eyebrow>
              <h2
                id="journal-heading"
                className="mt-4 font-display text-4xl leading-tight md:text-5xl lg:text-6xl"
              >
                Three ways to feel like yourself.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-stone">
              Style inspirations, shown as illustrations. These are not product
              listings.
            </p>
          </div>
          <ul className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-5 md:mt-16 lg:gap-10">
            {inspirations.map((item) => (
              <li key={item.title}>
                <figure>
                  <div className="aspect-[4/3] overflow-hidden sm:aspect-[4/5]">
                    <EditorialArt variant={item.variant} alt={item.alt} />
                  </div>
                  <figcaption className="mt-5">
                    <h3 className="font-display text-2xl md:text-[1.75rem]">
                      {item.title}
                    </h3>
                    <p className="mt-2 leading-7 text-stone">{item.text}</p>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Closing call to action */}
      <section
        aria-labelledby="closing-heading"
        className="on-dark bg-espresso text-ivory"
      >
        <Container className="flex flex-col items-center py-20 text-center md:py-28 lg:py-36">
          <h2
            id="closing-heading"
            className="max-w-3xl font-display text-4xl leading-tight md:text-5xl lg:text-6xl"
          >
            Your style is personal.{" "}
            <em>Your discovery should be, too.</em>
          </h2>
          <ButtonLink
            href={stylistHref}
            variant="inverse"
            className="mt-10 w-full sm:w-auto"
          >
            Start Discovering
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}
