"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { isAuthPath, shouldShowPrompt } from "@/lib/auth/prompt-timer";
import { useAuthState } from "@/lib/auth/use-auth";
import {
  fetchProviderAvailability,
  type ProviderAvailability,
} from "@/lib/supabase/auth-settings";
import { getSupabaseConfig } from "@/lib/supabase/config";

const VISIBLE_KEY = "veyoraq:visible-ms";
const SHOWN_KEY = "veyoraq:prompt-shown";
const DISMISSED_KEY = "veyoraq:prompt-dismissed-at";
const TICK_MS = 1_000;
const RETRY_WHEN_TYPING_MS = 10_000;

function read(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function write(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // storage blocked: the prompt then simply behaves as once per page load
  }
}

function remove(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // nothing to clean up
  }
}

/*
  After two minutes of active time on the site WHILE SIGNED OUT, invites the visitor to
  sign in or create an account, once per session. Only timing and a dismissal time are
  kept in the browser; nothing about the person.

  - It reads the shared sign-in state, so it reacts the moment someone signs in.
  - Time only counts while signed out and while the page is visible; signing in resets it.
  - Closing it keeps it away for a week. It never opens on the sign-in pages, while the
    visitor is typing, or more than once per session.
  - It uses the native <dialog>, so keyboard focus, Escape and screen readers work
    without extra code, and it has no animation.
*/
export function SignInPrompt() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthState();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  // null = not known (treated as available). Read when the popup opens.
  const [availability, setAvailability] = useState<ProviderAvailability>({
    google: null,
    email: null,
  });
  const [checking, setChecking] = useState(true);

  const show = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    write(window.sessionStorage, SHOWN_KEY, "1");
    dialog.showModal();
    setOpen(true);
  }, []);

  // Count time only while signed out and the page is visible.
  useEffect(() => {
    if (!getSupabaseConfig().ok) return;

    // Signing in cancels the reminder and forgets the time counted so far.
    if (auth.status === "signed-in") {
      remove(window.sessionStorage, VISIBLE_KEY);
      return;
    }
    if (auth.status !== "signed-out") return;

    let blockedUntil = 0;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;

      const visibleMs = Number(read(window.sessionStorage, VISIBLE_KEY) ?? 0) + TICK_MS;
      write(window.sessionStorage, VISIBLE_KEY, String(visibleMs));

      const dismissed = Number(read(window.localStorage, DISMISSED_KEY));
      const due = shouldShowPrompt({
        visibleMs,
        signedIn: false,
        dismissedAt: Number.isFinite(dismissed) && dismissed > 0 ? dismissed : null,
        shownThisSession: read(window.sessionStorage, SHOWN_KEY) === "1",
        pathname,
        now: Date.now(),
        configured: true,
      });
      if (!due || Date.now() < blockedUntil) return;

      // Don't interrupt someone who is in the middle of typing.
      const field = document.activeElement;
      if (field && /^(INPUT|TEXTAREA|SELECT)$/.test(field.tagName)) {
        blockedUntil = Date.now() + RETRY_WHEN_TYPING_MS;
        return;
      }
      show();
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [auth.status, pathname, show]);

  // When it opens, ask Supabase which methods are switched on, so a method that is
  // not set up yet says so instead of failing when pressed.
  useEffect(() => {
    if (!open) return;
    const config = getSupabaseConfig();
    if (!config.ok) return;
    let active = true;
    fetchProviderAvailability(config).then((result) => {
      if (!active) return;
      setAvailability(result);
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [open]);

  // Close if the visitor signs in, or moves to a sign-in page, while it is open.
  useEffect(() => {
    if (open && (auth.status === "signed-in" || isAuthPath(pathname))) {
      dialogRef.current?.close();
    }
  }, [open, auth.status, pathname]);

  // Remember the dismissal immediately, so it can never come back because a browser
  // delayed or skipped the dialog's own "close" event.
  function recordDismissal() {
    write(window.localStorage, DISMISSED_KEY, String(Date.now()));
    setOpen(false);
  }

  function dismiss() {
    recordDismissal();
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="sign-in-prompt-title"
      // Escape: "cancel" fires first, then "close". Either one records the dismissal.
      onCancel={recordDismissal}
      onClose={recordDismissal}
      onClick={(event) => {
        // A click on the dimmed area (the dialog element itself) closes it.
        if (event.target === dialogRef.current) dismiss();
      }}
      className="m-auto max-h-[90dvh] w-[min(92vw,26rem)] overflow-y-auto border border-sand bg-ivory p-0 text-espresso shadow-xl backdrop:bg-espresso/50"
    >
      {open && (
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id="sign-in-prompt-title" className="font-display text-3xl leading-tight">
              Keep your looks
            </h2>
            <button
              type="button"
              onClick={dismiss}
              className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center"
            >
              <span className="sr-only">Close</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-stone">
            Create a free account to save your favourite outfits and keep a wishlist, so you can
            find them again later.
          </p>
          <div className="mt-6">
            <SignInPanel
              next={pathname}
              googleAvailable={availability.google !== false}
              emailAvailable={availability.email !== false}
              checking={checking}
              onSignedIn={() => {
                dialogRef.current?.close();
                router.refresh();
              }}
            />
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="mt-4 min-h-11 text-sm text-stone underline underline-offset-4"
          >
            Not now
          </button>
        </div>
      )}
    </dialog>
  );
}
