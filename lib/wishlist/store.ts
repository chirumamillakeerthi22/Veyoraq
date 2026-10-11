import type { SupabaseClient } from "@supabase/supabase-js";
import { createExternalStore } from "@/lib/store/external-store";
import {
  WISHLIST_LIMIT,
  WISHLIST_TABLE,
  friendlyWishlistError,
  parseWishlistRows,
  type WishlistItem,
} from "./wishlist";

/*
  The one shared copy of the signed-in visitor's wishlist, in the same style as the
  saved-looks store: the database is the truth, every screen reads this copy, and a
  removal only shows once the database confirmed it.
*/

export type WishlistState = {
  status: "idle" | "loading" | "ready" | "signed-out" | "unavailable" | "error";
  items: WishlistItem[];
  busyIds: readonly string[];
  message: string | null;
};

type Client = Pick<SupabaseClient, "from" | "auth">;

const INITIAL: WishlistState = { status: "idle", items: [], busyIds: [], message: null };

export function createWishlistStore(getClient: () => Client) {
  const store = createExternalStore<WishlistState>(INITIAL);
  let queue: Promise<unknown> = Promise.resolve();
  let initialLoad: Promise<unknown> | null = null;

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = queue.then(task);
    queue = result.catch(() => undefined);
    return result;
  }

  async function load() {
    let client: Client;
    try {
      client = getClient();
    } catch {
      store.set((state) => ({
        ...state,
        status: "unavailable",
        items: [],
        message: "Wishlist isn't available yet. Please check back soon.",
      }));
      return;
    }

    const { data } = await client.auth.getSession();
    if (!data.session) {
      store.set((state) => ({ ...state, status: "signed-out", items: [], message: null }));
      return;
    }
    if (store.get().status === "idle") {
      store.set((state) => ({ ...state, status: "loading" }));
    }

    const { data: rows, error } = await client
      .from(WISHLIST_TABLE)
      .select("id, name, image_url, price_amount, price_currency, retailer, product_url, created_at")
      .order("created_at", { ascending: false })
      .limit(WISHLIST_LIMIT);

    if (error) {
      const info = friendlyWishlistError(error);
      store.set((state) => ({
        ...state,
        status: info.unavailable ? "unavailable" : "error",
        items: info.unavailable ? [] : state.items,
        message: info.message,
      }));
      return;
    }

    store.set((state) => ({
      ...state,
      status: "ready",
      items: parseWishlistRows(rows),
      message: null,
    }));
  }

  return {
    getState: store.get,
    subscribe: store.subscribe,

    ensureLoaded(): Promise<unknown> {
      if (initialLoad) return initialLoad;
      if (store.get().status !== "idle") return Promise.resolve();
      initialLoad = enqueue(load);
      return initialLoad;
    },

    refresh(): Promise<unknown> {
      return enqueue(load);
    },

    reset() {
      queue = Promise.resolve();
      initialLoad = null;
      store.set({ ...INITIAL, status: "signed-out" });
    },

    remove(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
      return enqueue(async () => {
        store.set((state) => ({ ...state, busyIds: [...state.busyIds, id] }));
        try {
          const { error } = await getClient().from(WISHLIST_TABLE).delete().eq("id", id);
          if (error) {
            return { ok: false as const, message: "We couldn't remove that just now. Please try again." };
          }
          await load();
          return { ok: true as const };
        } catch {
          return { ok: false as const, message: "We couldn't remove that just now. Please try again." };
        } finally {
          store.set((state) => ({ ...state, busyIds: state.busyIds.filter((item) => item !== id) }));
        }
      });
    },
  };
}
