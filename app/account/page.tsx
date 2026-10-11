import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { describeSignInError } from "@/lib/auth/messages";
import { fetchProviderAvailability } from "@/lib/supabase/auth-settings";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to VEYORAQ with email or Google.",
};

const providerLabels: Record<string, string> = {
  google: "Google",
  email: "email",
};

// Reading the login session happens at request time, so it streams in behind Suspense.
async function AccountContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const errorParam = typeof params.error === "string" ? params.error : undefined;
  const problem = describeSignInError(errorParam);

  if (!getSupabaseConfig().ok) {
    return (
      <p className="max-w-md leading-7 text-stone">
        Sign-in isn&rsquo;t available yet. Please check back soon.
      </p>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    const config = getSupabaseConfig();
    const availability = config.ok
      ? await fetchProviderAvailability(config)
      : { google: null, email: null };

    return (
      <>
        {problem && (
          <p role="alert" className="mb-6 max-w-md border border-espresso p-4 text-sm">
            {problem}
          </p>
        )}
        <SignInPanel
          googleAvailable={availability.google !== false}
          emailAvailable={availability.email !== false}
        />
      </>
    );
  }

  const provider = providerLabels[user.app_metadata?.provider as string] ?? "your account";

  return (
    <div className="max-w-md">
      <p className="text-sm text-stone">Signed in as</p>
      <p className="mt-1 break-words text-xl">{user.email ?? "your account"}</p>
      <p className="mt-1 text-sm text-stone">Signed in with {provider}.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/saved">My saved looks</ButtonLink>
        <ButtonLink href="/stylist" variant="secondary">
          Discover my style
        </ButtonLink>
      </div>
      <div className="mt-3">
        <SignOutButton />
      </div>
    </div>
  );
}

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Account</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          Sign in, <em>your way.</em>
        </h1>
        <p className="mt-5 leading-7 text-stone">
          Use Google or your email. We only keep your email address.
        </p>
      </div>
      <div className="mt-10">
        <Suspense fallback={<p className="text-stone">Loading…</p>}>
          <AccountContent searchParams={searchParams} />
        </Suspense>
      </div>
    </Container>
  );
}
