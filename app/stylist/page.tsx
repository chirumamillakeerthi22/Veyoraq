import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { Container } from "@/components/container";
import { StylistFlow } from "@/components/stylist/stylist-flow";
import { isStylistConfigured } from "@/lib/stylist/config";

export const metadata: Metadata = {
  title: "Discover Your Style",
  description:
    "Answer a few questions and get outfit ideas shaped around your occasion, style and budget.",
};

export default function StylistPage() {
  // Without an AI key the form could not produce anything, so don't offer it.
  if (!isStylistConfigured()) {
    return (
      <ComingSoon
        title={
          <>
            Discover your style, <em>soon.</em>
          </>
        }
      >
        The style questionnaire isn&rsquo;t open yet. Check back soon.
      </ComingSoon>
    );
  }

  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">
          Discover Your Style
        </p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          Tell us a little, <em>get ideas.</em>
        </h1>
        <p className="mt-5 leading-7 text-stone">
          Answer a few questions for up to three outfit ideas. Concepts only: no
          products or prices, and nothing is saved.
        </p>
      </div>
      <div className="mt-12">
        <StylistFlow />
      </div>
    </Container>
  );
}
