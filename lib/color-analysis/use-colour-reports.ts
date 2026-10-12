"use client";

import { useEffect, useSyncExternalStore } from "react";
import { authStore } from "@/lib/auth/use-auth";
import {
  createLocalLooksRepository,
  createLooksStore,
  IDLE_LOOKS,
  type LooksState,
  type Saveable,
} from "@/lib/fix-my-style/looks";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createAccountColourRepository } from "./account-repository";
import type { ColourAnalysis } from "./schema";

// A saved colour report. It holds no photo.
export type SavedColourReport = Saveable & { analysis: ColourAnalysis };

/*
  Signed in: reports live in the person's account (protected by Row Level Security).
  Signed out: they are kept only in this browser. The store always asks which one to
  use, so signing in or out switches it cleanly (see the wiring below).
*/
export const colourReportsStore = createLooksStore<SavedColourReport>(() => {
  if (authStore.getState().status === "signed-in") {
    return createAccountColourRepository(createSupabaseBrowserClient());
  }
  return createLocalLooksRepository<SavedColourReport>("veyoraq-colour-reports");
});

let wired = false;

function wire() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  authStore.start();
  let previous = authStore.getState();
  authStore.subscribe(() => {
    const next = authStore.getState();
    if (next.status === previous.status && next.userId === previous.userId) return;
    const wasKnown = previous.status !== "loading";
    previous = next;
    if (next.status === "loading") return;
    // A different person (or signed in or out): forget the other source's list.
    colourReportsStore.reset();
    if (wasKnown || next.status === "signed-in") void colourReportsStore.ensureLoaded();
  });
}

export function useColourReports(): LooksState<SavedColourReport> {
  useEffect(() => {
    wire();
    // Wait for the sign-in state before reading, so the right source is used.
    const start = () => {
      if (authStore.getState().status !== "loading") void colourReportsStore.ensureLoaded();
    };
    start();
    return authStore.subscribe(start);
  }, []);
  return useSyncExternalStore(
    colourReportsStore.subscribe,
    colourReportsStore.getState,
    () => IDLE_LOOKS as LooksState<SavedColourReport>,
  );
}
