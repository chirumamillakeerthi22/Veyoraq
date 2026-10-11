"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PasswordField } from "@/components/auth/password-field";
import {
  checkSendBudget,
  formatCountdown,
  readCooldownSeconds,
  recordSend,
  startCooldown,
} from "@/lib/auth/cooldown";
import {
  isPlausibleEmail,
  requestPasswordReset,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  type ActionFailure,
  type AuthApi,
} from "@/lib/auth/client-actions";
import { PASSWORD_RULES, validatePassword } from "@/lib/auth/password";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "reset";
type Busy = "google" | "form" | null;

const COOLDOWN_KEY = "veyoraq:auth-cooldown-until";
const SEND_KEY = "veyoraq:auth-email-sends";
// At most 3 email-sending requests (account confirmation or reset) per 10 minutes
// from one browser, so repeated presses cannot burn the project's shared allowance.
const SEND_MAX = 3;
const SEND_WINDOW_MS = 10 * 60 * 1_000;

const buttonBase =
  "inline-flex min-h-12 w-full items-center justify-center px-7 text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton = `${buttonBase} bg-espresso text-ivory hover:bg-stone`;
const outlineButton = `${buttonBase} border border-espresso/30 text-espresso hover:border-espresso hover:bg-espresso/5`;
const inputClass =
  "mt-1 block min-h-12 w-full border border-sand bg-soft-white px-3 text-base";
const linkButton =
  "min-h-11 text-left text-sm underline underline-offset-4 disabled:no-underline disabled:opacity-60";

function getAuth(): AuthApi | null {
  try {
    return createSupabaseBrowserClient().auth;
  } catch {
    return null;
  }
}

type SignInPanelProps = {
  next?: string;
  // Which tab opens first. "Sign up" links use "signup".
  initialMode?: "signin" | "signup";
  // false means the method is switched off in Supabase for now. It stays visible,
  // with a short note, instead of failing when clicked. Unknown counts as available.
  googleAvailable?: boolean;
  emailAvailable?: boolean;
  // True while we are still asking Supabase which methods are on. The Google button
  // stays disabled (with no note) so it can't be pressed before we know.
  checking?: boolean;
  // Called after a successful sign-in (the modal uses it to close itself).
  onSignedIn?: () => void;
};

