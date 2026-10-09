import type { Metadata } from "next";
import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "Find My Style",
  description: "The VEYORAQ style questionnaire is in development.",
};

// Placeholder: the styling questionnaire has not been built yet.
export default function StylistPage() {
  return (
    <Container className="py-20 md:py-32">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">
          In development
        </p>
        <h1 className="mt-5 font-display text-5xl leading-[1.05] md:text-7xl">
          Find your style, <em>soon.</em>
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone">
          The guided style questionnaire is still being built, so there is
          nothing to fill in here yet. This page will become the starting point
          for discovering your style.
        </p>
        <ButtonLink href="/" variant="secondary" className="mt-10">
          Back to the homepage
        </ButtonLink>
      </div>
    </Container>
  );
}
