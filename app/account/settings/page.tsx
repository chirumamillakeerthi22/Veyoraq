import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your VEYORAQ account settings.",
  robots: { index: false },
};

const providerLabels: Record<string, string> = { google: "Google", email: "email and password" };

// Settings are private, so the visitor is checked on the server before anything shows.
async function SettingsContent() {
  // Reading a login session touches the clock; Next.js only allows that at request time.
  await connection();

  if (!getSupabaseConfig().ok) {
    return <p className="max-w-md leading-7 text-stone">Settings aren&rsquo;t available yet.</p>;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <div className="max-w-md">
        <p className="leading-7 text-stone">Sign in to see your settings.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/account">Sign in</ButtonLink>
          <ButtonLink href="/account?mode=signup" variant="secondary">
            Create account
          </ButtonLink>
        </div>
      </div>
    );
  }

  const provider = providerLabels[user.app_metadata?.provider as string] ?? "your account";
  // Google sign-in has no VEYORAQ password, so there is nothing to change.
  const hasPassword = user.app_metadata?.provider === "email";

  return (
    <div className="grid max-w-3xl gap-12">
      <section aria-labelledby="account-details">
        <h2 id="account-details" className="font-display text-3xl">
          Account
        </h2>
        <dl className="mt-4 divide-y divide-sand border-y border-sand">
          <div className="py-3 sm:flex sm:gap-6">
            <dt className="w-40 shrink-0 text-sm text-stone">Email</dt>
            <dd className="break-all">{user.email ?? "Not available"}</dd>
          </div>
          <div className="py-3 sm:flex sm:gap-6">
            <dt className="w-40 shrink-0 text-sm text-stone">Signed in with</dt>
            <dd>{provider}</dd>
          </div>
        </dl>
      </section>

      {hasPassword && (
        <section aria-labelledby="change-password">
          <h2 id="change-password" className="font-display text-3xl">
            Change password
          </h2>
          <div className="mt-4">
            <ResetPasswordForm email={user.email ?? ""} />
          </div>
        </section>
      )}

      <section aria-labelledby="your-collection">
        <h2 id="your-collection" className="font-display text-3xl">
          Your collection
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/saved" variant="secondary">
            Saved Styles
          </ButtonLink>
          <ButtonLink href="/wishlist" variant="secondary">
            Wishlist
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="sign-out">
        <h2 id="sign-out" className="font-display text-3xl">
          Sign out
        </h2>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </section>

      <p className="text-sm leading-6 text-stone">
        These are the only settings so far. More will appear here as features are added.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Account</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          Your <em>settings.</em>
        </h1>
      </div>
      <div className="mt-10">
        <Suspense fallback={<p className="text-stone">Loading…</p>}>
          <SettingsContent />
        </Suspense>
      </div>
    </Container>
  );
}
