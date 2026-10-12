import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { ExploreAudienceNote } from "@/components/explore-audience-note";
import { NavIconGlyph } from "@/components/nav-icon";
import {
  colourAnalysisHref,
  fixMyStyleHref,
  hairStudioHref,
  stylistHref,
  type NavIcon,
} from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Explore",
  description: "Every VEYORAQ styling service in one place.",
};

type Service = {
  name: string;
  text: string;
  icon: NavIcon;
  // Only services that have a page to open are given an href.
  href?: string;
  status: "available" | "preview" | "soon";
};

const services: Service[] = [
  {
    name: "Discover Your Style",
    text: "A short quiz that turns your taste, colours and occasions into outfit ideas.",
    icon: "discover",
    href: stylistHref,
    status: "available",
  },
  {
    name: "FIX My Style",
    text: "Upload a photo of your outfit and see better ways to wear what you already own.",
    icon: "fix",
    href: fixMyStyleHref,
    status: "available",
  },
  {
    name: "Hair Studio",
    text: "Upload a photo, answer a short quiz, and preview four new hairstyles on your own photo.",
    icon: "hair",
    href: hairStudioHref,
    status: "available",
  },
  {
    name: "Style Journal",
    text: "Practical, kindly written guides on colour, proportion, texture and occasions.",
    icon: "journal",
    href: "/#style-journal",
    status: "preview",
  },
  {
    name: "Colour Analysis",
    text: "Estimate your likely colour season and get a personal palette from a photo and a short quiz.",
    icon: "discover",
    href: colourAnalysisHref,
    status: "available",
  },
  {
    name: "Fit guidance",
    text: "Optional body profile and fit preferences, offered as guidance rather than rules.",
    icon: "fix",
    status: "soon",
  },
];

const statusLabel: Record<Service["status"], string> = {
  available: "Available",
  preview: "Preview",
  soon: "Coming soon",
};

function ServiceCard({ service }: { service: Service }) {
  const body = (
    <>
      <NavIconGlyph
        name={service.icon}
        className="h-6 w-6 text-gold transition-transform duration-300 group-hover:-translate-y-0.5"
      />
      <h2 className="mt-5 font-display text-2xl leading-8">{service.name}</h2>
      <p className="mt-2 leading-7 text-stone">{service.text}</p>
      <p className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-stone">
        <span className="border border-espresso/25 px-2 py-1">{statusLabel[service.status]}</span>
        {service.href && (
          <span aria-hidden="true" className="text-espresso">
            Open →
          </span>
        )}
      </p>
    </>
  );

  const base = "group block h-full border border-sand bg-soft-white p-6";
  return service.href ? (
    <Link
      href={service.href}
      className={`${base} transition-colors duration-200 hover:border-espresso/40`}
    >
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
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

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {services.map((service) => (
          <li key={service.name}>
            <ServiceCard service={service} />
          </li>
        ))}
      </ul>
    </Container>
  );
}
