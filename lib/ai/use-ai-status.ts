"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createExternalStore } from "@/lib/store/external-store";

/*
  Which AI features this site can use right now, asked of the server once per page
  load. "unknown" means the check itself failed; callers should then still allow
  the person to try, and let the real request report any problem.
*/
export type AiStatus =
  | { state: "loading" }
  | { state: "unknown" }
  | { state: "ready"; text: boolean; images: boolean };

const LOADING: AiStatus = { state: "loading" };
const store = createExternalStore<AiStatus>(LOADING);
let started = false;

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  fetch("/api/stylist/status", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error("status"))))
    .then((body: { text?: unknown; images?: unknown }) => {
      store.set({
        state: "ready",
        text: body.text === true,
        images: body.images === true,
      });
    })
    .catch(() => {
      store.set({ state: "unknown" });
      started = false; // allow another attempt on the next page that asks
    });
}

export function useAiStatus(): AiStatus {
  useEffect(start, []);
  return useSyncExternalStore(store.subscribe, store.get, () => LOADING);
}
