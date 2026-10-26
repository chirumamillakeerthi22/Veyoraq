import type { Metadata } from "next";
import { Container } from "@/components/container";
import { JournalBrowser } from "@/components/journal/journal-browser";
import { articles } from "@/lib/journal/articles";

export const metadata: Metadata = {
  title: "Style Journal",
  description: "Ideas, inspiration, and practical advice to help you find your style.",
};

export default function JournalPage() {
  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-burgundy">
          <span aria-hidden="true" className="h-px w-8 bg-burgundy/60" />
          Journal
        </p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          Style <em>Journal</em>
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone">
          Ideas, inspiration, and practical advice to help you find your style.
        </p>
      </div>
      <JournalBrowser articles={articles} />
    </Container>
  );
}
