import type { Metadata } from "next";
import { Container } from "@/components/container";
import { StyleQuiz } from "@/components/stylist/style-quiz";

export const metadata: Metadata = {
  title: "Discover Your Style",
  description:
    "A short, friendly style quiz that turns your taste, colours and occasions into outfit ideas.",
};

/*
  The quiz always opens. Whether the AI service is available is checked at run time
  (see /api/stylist/status) and explained inside the quiz, so a missing key or an
  unconfigured deployment can never hide the quiz itself.
*/
export default function StylistPage() {
  return (
    <Container className="py-8 md:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Discover Your Style</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] md:text-6xl">
          Let&rsquo;s find <em>your look.</em>
        </h1>
        <p className="mt-3 leading-7 text-stone">
          A few quick questions, one at a time. Nothing is saved unless you choose to save a look.
        </p>
      </div>
      <div className="mt-8">
        <StyleQuiz />
      </div>
    </Container>
  );
}
