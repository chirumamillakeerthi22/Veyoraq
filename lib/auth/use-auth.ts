"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AUTH_LOADING, createAuthStore, type AuthState } from "./auth-store";

// One shared instance for the whole browser tab.
export const authStore = createAuthStore(() => createSupabaseBrowserClient());

export function useAuthState(): AuthState {
  useEffect(() => {
    authStore.start();
  }, []);
  return useSyncExternalStore(
    authStore.subscribe,
    authStore.getState,
    () => AUTH_LOADING, // on the server nobody is known yet
  );
}
