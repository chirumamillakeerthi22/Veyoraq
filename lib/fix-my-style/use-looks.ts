"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createLocalLooksRepository, createLooksStore, IDLE_LOOKS, type LooksState } from "./looks";

// One shared set of saved looks for the whole browser tab.
export const looksStore = createLooksStore(createLocalLooksRepository);

export function useLooks(): LooksState {
  useEffect(() => {
    void looksStore.ensureLoaded();
  }, []);
  return useSyncExternalStore(looksStore.subscribe, looksStore.getState, () => IDLE_LOOKS);
}
