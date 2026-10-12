import { createExternalStore } from "@/lib/store/external-store";
import type { ItemCategory } from "./schema";

/*
  Saved looks, kept in this browser's IndexedDB. Nothing leaves the device. Keeping
  looks in a Supabase account would need a table and a private storage bucket, which
  are proposed in supabase/proposed/ and have not been approved or applied.

  The store is generic so FIX My Style and Hair Studio each keep their own kind of
  look in their own database.
*/

export type Saveable = { id: string; savedAt: number };

export type SavedLook = Saveable & {
  original: Blob;
  // The generated picture, when image generation produced one.
  styled: Blob | null;
  assessment: string;
  improvements: string[];
  items: { name: string; category: ItemCategory }[];
  additions: { name: string; why: string; tip: string }[];
};

export interface LooksRepository<T extends Saveable = SavedLook> {
  loadAll(): Promise<T[]>;
  put(look: T): Promise<void>;
  remove(id: string): Promise<void>;
}

export type LooksState<T extends Saveable = SavedLook> = {
  status: "idle" | "loading" | "ready" | "unavailable" | "error";
  looks: T[];
};

export const IDLE_LOOKS: LooksState<never> = { status: "idle", looks: [] };

export function createLooksStore<T extends Saveable = SavedLook>(
  getRepository: () => LooksRepository<T> | null,
) {
  const newestFirst = (a: T, b: T) => b.savedAt - a.savedAt;
  const store = createExternalStore<LooksState<T>>(IDLE_LOOKS);
  let loading: Promise<void> | null = null;

  const repo = (): LooksRepository<T> | null => {
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
    async save(look: T): Promise<boolean> {
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

export type LooksStore<T extends Saveable = SavedLook> = ReturnType<typeof createLooksStore<T>>;

const STORE = "looks";

function open(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is not available"));
    const request = indexedDB.open(dbName, 1);
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

async function run<R>(
  dbName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<R>,
): Promise<R> {
  const db = await open(dbName);
  try {
    return await new Promise<R>((resolve, reject) => {
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

export function createLocalLooksRepository<T extends Saveable = SavedLook>(
  dbName = "veyoraq-looks",
): LooksRepository<T> | null {
  if (typeof indexedDB === "undefined") return null;
  return {
    loadAll: () => run<T[]>(dbName, "readonly", (store) => store.getAll()),
    put: async (look) => void (await run(dbName, "readwrite", (store) => store.put(look))),
    remove: async (id) => void (await run(dbName, "readwrite", (store) => store.delete(id))),
  };
}
