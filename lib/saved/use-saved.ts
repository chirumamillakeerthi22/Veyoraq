"use client";

import { useEffect, useSyncExternalStore } from "react";
import { authStore } from "@/lib/auth/use-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createSavedStore, type SavedState } from "./store";

// One shared instance for the whole browser tab: every button and page reads it.
export const savedStore = createSavedStore(() => createSupabaseBrowserClient());

const SERVER_STATE: SavedState = { status: "idle", items: [], busyKeys: [], message: null };
const REFRESH_AFTER_MS = 15_000;

let wired = false;
let lastLoadAt = 0;

// Connects the store to the shared sign-in state, once.
function wire() {
  if (wired || typeof document === "undefined") return;
  wired = true;
  authStore.start();

  let previous = authStore.getState();
  authStore.subscribe(() => {
    const next = authStore.getState();
    if (next.status === previous.status && next.userId === previous.userId) return;
    previous = next;
    if (next.status === "signed-out") {
      savedStore.reset(); // signed out: forget the looks immediately
    } else if (next.status === "signed-in") {
      lastLoadAt = Date.now();
      void savedStore.refresh(); // signed in (possibly as someone else): read their looks
    }
  });

  // Coming back to the tab: pick up changes made in another tab or on another device.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (authStore.getState().status !== "signed-in") return;
    if (Date.now() - lastLoadAt < REFRESH_AFTER_MS) return;
    lastLoadAt = Date.now();
    void savedStore.refresh();
  });
}

export function useSavedOutfits(): SavedState {
  useEffect(() => {
    wire();
    lastLoadAt = Date.now();
    void savedStore.ensureLoaded();
  }, []);
  return useSyncExternalStore(savedStore.subscribe, savedStore.getState, () => SERVER_STATE);
}
