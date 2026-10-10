import type { Metadata } from "next";
import { Container } from "@/components/container";
import { StylistFlow } from "@/components/stylist/stylist-flow";

export const metadata: Metadata = {
  title: "Discover Your Style",
  description:
    "Answer a few questions and get outfit ideas shaped around your occasion, style and budget.",
};

export default function StylistPage() {
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
          Answer a few questions and we&rsquo;ll suggest up to three outfit
          ideas. They are style concepts only: we don&rsquo;t check prices,
          brands or availability yet. We don&rsquo;t save your answers.
        </p>
      </div>
      <div className="mt-12">
        <StylistFlow />
      </div>
    </Container>
  );
}
