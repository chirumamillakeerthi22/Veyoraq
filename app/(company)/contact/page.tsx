import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, Notice } from "@/components/legal-page";
import { company, missingCompanyDetails } from "@/lib/company";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to get in touch with VEYORAQ.",
};

export default function ContactPage() {
  const missing = missingCompanyDetails();

  return (
    <LegalPage
      eyebrow="Contact"
      title={
        <>
          Get in <em>touch.</em>
        </>
      }
    >
      {company.contactEmail ? (
        <LegalSection title="Email">
          <p>
            <a href={`mailto:${company.contactEmail}`} className="underline underline-offset-4">
              {company.contactEmail}
            </a>
          </p>
          {company.operatorName && <p>{company.operatorName}</p>}
          {company.postalAddress && <p className="whitespace-pre-line">{company.postalAddress}</p>}
        </LegalSection>
      ) : (
        <LegalSection title="Contact details">
          <p>
            VEYORAQ is in development and has not published a contact address yet. We would rather
            show nothing than a made-up address.
          </p>
          <p>
            For help signing in, use{" "}
            <Link href="/account" className="underline underline-offset-4">
              Account
            </Link>
            ; you can reset a forgotten password from there.
          </p>
        </LegalSection>
      )}

      {missing.length > 0 && (
        <Notice title="Setup needed (site owner)">
          <p>These details are not set, so they are not shown. Add them in lib/company.ts:</p>
          <ul className="list-disc space-y-1 pl-5">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Notice>
      )}
    </LegalPage>
  );
}
