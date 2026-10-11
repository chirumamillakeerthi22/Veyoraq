"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { PasswordField } from "@/components/auth/password-field";
import { updatePassword, type AuthApi } from "@/lib/auth/client-actions";
import { PASSWORD_RULES } from "@/lib/auth/password";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const primaryButton =
  "inline-flex min-h-12 w-full items-center justify-center bg-espresso px-7 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ivory transition-colors duration-200 hover:bg-stone disabled:cursor-not-allowed disabled:opacity-50";

// Shown after the visitor follows the reset link, so they already have a short-lived session.
export function ResetPasswordForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    setError("");

    let auth: AuthApi;
    try {
      auth = createSupabaseBrowserClient().auth;
    } catch {
      setError("Sign-in isn't available yet.");
      return;
    }

    inFlight.current = true;
    setBusy(true);
    const result = await updatePassword(auth, password, email);
    inFlight.current = false;
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-md">
        <p role="status" className="text-lg">
          Your password has been updated.
        </p>
        <p className="mt-2 text-stone">You&rsquo;re signed in.</p>
        <Link
          href="/account"
          className="mt-6 inline-flex min-h-12 items-center border border-espresso/30 px-7 text-[0.8125rem] font-medium uppercase tracking-[0.14em] hover:border-espresso"
        >
          Go to my account
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4">
      <PasswordField
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        describedBy="new-password-rules"
      />
      <p id="new-password-rules" className="text-sm text-stone">
        {PASSWORD_RULES}
      </p>
      <button type="submit" disabled={busy} className={primaryButton}>
        {busy ? "Saving…" : "Set new password"}
      </button>
      {error && (
        <p role="alert" className="text-sm leading-6">
          {error}
        </p>
      )}
    </form>
  );
}
