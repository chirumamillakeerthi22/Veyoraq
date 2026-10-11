"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  isPlausibleEmail,
  isSixDigitCode,
  sendEmailCode,
  signInWithGoogle,
  verifyEmailCode,
  type ActionResult,
  type AuthApi,
} from "@/lib/auth/client-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const RESEND_SECONDS = 60;

const buttonBase =
  "inline-flex min-h-12 w-full items-center justify-center px-7 text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton = `${buttonBase} bg-espresso text-ivory hover:bg-stone`;
const outlineButton = `${buttonBase} border border-espresso/30 text-espresso hover:border-espresso hover:bg-espresso/5`;
const inputClass =
  "mt-1 block min-h-12 w-full border border-sand bg-soft-white px-3 text-base";

type Busy = "google" | "send" | "verify" | null;

function getAuth(): AuthApi | null {
  try {
    return createSupabaseBrowserClient().auth;
  } catch {
    return null;
  }
}

type SignInPanelProps = {
  next?: string;
  // false means the method is switched off in Supabase for now. It stays visible,
  // with a short note, instead of failing when clicked. Unknown counts as available.
  googleAvailable?: boolean;
  emailAvailable?: boolean;
};

// Both ways in, side by side: Continue with Google, or Sign in with Email.
export function SignInPanel({
  next = "/account",
  googleAvailable = true,
  emailAvailable = true,
}: SignInPanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const messageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1_000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (message) messageRef.current?.focus();
  }, [message]);

  function fail(result: Extract<ActionResult, { ok: false }>) {
    setMessage({ kind: "error", text: result.message });
    setBusy(null);
  }

  async function onGoogle() {
    setMessage(null);
    const auth = getAuth();
    if (!auth) {
      return fail({ ok: false, message: "Sign-in isn't available yet." });
    }
    setBusy("google");
    const result = await signInWithGoogle(auth, window.location.origin, next);
    // On success the browser is already on its way to Google.
    if (!result.ok) fail(result);
  }

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    setMessage(null);
    if (!isPlausibleEmail(email)) {
      return fail({ ok: false, message: "That email address doesn't look right." });
    }
    const auth = getAuth();
    if (!auth) {
      return fail({ ok: false, message: "Sign-in isn't available yet." });
    }
    setBusy("send");
    const result = await sendEmailCode(auth, email, window.location.origin, next);
    if (!result.ok) return fail(result);

    setCodeSentTo(email.trim());
    setCode("");
    setCooldown(RESEND_SECONDS);
    setBusy(null);
    setMessage({
      kind: "info",
      text: `We sent a 6-digit code to ${email.trim()}. It can take a minute to arrive.`,
    });
  }

  async function onVerify(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!codeSentTo) return;
    if (!isSixDigitCode(code)) {
      return fail({ ok: false, message: "Enter the 6-digit code from the email." });
    }
    const auth = getAuth();
    if (!auth) {
      return fail({ ok: false, message: "Sign-in isn't available yet." });
    }
    setBusy("verify");
    const result = await verifyEmailCode(auth, codeSentTo, code);
    if (!result.ok) return fail(result);
    // Signed in: reload the page so the server renders the signed-in view.
    router.refresh();
  }

  return (
    <div className="max-w-md">
      <button
        type="button"
        onClick={onGoogle}
        disabled={busy !== null || !googleAvailable}
        aria-describedby={googleAvailable ? undefined : "google-note"}
        className={outlineButton}
      >
        {busy === "google" ? "Opening Google…" : "Continue with Google"}
      </button>
      {!googleAvailable && (
        <p id="google-note" className="mt-2 text-sm text-stone">
          Google sign-in is being set up. Please use email for now.
        </p>
      )}

      <p
        aria-hidden="true"
        className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.22em] text-stone before:h-px before:flex-1 before:bg-sand after:h-px after:flex-1 after:bg-sand"
      >
        or
      </p>

      {codeSentTo === null ? (
        <form onSubmit={sendCode} noValidate>
          <label htmlFor="email" className="text-sm text-stone">
            Email address
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy !== null || !emailAvailable}
            className={`${primaryButton} mt-4`}
          >
            {busy === "send" ? "Sending…" : "Sign in with email"}
          </button>
          <p className="mt-3 text-sm text-stone">
            {emailAvailable
              ? "We’ll email you a code. No password needed."
              : "Email sign-in is being set up. Please use Google for now."}
          </p>
        </form>
      ) : (
        <form onSubmit={onVerify} noValidate>
          <label htmlFor="code" className="text-sm text-stone">
            6-digit code
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className={`${inputClass} tracking-[0.4em]`}
          />
          <button
            type="submit"
            disabled={busy !== null}
            className={`${primaryButton} mt-4`}
          >
            {busy === "verify" ? "Checking…" : "Continue"}
          </button>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <button
              type="button"
              onClick={() => sendCode()}
              disabled={busy !== null || cooldown > 0}
              className="min-h-11 text-left underline underline-offset-4 disabled:no-underline disabled:opacity-60"
            >
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCodeSentTo(null);
                setMessage(null);
              }}
              className="min-h-11 text-left underline underline-offset-4"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      <p
        ref={messageRef}
        tabIndex={-1}
        role={message?.kind === "error" ? "alert" : "status"}
        className={`mt-4 text-sm outline-none ${message?.kind === "error" ? "text-espresso" : "text-stone"}`}
      >
        {message?.text}
      </p>
    </div>
  );
}
