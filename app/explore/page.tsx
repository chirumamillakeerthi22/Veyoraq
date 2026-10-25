import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { CoverImage } from "@/components/cover-image";
import { ExploreAudienceNote } from "@/components/explore-audience-note";
import { PerAudience } from "@/components/per-audience";
import { exploreServices, statusLabel, type ExploreService } from "@/lib/explore-content";
import type { Audience } from "@/lib/audience";

export const metadata: Metadata = {
  title: "Explore",
  description: "Every VEYORAQ styling service in one place.",
};

// One service: the whole card is the link. The photo is the focus, with the name and
// a short description underneath where they stay easy to read.
function ServiceCard({ service, audience }: { service: ExploreService; audience: Audience }) {
  return (
    <Link
      href={service.href}
      className="group block h-full overflow-hidden rounded-lg border border-sand bg-soft-white transition-[border-color,box-shadow,transform] duration-300 hover:border-espresso/40 hover:shadow-md hover:shadow-espresso/5 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0"
    >
      <CoverImage
        name={service.cover[audience]}
        icon={service.icon}
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
        className="aspect-[4/3] w-full"
        position="50% 30%"
      />
      <div className="p-5 sm:p-6">
        <p className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-stone">
          <span className="border border-espresso/25 px-2 py-1">{statusLabel[service.status]}</span>
          <span aria-hidden="true" className="text-espresso transition-transform duration-300 group-hover:translate-x-0.5">
            Open →
          </span>
        </p>
        <h2 className="mt-4 font-display text-2xl leading-8">{service.name}</h2>
        <p className="mt-2 leading-7 text-stone">{service.textFor?.[audience] ?? service.text}</p>
      </div>
    </Link>
  );
}

export default function ExplorePage() {
  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Explore</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          Every way we can <em>style you.</em>
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone">
          VEYORAQ is in development. Each service shows whether you can use it today.
        </p>
        <ExploreAudienceNote />
      </div>

      {/* Cover photos follow the audience chosen in My Account. */}
      <PerAudience>
        {(audience) => (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {exploreServices.map((service) => (
              <li key={service.name}>
                <ServiceCard service={service} audience={audience} />
              </li>
            ))}
          </ul>
        )}
      </PerAudience>
    </Container>
  );
}
