"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createLocalRepository } from "./local-repository";
import { createWardrobeStore, IDLE_STATE, type WardrobeState } from "./store";

// One shared wardrobe for the whole browser tab.
export const wardrobeStore = createWardrobeStore(createLocalRepository);

export function useWardrobe(): WardrobeState {
  useEffect(() => {
    void wardrobeStore.ensureLoaded();
  }, []);
  return useSyncExternalStore(
    wardrobeStore.subscribe,
    wardrobeStore.getState,
    () => IDLE_STATE,
  );
}
