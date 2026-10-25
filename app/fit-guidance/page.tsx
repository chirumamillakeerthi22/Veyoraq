import type { Metadata } from "next";
import { Container } from "@/components/container";
import { FitGuidanceTool } from "@/components/fit-guidance/fit-guidance";

export const metadata: Metadata = {
  title: "Fit Guidance",
  description:
    "Discover clothing cuts, proportions and styles you may enjoy wearing, based on what you choose to share.",
};

export default function FitGuidancePage() {
  return (
    <Container className="py-12 md:py-20">
      <FitGuidanceTool />
    </Container>
  );
}
