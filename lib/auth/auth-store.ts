import type { SupabaseClient } from "@supabase/supabase-js";
import { createExternalStore } from "@/lib/store/external-store";

/*
  Who is signed in, as seen by the browser. This is the ONE place the interface asks
  that question: the account menu, the sign-in popup and the saved-looks store all
  read it, so they always agree and all react at the same moment.

  It mirrors the Supabase session (it does not invent its own login state). Pages
  that need to trust it, such as the Account page, still check on the server.
*/
export type AuthState = {
  status: "loading" | "signed-in" | "signed-out";
  email: string | null;
  userId: string | null;
};

type SessionLike = { user?: { id?: string; email?: string | null } | null } | null;

export const AUTH_LOADING: AuthState = { status: "loading", email: null, userId: null };
const SIGNED_OUT: AuthState = { status: "signed-out", email: null, userId: null };

export function createAuthStore(getClient: () => Pick<SupabaseClient, "auth">) {
  const store = createExternalStore<AuthState>(AUTH_LOADING);
  let started = false;

  function apply(session: SessionLike) {
    const user = session?.user;
    const next: AuthState = user
      ? { status: "signed-in", email: user.email ?? null, userId: user.id ?? null }
      : SIGNED_OUT;
    const current = store.get();
    if (
      current.status === next.status &&
      current.email === next.email &&
      current.userId === next.userId
    ) {
      return; // nothing changed (for example a routine token refresh)
    }
    store.set(next);
  }

  return {
    getState: store.get,
    subscribe: store.subscribe,

    // Safe to call many times; it starts listening only once.
    start() {
      if (started) return;
      started = true;

      let client: Pick<SupabaseClient, "auth">;
      try {
        client = getClient();
      } catch {
        apply(null); // Supabase is not configured: nobody can be signed in
        return;
      }

      void client.auth.getSession().then(({ data }) => apply(data.session));
      client.auth.onAuthStateChange((_event, session) => apply(session));
    },
  };
}
