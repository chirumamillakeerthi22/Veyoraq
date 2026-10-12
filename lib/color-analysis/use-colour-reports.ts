"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  createLocalLooksRepository,
  createLooksStore,
  IDLE_LOOKS,
  type LooksState,
  type Saveable,
} from "@/lib/fix-my-style/looks";
import type { ColourAnalysis } from "./schema";

// A saved colour report. Kept only in this browser; it holds no photo.
export type SavedColourReport = Saveable & { analysis: ColourAnalysis };

export const colourReportsStore = createLooksStore<SavedColourReport>(() =>
  createLocalLooksRepository<SavedColourReport>("veyoraq-colour-reports"),
);

export function useColourReports(): LooksState<SavedColourReport> {
  useEffect(() => {
    void colourReportsStore.ensureLoaded();
  }, []);
  return useSyncExternalStore(
    colourReportsStore.subscribe,
    colourReportsStore.getState,
    () => IDLE_LOOKS as LooksState<SavedColourReport>,
  );
}
