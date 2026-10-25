import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClearDeviceData } from "@/components/account/clear-device-data";
import { StylingPreferences } from "@/components/account/styling-preferences";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Account",
  description: "Your profile, styling preferences, saved content and settings.",
  robots: { index: false },
};

const providerLabels: Record<string, string> = { google: "Google", email: "email and password" };

const rowLink =
  "flex min-h-12 items-center justify-between gap-3 border-t border-sand px-1 text-sm first:border-t-0 transition-colors duration-200 hover:bg-espresso/5";

function Card({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 border border-sand bg-soft-white p-5 sm:p-6"
    >
      <h2 id={`${id}-title`} className="font-display text-3xl leading-tight">
        {title}
      </h2>
      {description && <p className="mt-2 text-sm leading-6 text-stone">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function LinkList({ links }: { links: { label: string; href: string; note?: string }[] }) {
  return (
    <ul>
      {links.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className={rowLink}>
            <span>
              {item.label}
              {item.note && <span className="block text-xs text-stone">{item.note}</span>}
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// The visitor is checked on the server so private details are only shown to them.
async function AccountHub() {
  // Reading a login session touches the clock; Next.js only allows that at request time.
  await connection();

  let user: { email?: string; provider?: string } | null = null;
  const supabaseReady = getSupabaseConfig().ok;
  if (supabaseReady) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      user = {
        email: data.user.email ?? undefined,
        provider: data.user.app_metadata?.provider as string | undefined,
      };
    }
  }

  const hasPassword = user?.provider === "email";

  return (
    <div className="grid items-start gap-6 md:grid-cols-2 lg:gap-8">
      <div className="grid gap-6 lg:gap-8">
        <Card id="profile" title="Profile">
          {user ? (
            <div>
              <dl className="divide-y divide-sand border-y border-sand">
                <div className="py-3 sm:flex sm:gap-6">
                  <dt className="w-36 shrink-0 text-sm text-stone">Email</dt>
                  <dd className="break-all">{user.email ?? "Not available"}</dd>
                </div>
                <div className="py-3 sm:flex sm:gap-6">
                  <dt className="w-36 shrink-0 text-sm text-stone">Signed in with</dt>
                  <dd>{providerLabels[user.provider ?? ""] ?? "your account"}</dd>
                </div>
              </dl>
              <div className="mt-5">
                <SignOutButton />
              </div>
            </div>
          ) : (
            <div>
              <p className="leading-7 text-stone">
                {supabaseReady
                  ? "You are browsing as a guest. Sign in to save outfits, colour reports and wishlist items to your account."
                  : "Sign-in isn’t available yet. You can still use VEYORAQ as a guest."}
              </p>
              {supabaseReady && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/account">Sign in</ButtonLink>
                  <ButtonLink href="/account?mode=signup" variant="secondary">
                    Create account
                  </ButtonLink>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card
          id="styling-preferences"
          title="Styling Preferences"
          description="Choose whose style inspiration and recommendations you’d like to see across VEYORAQ."
        >
          <StylingPreferences />
        </Card>

        <Card
          id="saved"
          title="Your Saved Content"
          description="Separate collections. Changing your styling preference never changes or deletes any of them."
        >
          <LinkList
            links={[
              { label: "Saved Styles", href: "/saved", note: "Outfit ideas you saved" },
              { label: "Your Color Analysis", href: "/saved#color-analysis", note: "Your saved personal colour reports" },
              { label: "Fit Guidance", href: "/saved#fit-guidance", note: "Fit reports saved on this device" },
              { label: "Wishlist", href: "/wishlist", note: "Individual products you may want to buy" },
            ]}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:gap-8">
        <Card id="company" title="Company & Legal">
          <LinkList
            links={[
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms and Conditions", href: "/terms" },
            ]}
          />
        </Card>

        <Card id="settings" title="Settings">
          <div className="grid gap-8">
            {hasPassword && (
              <div>
                <h3 className="font-medium">Change password</h3>
                <div className="mt-3">
                  <ResetPasswordForm email={user?.email ?? ""} />
                </div>
              </div>
            )}

            <div id="privacy" className="scroll-mt-24">
              <h3 className="font-medium">Privacy and data</h3>
              <p className="mt-2 text-sm leading-6 text-stone">
                Remove what VEYORAQ keeps in this browser: your audience choice, unfinished
                answers, and looks saved on this device. Read the{" "}
                <Link href="/privacy" className="underline underline-offset-4">
                  Privacy Policy
                </Link>
                .
              </p>
              <div className="mt-3">
                <ClearDeviceData />
              </div>
            </div>

            <div>
              <h3 className="font-medium">Delete account</h3>
              <p className="mt-2 text-sm leading-6 text-stone">
                Deleting an account isn’t available in the app yet, so there is no button for it.
                You can delete saved outfits, colour reports and wishlist items yourself from their
                pages. See the{" "}
                <Link href="/privacy" className="underline underline-offset-4">
                  Privacy Policy
                </Link>{" "}
                for how to ask for deletion once a contact address is published.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function MyAccountPage() {
  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Account</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          My <em>account.</em>
        </h1>
        <p className="mt-5 leading-7 text-stone">
          Your profile, styling preferences, saved content and settings in one place.
        </p>
      </div>
      <div className="mt-10 max-w-5xl">
        <Suspense fallback={<p className="text-stone">Loading…</p>}>
          <AccountHub />
        </Suspense>
      </div>
    </Container>
  );
}
