"use client";

import { audienceLabels } from "@/lib/audience";
import { useAudience } from "@/lib/use-audience";

// Tells the visitor which audience the services below are tailored to.
export function ExploreAudienceNote() {
  const audience = useAudience();
  return (
    <p className="mt-4 text-sm leading-6 text-stone" aria-live="polite">
      Styling for <span className="font-medium text-espresso">{audienceLabels[audience]}</span>.
      Every service below follows this choice. Change it any time from the menu in the header.
    </p>
  );
}
