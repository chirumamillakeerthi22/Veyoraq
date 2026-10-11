/*
  When to invite a visitor to sign in. The rules are deliberately gentle:
  once per browser session, never for someone already signed in, never on the
  sign-in pages themselves, and after a "Not now" it stays away for a week.
*/

export const PROMPT_AFTER_MS = 2 * 60 * 1_000;
export const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1_000;

export function isAuthPath(pathname: string): boolean {
  return pathname === "/account" || pathname.startsWith("/account/") || pathname.startsWith("/auth/");
}

export type PromptState = {
  // Time the page has actually been visible in this session (background tabs don't count).
  visibleMs: number;
  // null while it is not yet known whether the visitor is signed in.
  signedIn: boolean | null;
  // When the visitor last pressed "Not now" or closed it, or null.
  dismissedAt: number | null;
  shownThisSession: boolean;
  pathname: string;
  now: number;
  // False when Supabase is not set up, so there is nothing to sign in to.
  configured: boolean;
};

export function shouldShowPrompt(state: PromptState): boolean {
  if (!state.configured) return false;
  if (state.signedIn !== false) return false; // signed in, or not known yet
  if (state.shownThisSession) return false;
  if (isAuthPath(state.pathname)) return false;
  if (state.visibleMs < PROMPT_AFTER_MS) return false;
  if (state.dismissedAt !== null && state.now - state.dismissedAt < DISMISS_FOR_MS) {
    return false;
  }
  return true;
}
