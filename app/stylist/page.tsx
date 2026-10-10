import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Discover Your Style",
  description: "The style discovery quiz is in development.",
};

// Placeholder: the style discovery quiz has not been built yet.
export default function StylistPage() {
  return (
    <ComingSoon
      title={
        <>
          Discover your style, <em>soon.</em>
        </>
      }
    >
      The style discovery quiz is still being built, so there is nothing to
      fill in here yet. This page will become the starting point for exploring
      your style.
    </ComingSoon>
  );
}
