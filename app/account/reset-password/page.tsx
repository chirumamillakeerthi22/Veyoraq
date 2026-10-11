import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Choose a new password for your VEYORAQ account.",
  robots: { index: false },
};

// The reset link signs the visitor in briefly, so a session means the link worked.
async function ResetContent() {
  // Reading a login session touches the clock; Next.js only allows that at request time.
  await connection();

  if (!getSupabaseConfig().ok) {
    return <p className="max-w-md leading-7 text-stone">Sign-in isn&rsquo;t available yet.</p>;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <div className="max-w-md">
        <p className="leading-7 text-stone">
          This reset link has expired or was already used. Please request a new one from the
          sign-in page.
        </p>
        <div className="mt-6">
          <ButtonLink href="/account">Back to sign in</ButtonLink>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm email={data.user.email ?? ""} />;
}

export default function ResetPasswordPage() {
  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Account</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          Choose a <em>new password.</em>
        </h1>
      </div>
      <div className="mt-10">
        <Suspense fallback={<p className="text-stone">Loading…</p>}>
          <ResetContent />
        </Suspense>
      </div>
    </Container>
  );
}
