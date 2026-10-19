import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description: "What VEYORAQ is, what you can use today, and how it works.",
};

const link = "underline underline-offset-4";

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="About"
      title={
        <>
          About <em>{brand.name}.</em>
        </>
      }
      intro={`${brand.name} is a personal styling and fashion discovery website. ${brand.description}`}
    >
      <LegalSection title="What you can use today">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/stylist" className={link}>
              Discover Your Style
            </Link>
            : a short quiz that turns your taste, colours and occasions into outfit ideas.
          </li>
          <li>
            <Link href="/color-analysis" className={link}>
              Color Analysis
            </Link>
            : an estimate of your colouring and a personal palette from a photo and a short quiz.
          </li>
          <li>
            <Link href="/fix-my-style" className={link}>
              FIX My Style
            </Link>
            : ideas for wearing the clothes you already own, from a photo of your outfit.
          </li>
          <li>
            <Link href="/hair-studio" className={link}>
              Hair Studio
            </Link>
            : four hairstyle ideas based on your photo and answers.
          </li>
          <li>Saved Styles, your saved Color Analysis reports and a Wishlist, once you sign in.</li>
        </ul>
      </LegalSection>

      <LegalSection title="What is not available yet">
        <p>
          Shop has no products connected, so there are no listings, prices or links. Where an
          outfit idea does not match a real product, it is labelled as an idea. The Style Journal
          is a preview and is not published.
        </p>
      </LegalSection>

      <LegalSection title="How the styling works">
        <p>
          Styling ideas and colour estimates are created by an AI model (Google&rsquo;s Gemini)
          from what you choose and, for the photo-based tools, the photo you provide. They are
          suggestions for inspiration, not a scientific, medical or professional assessment, and
          they can be wrong. You choose whose style to see (Women or Men) in{" "}
          <Link href="/account/settings#styling-preferences" className={link}>
            My Account
          </Link>
          .
        </p>
        <p>
          How photos and personal information are handled is explained in the{" "}
          <Link href="/privacy" className={link}>
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Who is behind it">
        <p>
          {brand.name} is in development. Operator and contact details have not been published
          yet; see{" "}
          <Link href="/contact" className={link}>
            Contact
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
