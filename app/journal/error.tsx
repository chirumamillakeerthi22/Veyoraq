"use client";

import { Container } from "@/components/container";

// Shown if the Journal page itself fails; the rest of the site keeps working.
export default function JournalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="py-12 md:py-20">
      <div role="alert" className="max-w-xl border border-espresso p-6">
        <p className="font-display text-3xl leading-8">The Journal couldn’t load.</p>
        <p className="mt-2 leading-7 text-stone">Something went wrong on our side. Please try again.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex min-h-12 items-center bg-burgundy px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ivory hover:bg-burgundy-deep"
        >
          Try again
        </button>
      </div>
    </Container>
  );
}
