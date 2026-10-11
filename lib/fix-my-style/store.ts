import { createExternalStore } from "@/lib/store/external-store";
import type { CleanOutfit } from "./schema";
import { outfitId, type SavedOutfit, type WardrobeItem } from "./wardrobe";

/*
  The wardrobe's shared state. Everything that shows the wardrobe reads this one
  store, and every change goes through the repository, which today keeps data on
  this device. A Supabase-backed repository can replace it once the proposed
  tables and storage policies are approved (see supabase/proposed/).
*/

export interface WardrobeRepository {
  loadAll(): Promise<{ items: WardrobeItem[]; outfits: SavedOutfit[] }>;
  putItem(item: WardrobeItem): Promise<void>;
  deleteItem(id: string): Promise<void>;
  putOutfit(outfit: SavedOutfit): Promise<void>;
  deleteOutfit(id: string): Promise<void>;
}

export type WardrobeState = {
  // idle: not read yet. unavailable: this browser cannot store a wardrobe.
  status: "idle" | "loading" | "ready" | "unavailable" | "error";
  items: WardrobeItem[];
  outfits: SavedOutfit[];
};

export const IDLE_STATE: WardrobeState = { status: "idle", items: [], outfits: [] };

const byNewest = <T extends { createdAt?: number; savedAt?: number }>(a: T, b: T) =>
  (b.createdAt ?? b.savedAt ?? 0) - (a.createdAt ?? a.savedAt ?? 0);

export function createWardrobeStore(getRepository: () => WardrobeRepository | null) {
  const store = createExternalStore<WardrobeState>(IDLE_STATE);
  let loading: Promise<void> | null = null;

  function repo(): WardrobeRepository | null {
    try {
      return getRepository();
    } catch {
      return null;
    }
  }

  async function load() {
    const repository = repo();
    if (!repository) {
      store.set({ status: "unavailable", items: [], outfits: [] });
      return;
    }
    store.set((state) => (state.status === "ready" ? state : { ...state, status: "loading" }));
    try {
      const { items, outfits } = await repository.loadAll();
      store.set({
        status: "ready",
        items: [...items].sort(byNewest),
        outfits: [...outfits].sort(byNewest),
      });
    } catch {
      store.set((state) => ({ ...state, status: "error" }));
    }
  }

  return {
    subscribe: store.subscribe,
    getState: store.get,

    // Reads the wardrobe once; later calls reuse the same read.
    ensureLoaded(): Promise<void> {
      if (store.get().status === "ready") return Promise.resolve();
      loading ??= load().finally(() => {
        loading = null;
      });
      return loading;
    },

    reload(): Promise<void> {
      loading = null;
      return load();
    },

    // Saving is idempotent: the same id replaces the same item, so a retry cannot
    // create a duplicate.
    async saveItem(item: WardrobeItem): Promise<boolean> {
      const repository = repo();
      if (!repository) return false;
      try {
        await repository.putItem(item);
      } catch {
        return false;
      }
      store.set((state) => ({
        ...state,
        status: "ready",
        items: [item, ...state.items.filter((existing) => existing.id !== item.id)].sort(byNewest),
      }));
      return true;
    },

    // Removes the garment, its photo, and any saved outfit that used it.
    async removeItem(id: string): Promise<boolean> {
      const repository = repo();
      if (!repository) return false;
      const dependants = store.get().outfits.filter((outfit) => outfit.itemIds.includes(id));
      try {
        await repository.deleteItem(id);
        for (const outfit of dependants) await repository.deleteOutfit(outfit.id);
      } catch {
        return false;
      }
      const gone = new Set(dependants.map((outfit) => outfit.id));
      store.set((state) => ({
        ...state,
        items: state.items.filter((item) => item.id !== id),
        outfits: state.outfits.filter((outfit) => !gone.has(outfit.id)),
      }));
      return true;
    },

    async saveOutfit(outfit: SavedOutfit): Promise<boolean> {
      const repository = repo();
      if (!repository) return false;
      try {
        await repository.putOutfit(outfit);
      } catch {
        return false;
      }
      store.set((state) => ({
        ...state,
        outfits: [outfit, ...state.outfits.filter((existing) => existing.id !== outfit.id)].sort(
          byNewest,
        ),
      }));
      return true;
    },

    // Saves the outfit, or removes it if this exact combination is already saved.
    // The same combination always has the same id, so a retry cannot duplicate it.
    async toggleOutfit(outfit: CleanOutfit): Promise<boolean> {
      const id = outfitId(outfit);
      const exists = store.get().outfits.some((saved) => saved.id === id);
      if (exists) return this.removeOutfit(id);
      return this.saveOutfit({ ...outfit, id, savedAt: Date.now() });
    },

    async removeOutfit(id: string): Promise<boolean> {
      const repository = repo();
      if (!repository) return false;
      try {
        await repository.deleteOutfit(id);
      } catch {
        return false;
      }
      store.set((state) => ({
        ...state,
        outfits: state.outfits.filter((outfit) => outfit.id !== id),
      }));
      return true;
    },
  };
}

export type WardrobeStore = ReturnType<typeof createWardrobeStore>;
