import { createExternalStore } from "@/lib/store/external-store";
import type { ItemCategory } from "./schema";

/*
  Saved looks, kept in this browser's IndexedDB. Nothing leaves the device. Keeping
  looks in a Supabase account would need a table and a private storage bucket, which
  are proposed in supabase/proposed/ and have not been approved or applied.
*/

export type SavedLook = {
  id: string;
  savedAt: number;
  original: Blob;
  // The generated picture, when image generation produced one.
  styled: Blob | null;
  assessment: string;
  improvements: string[];
  items: { name: string; category: ItemCategory }[];
  additions: { name: string; why: string; tip: string }[];
};

export interface LooksRepository {
  loadAll(): Promise<SavedLook[]>;
  put(look: SavedLook): Promise<void>;
  remove(id: string): Promise<void>;
}

export type LooksState = {
  status: "idle" | "loading" | "ready" | "unavailable" | "error";
  looks: SavedLook[];
};

export const IDLE_LOOKS: LooksState = { status: "idle", looks: [] };

const newestFirst = (a: SavedLook, b: SavedLook) => b.savedAt - a.savedAt;

export function createLooksStore(getRepository: () => LooksRepository | null) {
  const store = createExternalStore<LooksState>(IDLE_LOOKS);
  let loading: Promise<void> | null = null;

  const repo = (): LooksRepository | null => {
    try {
      return getRepository();
    } catch {
      return null;
    }
  };

  async function load() {
    const repository = repo();
    if (!repository) return store.set({ status: "unavailable", looks: [] });
    store.set((state) => (state.status === "ready" ? state : { ...state, status: "loading" }));
    try {
      const looks = await repository.loadAll();
      store.set({ status: "ready", looks: [...looks].sort(newestFirst) });
    } catch {
      store.set((state) => ({ ...state, status: "error" }));
    }
  }

  return {
    subscribe: store.subscribe,
    getState: store.get,

    ensureLoaded(): Promise<void> {
      if (store.get().status === "ready") return Promise.resolve();
      loading ??= load().finally(() => {
        loading = null;
      });
      return loading;
    },

    // Saving is idempotent: the same id replaces the same look, so a retry cannot
    // create a duplicate. Returns false when it could not be stored.
    async save(look: SavedLook): Promise<boolean> {
      const repository = repo();
      if (!repository) return false;
      try {
        await repository.put(look);
      } catch {
        return false;
      }
      store.set((state) => ({
        status: "ready",
        looks: [look, ...state.looks.filter((entry) => entry.id !== look.id)].sort(newestFirst),
      }));
      return true;
    },

    async remove(id: string): Promise<boolean> {
      const repository = repo();
      if (!repository) return false;
      try {
        await repository.remove(id);
      } catch {
        return false;
      }
      store.set((state) => ({ ...state, looks: state.looks.filter((entry) => entry.id !== id) }));
      return true;
    },
  };
}

export type LooksStore = ReturnType<typeof createLooksStore>;

const DB_NAME = "veyoraq-looks";
const STORE = "looks";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is not available"));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("open failed"));
    request.onblocked = () => reject(new Error("open blocked"));
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error ?? new Error("transaction failed"));
      transaction.onabort = () => reject(transaction.error ?? new Error("transaction aborted"));
    });
  } finally {
    db.close();
  }
}

export function createLocalLooksRepository(): LooksRepository | null {
  if (typeof indexedDB === "undefined") return null;
  return {
    loadAll: () => run<SavedLook[]>("readonly", (store) => store.getAll()),
    put: async (look) => void (await run("readwrite", (store) => store.put(look))),
    remove: async (id) => void (await run("readwrite", (store) => store.delete(id))),
  };
}
