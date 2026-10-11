import type { SupabaseClient } from "@supabase/supabase-js";
import { createExternalStore } from "@/lib/store/external-store";
import { outfitKey } from "@/lib/saved/outfit-key";
import {
  SAVED_LIMIT,
  TABLE,
  buildSavedRow,
  friendlySaveError,
  parseSavedRows,
  type SavedAnswers,
  type SavedOutfit,
} from "@/lib/saved/saved-outfits";
import { outfitSchema, type Outfit } from "@/lib/stylist/schema";

/*
  The one place the app keeps "which looks has this person saved".

  - The database is the source of truth. This store is only a copy of it, re-read
    after every change and whenever the visitor signs in or out.
  - Every Save and Remove button, and the Saved Styles page, reads this same store,
    so a change made anywhere shows everywhere at the same moment.
  - A change is only shown as done after the database confirmed it.
  - Operations run one at a time, so a double press cannot create a duplicate.
*/

export type SavedStatus =
  | "idle" // not loaded yet
  | "loading"
  | "ready"
  | "signed-out"
  | "unavailable" // the table or Supabase is not set up
  | "error"; // loading failed; the last known list is kept

export type SavedState = {
  status: SavedStatus;
  items: SavedOutfit[];
  // Keys of looks currently being saved or removed, so buttons can show progress.
  busyKeys: readonly string[];
  message: string | null;
};

export type SaveOutcome =
  | { ok: true; alreadySaved: boolean }
  | { ok: false; reason: "signed-out" | "unavailable" | "failed"; message: string };

export type RemoveOutcome = { ok: true } | { ok: false; message: string };

type Client = Pick<SupabaseClient, "from" | "auth">;

const INITIAL: SavedState = { status: "idle", items: [], busyKeys: [], message: null };

// Postgres "unique violation": a database uniqueness rule, if one is ever added.
const UNIQUE_VIOLATION = "23505";

export function createSavedStore(getClient: () => Client) {
  const store = createExternalStore<SavedState>(INITIAL);
  let queue: Promise<unknown> = Promise.resolve();
  let initialLoad: Promise<unknown> | null = null;

  // Runs one operation at a time, in the order requested.
  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = queue.then(task);
    queue = result.catch(() => undefined);
    return result;
  }

  function setBusy(key: string, busy: boolean) {
    store.set((state) => {
      if (busy) return { ...state, busyKeys: [...state.busyKeys, key] };
      const remaining = [...state.busyKeys];
      const index = remaining.indexOf(key);
      if (index >= 0) remaining.splice(index, 1);
      return { ...state, busyKeys: remaining };
    });
  }

  // Reads the visitor's looks from the database and replaces the copy.
  async function load(): Promise<SavedStatus> {
    let client: Client;
    try {
      client = getClient();
    } catch {
      store.set((state) => ({
        ...state,
        status: "unavailable",
        items: [],
        message: "Saving isn't available yet. Please check back soon.",
      }));
      return "unavailable";
    }

    const { data } = await client.auth.getSession();
    if (!data.session) {
      store.set((state) => ({ ...state, status: "signed-out", items: [], message: null }));
      return "signed-out";
    }

    if (store.get().status === "idle") {
      store.set((state) => ({ ...state, status: "loading" }));
    }

    const { data: rows, error } = await client
      .from(TABLE)
      .select("id, name, outfit, created_at")
      .order("created_at", { ascending: false })
      .limit(SAVED_LIMIT);

    if (error) {
      const message = friendlySaveError(error);
      const missing = message.includes("isn't available yet");
      store.set((state) => ({
        ...state,
        status: missing ? "unavailable" : "error",
        items: missing ? [] : state.items,
        message,
      }));
      return missing ? "unavailable" : "error";
    }

    store.set((state) => ({
      ...state,
      status: "ready",
      items: parseSavedRows(rows),
      message: null,
    }));
    return "ready";
  }

  return {
    getState: store.get,
    subscribe: store.subscribe,

    // Loads once; callers that arrive while it is loading share the same read.
    ensureLoaded(): Promise<unknown> {
      if (initialLoad) return initialLoad;
      if (store.get().status !== "idle") return Promise.resolve();
      initialLoad = enqueue(load);
      return initialLoad;
    },

    refresh(): Promise<SavedStatus> {
      return enqueue(load);
    },

    // The visitor signed out: forget everything immediately.
    reset() {
      queue = Promise.resolve();
      initialLoad = null;
      store.set({ ...INITIAL, status: "signed-out" });
    },

    isSaved(outfit: Outfit): boolean {
      const key = outfitKey(outfit);
      return store.get().items.some((item) => item.key === key);
    },

    /*
      Saves a look, once. It reads the database first, so a look that is already
      saved (here, in another tab, or on another device) is not saved twice.
    */
    save(outfit: Outfit, answers: SavedAnswers | null): Promise<SaveOutcome> {
      const parsed = outfitSchema.safeParse(outfit);
      if (!parsed.success) {
        return Promise.resolve({
          ok: false,
          reason: "failed",
          message: "That outfit can't be saved.",
        });
      }
      const key = outfitKey(parsed.data);

      return enqueue(async (): Promise<SaveOutcome> => {
        setBusy(key, true);
        try {
          const status = await load();
          if (status === "signed-out") {
            return { ok: false, reason: "signed-out", message: "Please sign in to save outfits." };
          }
          if (status === "unavailable") {
            return {
              ok: false,
              reason: "unavailable",
              message: store.get().message ?? "Saving isn't available yet.",
            };
          }

          if (store.get().items.some((item) => item.key === key)) {
            return { ok: true, alreadySaved: true };
          }

          const { error } = await getClient()
            .from(TABLE)
            .insert(buildSavedRow(parsed.data, answers));

          if (error && error.code !== UNIQUE_VIOLATION) {
            return { ok: false, reason: "failed", message: friendlySaveError(error) };
          }

          await load();
          return { ok: true, alreadySaved: error?.code === UNIQUE_VIOLATION };
        } catch {
          return {
            ok: false,
            reason: "failed",
            message: "We couldn't save that just now. Please try again.",
          };
        } finally {
          setBusy(key, false);
        }
      });
    },

    // Removes every saved copy of a look (used from Discover Your Style).
    removeByKey(key: string): Promise<RemoveOutcome> {
      return enqueue(async () => {
        const ids = store
          .get()
          .items.filter((item) => item.key === key)
          .map((item) => item.id);
        return removeIds(key, ids);
      });
    },

    // Removes one saved row (used from the Saved Styles page).
    removeById(id: string): Promise<RemoveOutcome> {
      return enqueue(async () => {
        const item = store.get().items.find((candidate) => candidate.id === id);
        return removeIds(item?.key ?? id, [id]);
      });
    },
  };

  async function removeIds(key: string, ids: string[]): Promise<RemoveOutcome> {
    if (ids.length === 0) return { ok: true };
    setBusy(key, true);
    try {
      const { error } = await getClient().from(TABLE).delete().in("id", ids);
      if (error) {
        return { ok: false, message: "We couldn't remove that just now. Please try again." };
      }
      // The database confirmed it; re-read so every screen shows the real list.
      await load();
      return { ok: true };
    } catch {
      return { ok: false, message: "We couldn't remove that just now. Please try again." };
    } finally {
      setBusy(key, false);
    }
  }
}

export type SavedStore = ReturnType<typeof createSavedStore>;