// Both ways in, side by side: Continue with Google, or email and password.
export function SignInPanel({
  next = "/account",
  initialMode = "signin",
  googleAvailable = true,
  emailAvailable = true,
  checking = false,
  onSignedIn,
}: SignInPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inFlight = useRef(false);
  const messageRef = useRef<HTMLParagraphElement>(null);

  // Pick up a cooldown remembered from an earlier visit to this page.
  useEffect(() => {
    const timer = setTimeout(
      () => setCooldown(readCooldownSeconds(window.sessionStorage, COOLDOWN_KEY)),
      0,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(
      () => setCooldown(readCooldownSeconds(window.sessionStorage, COOLDOWN_KEY)),
      1_000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (message) messageRef.current?.focus();
  }, [message]);

  function showError(failed: Pick<ActionFailure, "message" | "retryAfterSeconds">) {
    setMessage({ kind: "error", text: failed.message });
    if (failed.retryAfterSeconds) {
      startCooldown(window.sessionStorage, COOLDOWN_KEY, failed.retryAfterSeconds);
      setCooldown(failed.retryAfterSeconds);
    }
  }

  function finishSignedIn() {
    if (onSignedIn) onSignedIn();
    router.refresh();
  }

  function chooseMode(next: Mode) {
    setMode(next);
    setMessage(null);
    setPassword("");
  }

  async function onGoogle() {
    if (inFlight.current) return;
    setMessage(null);
    const auth = getAuth();
    if (!auth) return showError({ message: "Sign-in isn't available yet." });
    inFlight.current = true;
    setBusy("google");
    const result = await signInWithGoogle(auth, window.location.origin, next);
    // On success the browser is already on its way to Google.
    if (!result.ok) {
      showError(result);
      setBusy(null);
      inFlight.current = false;
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    // A second press while a request is running is ignored, so one click is one request.
    if (inFlight.current) return;
    // Re-read the remembered cooldown instead of trusting possibly stale state.
    const waitLeft = readCooldownSeconds(window.sessionStorage, COOLDOWN_KEY);
    if (waitLeft > 0) {
      setCooldown(waitLeft);
      return;
    }
    setMessage(null);

    if (!isPlausibleEmail(email)) {
      return showError({ message: "That email address doesn't look right." });
    }
    if (mode === "signup") {
      const problems = validatePassword(password, email);
      if (problems.length > 0) return showError({ message: problems[0] });
    }
    if (mode === "signin" && !password) {
      return showError({ message: "Enter your password." });
    }

    const auth = getAuth();
    if (!auth) return showError({ message: "Sign-in isn't available yet." });

    // Requests that send an email are limited per browser as well.
    const sendsEmail = mode === "signup" || mode === "reset";
    if (sendsEmail) {
      const budget = checkSendBudget(window.localStorage, SEND_KEY, SEND_MAX, SEND_WINDOW_MS);
      if (!budget.allowed) {
        return showError({
          message: "You've asked for several emails already. Please wait before asking again.",
          retryAfterSeconds: budget.retryAfterSeconds,
        });
      }
      recordSend(window.localStorage, SEND_KEY, SEND_WINDOW_MS);
    }

    inFlight.current = true;
    setBusy("form");
    try {
      if (mode === "signin") {
        const result = await signInWithPassword(auth, email, password);
        if (!result.ok) return showError(result);
        finishSignedIn();
      } else if (mode === "signup") {
        const result = await signUpWithPassword(auth, email, password, window.location.origin, next);
        if (!result.ok) return showError(result);
        if (result.signedIn) {
          finishSignedIn();
        } else {
          setMode("signin");
          setPassword("");
          setMessage({
            kind: "info",
            text: `Almost there. Check ${email.trim()} for a confirmation link, then sign in here.`,
          });
        }
      } else {
        const result = await requestPasswordReset(auth, email, window.location.origin);
        if (!result.ok) return showError(result);
        setMessage({
          kind: "info",
          text: "If an account exists for that email, a reset link is on its way. It can take a few minutes.",
        });
      }
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  const waiting = cooldown > 0;
  const submitLabel = waiting
    ? `Try again in ${formatCountdown(cooldown)}`
    : busy === "form"
      ? "Please wait…"
      : mode === "signin"
        ? "Sign in"
        : mode === "signup"
          ? "Create account"
          : "Send reset link";

  return (
    <div className="max-w-md">
      <button
        type="button"
        onClick={onGoogle}
        disabled={busy !== null || !googleAvailable || checking}
        aria-describedby={googleAvailable ? undefined : "google-note"}
        className={outlineButton}
      >
        {busy === "google" ? "Opening Google…" : "Continue with Google"}
      </button>
      {!googleAvailable && (
        <p id="google-note" className="mt-2 text-sm text-stone">
          Google sign-in is being set up. Please use email and password for now.
        </p>
      )}

      <p
        aria-hidden="true"
        className="my-4 flex items-center gap-4 text-xs uppercase tracking-[0.22em] text-stone before:h-px before:flex-1 before:bg-sand after:h-px after:flex-1 after:bg-sand"
      >
        or
      </p>

      {mode !== "reset" && (
        <div className="mb-4 grid grid-cols-2 border border-sand" role="group" aria-label="Email account">
          {(["signin", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => chooseMode(value)}
              className={`min-h-11 text-sm transition-colors duration-200 ${
                mode === value ? "bg-espresso text-ivory" : "hover:bg-espresso/5"
              }`}
            >
              {value === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      )}

      {mode === "reset" && (
        <p className="mb-4 text-sm leading-6 text-stone">
          Enter your email and we&rsquo;ll send you a link to choose a new password.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <div>
          <label htmlFor="email" className="text-sm text-stone">
            Email address
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            disabled={!emailAvailable}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>

        {mode !== "reset" && (
          <>
            <PasswordField
              value={password}
              onChange={setPassword}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              describedBy={mode === "signup" ? "password-rules" : undefined}
              disabled={!emailAvailable}
            />
            {mode === "signup" && (
              <p id="password-rules" className="text-sm text-stone">
                {PASSWORD_RULES}
              </p>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={busy !== null || waiting || !emailAvailable}
          className={primaryButton}
        >
          {submitLabel}
        </button>
      </form>

      {!emailAvailable && (
        <p className="mt-3 text-sm text-stone">
          Email sign-in is being set up. Please use Google for now.
        </p>
      )}

      <div className="mt-2 flex flex-col">
        {mode === "signin" && (
          <button type="button" onClick={() => chooseMode("reset")} className={linkButton}>
            Forgot your password?
          </button>
        )}
        {mode === "reset" && (
          <button type="button" onClick={() => chooseMode("signin")} className={linkButton}>
            Back to sign in
          </button>
        )}
      </div>

      {waiting && (
        <p className="mt-2 text-sm text-stone">
          We&rsquo;re pausing requests for a moment so you don&rsquo;t get locked out. Google sign-in
          is still available.
        </p>
      )}

      <p
        ref={messageRef}
        tabIndex={-1}
        role={message?.kind === "error" ? "alert" : "status"}
        className={`mt-2 text-sm leading-6 outline-none ${
          message?.kind === "error" ? "text-espresso" : "text-stone"
        }`}
      >
        {message?.text}
      </p>
    </div>
  );
}
