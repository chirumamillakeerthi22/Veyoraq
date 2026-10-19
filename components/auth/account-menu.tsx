"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAuthState } from "@/lib/auth/use-auth";
import { accountHref, settingsHref, signUpHref } from "@/lib/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const itemClass =
  "flex min-h-11 items-center px-2 text-sm transition-colors duration-200 hover:bg-champagne/60";

/*
  The Account icon and its menu. It reads the one shared sign-in
  state, so it changes the moment someone signs in or out, and it never shows an
  email unless the session has one. Saved Styles and Wishlist have their own
  navigation destinations, so they are not repeated here.
*/
export function AccountMenu() {
  const auth = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Remembering WHERE it was opened means moving to another page closes it by itself.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenOn(null);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpenOn(null);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      const { error: failure } = await createSupabaseBrowserClient().auth.signOut();
      if (failure) throw failure;
      setOpenOn(null);
      router.refresh();
    } catch {
      setError("We couldn't sign you out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  const signedIn = auth.status === "signed-in";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="true"
        onClick={() => setOpenOn(open ? null : pathname)}
        className="group relative flex h-11 w-11 items-center justify-center text-stone transition-colors duration-200 hover:text-espresso"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-[1.375rem] w-[1.375rem] transition-transform duration-300 group-hover:-translate-y-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" />
        </svg>
        {signedIn && (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-olive"
          />
        )}
        <span className="sr-only">
          {signedIn
            ? `Account menu, signed in as ${auth.email ?? "your account"}`
            : "Account menu"}
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2.5rem)] border border-sand bg-ivory p-3 shadow-lg shadow-espresso/10"
        >
          {auth.status === "loading" && (
            <p className="py-2 text-sm text-stone">Checking your account…</p>
          )}

          {signedIn && (
            <>
              <p className="px-2 text-xs uppercase tracking-[0.18em] text-stone">Logged in as</p>
              <p className="mt-1 break-all px-2 text-sm">{auth.email ?? "your account"}</p>
              <ul className="mt-3 border-t border-sand pt-2">
                <li>
                  <Link href={settingsHref} className={itemClass}>
                    My account
                  </Link>
                </li>
              </ul>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="mt-2 min-h-11 w-full border border-espresso/30 text-sm transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
              {error && (
                <p role="alert" className="mt-2 text-sm">
                  {error}
                </p>
              )}
            </>
          )}

          {auth.status === "signed-out" && (
            <ul>
              <li>
                <Link href={accountHref} className={itemClass}>
                  Sign in
                </Link>
              </li>
              <li>
                <Link href={signUpHref} className={itemClass}>
                  Sign up
                </Link>
              </li>
              <li className="mt-2 border-t border-sand pt-2">
                <Link href={settingsHref} className={itemClass}>
                  My account
                </Link>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
