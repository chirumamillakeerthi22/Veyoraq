"use client";

import { useSyncExternalStore } from "react";
import { audienceStore, type Audience } from "./audience";

// The server and the first client render both use the default, so hydration never
// mismatches; the stored choice is applied right after.
export function useAudience(): Audience {
  return useSyncExternalStore(
    audienceStore.subscribe,
    audienceStore.getSnapshot,
    audienceStore.getServerSnapshot,
  ).audience;
}

export function setAudience(audience: Audience) {
  audienceStore.set({ audience });
}
