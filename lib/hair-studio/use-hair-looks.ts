"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  createLocalLooksRepository,
  createLooksStore,
  IDLE_LOOKS,
  type LooksState,
  type Saveable,
} from "@/lib/fix-my-style/looks";
import type { effortValues } from "./schema";

// A saved hairstyle preview. Kept only in this browser, like FIX My Style's looks.
export type SavedHairLook = Saveable & {
  name: string;
  description: string;
  effort: (typeof effortValues)[number];
  image: Blob;
};

export const hairLooksStore = createLooksStore<SavedHairLook>(() =>
  createLocalLooksRepository<SavedHairLook>("veyoraq-hair-looks"),
);

export function useHairLooks(): LooksState<SavedHairLook> {
  useEffect(() => {
    void hairLooksStore.ensureLoaded();
  }, []);
  return useSyncExternalStore(
    hairLooksStore.subscribe,
    hairLooksStore.getState,
    () => IDLE_LOOKS as LooksState<SavedHairLook>,
  );
}
