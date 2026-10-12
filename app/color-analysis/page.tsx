import type { Metadata } from "next";
import { Container } from "@/components/container";
import { ColourAnalysisTool } from "@/components/color-analysis/color-analysis";

export const metadata: Metadata = {
  title: "Colour Analysis",
  description:
    "Estimate your likely colour season and build a personal palette from a photo and a short quiz.",
};

export default function ColourAnalysisPage() {
  return (
    <Container className="py-6 md:py-14">
      <ColourAnalysisTool />
    </Container>
  );
}
