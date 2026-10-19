import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { Container } from "@/components/container";
import { describeSignInError } from "@/lib/auth/messages";
import { fetchProviderAvailability } from "@/lib/supabase/auth-settings";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to VEYORAQ with Google, or an email and password.",
};

// Reading the login session happens at request time, so it streams in behind Suspense.
async function AccountContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Reading a login session touches the clock (token expiry checks). Next.js only
  // allows that at request time, so wait for a real request before going any further.
  await connection();

  const params = await searchParams;
  const errorParam = typeof params.error === "string" ? params.error : undefined;
  const problem = describeSignInError(errorParam);
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  if (!getSupabaseConfig().ok) {
    return (
      <p className="leading-7 text-stone">
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
          <p role="alert" className="mb-6 border border-espresso p-4 text-sm">
            {problem}
          </p>
        )}
        <SignInPanel
          initialMode={initialMode}
          googleAvailable={availability.google !== false}
          emailAvailable={availability.email !== false}
        />
      </>
    );
  }

  // A signed-in visitor's account is the My Account page (profile, preferences, saved
  // content, company and legal links, and settings).
  redirect("/account/settings");
}

/*
  On large screens the sign-in card sits in the middle of the viewport, both ways.
  Only this page uses this layout, so no other page moves.
*/
export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <Container className="flex justify-center py-10 md:py-16 lg:min-h-[calc(100dvh-5rem)] lg:items-center lg:py-2">
      <div className="w-full max-w-md border border-sand bg-soft-white p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">Account</p>
          <h1 className="mt-2 font-display text-4xl leading-[1.05]">
            Sign in, <em>your way.</em>
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone">
            Google, or an email and password. We only keep your email.
          </p>
        </div>
        <div className="mt-6">
          <Suspense fallback={<p className="text-center text-stone">Loading…</p>}>
            <AccountContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </Container>
  );
}
