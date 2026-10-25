"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  createLocalLooksRepository,
  createLooksStore,
  IDLE_LOOKS,
  type LooksRepository,
  type LooksState,
  type Saveable,
} from "@/lib/fix-my-style/looks";
import { isFitReport, type FitReport } from "./report";

// A saved Fit Guidance report: the guidance text and what was shared, never a photo.
export type SavedFitReport = Saveable & { report: FitReport };

export const FIT_REPORTS_DB = "veyoraq-fit-reports";

/*
  Saved on this device only (IndexedDB). There is no account table for these yet, so
  they do not follow the person to another device. Anything unreadable is skipped.
*/
function repository(): LooksRepository<SavedFitReport> | null {
  const local = createLocalLooksRepository<SavedFitReport>(FIT_REPORTS_DB);
  if (!local) return null;
  return {
    ...local,
    loadAll: async () => (await local.loadAll()).filter((entry) => isFitReport(entry.report)),
  };
}

export const fitReportsStore = createLooksStore<SavedFitReport>(repository);

export function useFitReports(): LooksState<SavedFitReport> {
  useEffect(() => {
    void fitReportsStore.ensureLoaded();
  }, []);
  return useSyncExternalStore(
    fitReportsStore.subscribe,
    fitReportsStore.getState,
    () => IDLE_LOOKS as LooksState<SavedFitReport>,
  );
}
