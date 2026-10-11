import type { Metadata } from "next";
import { Container } from "@/components/container";
import { FixMyStyleApp } from "@/components/fix-my-style/fix-my-style-app";

export const metadata: Metadata = {
  title: "FIX My Style",
  description:
    "Make more of the clothes you already own. Build a digital wardrobe, create outfits from it, and find the finishing touches.",
};

// The page shell is static; the wardrobe lives in the visitor's browser (see
// lib/fix-my-style/local-repository.ts), so the app itself is a client component.
export default function FixMyStylePage() {
  return (
    <Container className="py-8 md:py-14">
      <FixMyStyleApp />
    </Container>
  );
}
