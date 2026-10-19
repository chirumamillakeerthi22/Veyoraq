"use client";

import Link from "next/link";
import { audienceLabels } from "@/lib/audience";
import { useAudience } from "@/lib/use-audience";

// Tells the visitor which audience the services below follow, and where to change it.
export function ExploreAudienceNote() {
  const audience = useAudience();
  return (
    <p className="mt-4 text-sm leading-6 text-stone" aria-live="polite">
      Styling for <span className="font-medium text-espresso">{audienceLabels[audience]}</span>.
      Every service below follows your Styling Preferences.{" "}
      <Link href="/account/settings#styling-preferences" className="underline underline-offset-4">
        Change it in My Account
      </Link>
      .
    </p>
  );
}
