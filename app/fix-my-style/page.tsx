import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "FIX My Style",
  description: "FIX My Style is in development.",
};

// Placeholder: wardrobe uploads and outfit combinations have not been built yet.
export default function FixMyStylePage() {
  return (
    <ComingSoon
      title={
        <>
          FIX My Style, <em>soon.</em>
        </>
      }
    >
      Adding pieces from your wardrobe and exploring new combinations
      isn&rsquo;t available yet. There is no upload here for now, and nothing
      is collected.
    </ComingSoon>
  );
}
