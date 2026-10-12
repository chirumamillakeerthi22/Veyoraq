import type { Metadata } from "next";
import { Container } from "@/components/container";
import { OutfitStylist } from "@/components/fix-my-style/outfit-stylist";

export const metadata: Metadata = {
  title: "FIX My Style",
  description:
    "Upload a photo of your outfit and get better ways to wear the clothes you already own.",
};

export default function FixMyStylePage() {
  return (
    <Container className="py-6 md:py-14">
      <OutfitStylist />
    </Container>
  );
}
