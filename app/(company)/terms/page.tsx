import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, Notice } from "@/components/legal-page";
import { missingCompanyDetails } from "@/lib/company";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "The terms for using VEYORAQ.",
};

export default function TermsPage() {
  const missing = missingCompanyDetails();

  return (
    <LegalPage
      eyebrow="Terms and Conditions"
      title={
        <>
          Terms and <em>Conditions.</em>
        </>
      }
      intro="Binding terms have not been published yet."
    >
      <Notice title="Not published yet">
        <p>
          Terms and Conditions are a legal agreement. They need real details about who operates
          VEYORAQ and a review by the owner (ideally with a lawyer), so none have been written or
          invented here.
        </p>
        <p>Still needed before they can be published:</p>
        <ul className="list-disc space-y-1 pl-5">
          {missing.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>The country or region whose law applies, and where disputes are handled</li>
          <li>The minimum age to use the service</li>
          <li>Rules on accounts and saved content, and the limits of liability</li>
        </ul>
      </Notice>

      <LegalSection title="In the meantime">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Styling ideas and colour estimates are AI suggestions for inspiration. They are not a
            scientific, medical or professional assessment.
          </li>
          <li>
            VEYORAQ does not sell products. Shop has no products connected, and any outfit idea
            without a real listing is labelled as an idea.
          </li>
          <li>
            How your data is handled is described in the{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
