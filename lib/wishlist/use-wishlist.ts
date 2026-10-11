"use client";

import { useEffect, useSyncExternalStore } from "react";
import { authStore } from "@/lib/auth/use-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createWishlistStore, type WishlistState } from "./store";

export const wishlistStore = createWishlistStore(() => createSupabaseBrowserClient());

const SERVER_STATE: WishlistState = { status: "idle", items: [], busyIds: [], message: null };
let wired = false;

// Follows the shared sign-in state, once: sign out forgets, sign in re-reads.
function wire() {
  if (wired || typeof document === "undefined") return;
  wired = true;
  authStore.start();

  let previous = authStore.getState();
  authStore.subscribe(() => {
    const next = authStore.getState();
    if (next.status === previous.status && next.userId === previous.userId) return;
    previous = next;
    if (next.status === "signed-out") wishlistStore.reset();
    else if (next.status === "signed-in") void wishlistStore.refresh();
  });
}

export function useWishlist(): WishlistState {
  useEffect(() => {
    wire();
    void wishlistStore.ensureLoaded();
  }, []);
  return useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getState, () => SERVER_STATE);
}
