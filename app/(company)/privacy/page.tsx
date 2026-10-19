import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, Notice } from "@/components/legal-page";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What VEYORAQ collects, where it is kept, and the choices you have.",
};

const link = "underline underline-offset-4";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title={
        <>
          Your <em>privacy.</em>
        </>
      }
      intro="A plain description of what VEYORAQ does with your information today."
    >
      <Notice title="Draft: needs the owner's review">
        <p>
          This describes how the website works at the moment, written from the way it is built. It
          has not been reviewed by a lawyer, and it does not yet name the operator or give a
          contact address{company.contactEmail ? "" : " (not published yet; see Contact)"}. It
          should be reviewed before VEYORAQ is promoted publicly.
        </p>
      </Notice>

      <LegalSection title="Your account">
        <p>
          You can browse without an account. If you sign in (with Google, or an email and
          password), the account is held by our authentication provider, Supabase. We keep your
          email address and your sign-in details. Sign-in uses cookies that keep you signed in.
        </p>
        <p>
          If you sign in, your Styling Preference (Women or Men) is also saved on your account so
          it follows you between devices.
        </p>
      </LegalSection>

      <LegalSection title="What is saved to your account">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Saved Styles: the outfit idea and the questionnaire choices behind it (never your free
            text notes) and the audience it was made for.
          </li>
          <li>Your saved Color Analysis reports: the palette and written report, never your photo.</li>
          <li>Your Wishlist: the product details you choose to save.</li>
        </ul>
        <p>
          These are protected so that only your own account can read or change them. Signed out,
          Color Analysis reports are kept only in this browser.
        </p>
      </LegalSection>

      <LegalSection title="Photos">
        <p>
          Color Analysis, FIX My Style and Hair Studio use a photo you choose. The photo is
          resized on your device, then sent to our server and on to Google&rsquo;s Gemini to create
          your result. VEYORAQ does not store it and does not log it. Google handles it under its
          own terms for the Gemini service, which we do not control.
        </p>
        <p>
          Looks you save in FIX My Style and Hair Studio (including their pictures) are kept only
          in your browser on this device, and are not uploaded to your account.
        </p>
      </LegalSection>

      <LegalSection title="What is kept in your browser">
        <p>
          To save your progress and preferences, VEYORAQ keeps small items in your browser&rsquo;s
          storage: your audience choice, unfinished quiz answers (they expire after about a week),
          reminders about the sign-in prompt, and looks you saved on this device. You can remove
          all of it with &ldquo;Clear data on this device&rdquo; in{" "}
          <Link href="/account/settings#privacy" className={link}>
            My Account
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Other things to know">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The website&rsquo;s own code does not include advertising or analytics trackers. Our
            hosting provider (Vercel), Supabase and Google process requests under their own
            policies.
          </li>
          <li>
            To limit misuse, the styling services briefly count requests per visitor (using your
            network address) in the server&rsquo;s memory. This is not written to a database.
          </li>
          <li>VEYORAQ does not sell your information.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Deleting your data">
        <p>
          You can remove saved outfits, saved Color Analysis reports and Wishlist items yourself
          from their pages, and clear on-device data from My Account. Deleting the account itself
          is not available in the app yet.{" "}
          {company.contactEmail ? (
            <>
              To ask for your account to be deleted, email{" "}
              <a href={`mailto:${company.contactEmail}`} className={link}>
                {company.contactEmail}
              </a>
              .
            </>
          ) : (
            "A contact address for deletion requests has not been published yet."
          )}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
