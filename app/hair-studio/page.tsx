import type { Metadata } from "next";
import { Container } from "@/components/container";
import { HairStudio } from "@/components/hair-studio/hair-studio";

export const metadata: Metadata = {
  title: "Hair Studio",
  description:
    "Upload a photo, answer a short hair quiz, and preview four new hairstyles with your own photo.",
};

export default function HairStudioPage() {
  return (
    <Container className="py-6 md:py-14">
      <HairStudio />
    </Container>
  );
}
