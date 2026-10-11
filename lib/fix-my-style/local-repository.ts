import type { WardrobeRepository } from "./store";
import type { SavedOutfit, WardrobeItem } from "./wardrobe";

/*
  Keeps the wardrobe in this browser's IndexedDB. Nothing leaves the device: photos
  and details are stored locally, are private to this browser profile, and are
  removed if the person clears site data. It needs no account and no server.
*/

const DB_NAME = "veyoraq-wardrobe";
const DB_VERSION = 1;
const ITEMS = "items";
const OUTFITS = "outfits";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ITEMS)) db.createObjectStore(ITEMS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(OUTFITS)) db.createObjectStore(OUTFITS, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("open failed"));
    request.onblocked = () => reject(new Error("open blocked"));
  });
}

async function run<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const request = action(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error ?? new Error("transaction failed"));
      transaction.onabort = () => reject(transaction.error ?? new Error("transaction aborted"));
    });
  } finally {
    db.close();
  }
}

export function createLocalRepository(): WardrobeRepository | null {
  if (typeof indexedDB === "undefined") return null;
  return {
    async loadAll() {
      const [items, outfits] = await Promise.all([
        run<WardrobeItem[]>(ITEMS, "readonly", (store) => store.getAll()),
        run<SavedOutfit[]>(OUTFITS, "readonly", (store) => store.getAll()),
      ]);
      return { items, outfits };
    },
    async putItem(item) {
      await run(ITEMS, "readwrite", (store) => store.put(item));
    },
    async deleteItem(id) {
      await run(ITEMS, "readwrite", (store) => store.delete(id));
    },
    async putOutfit(outfit) {
      await run(OUTFITS, "readwrite", (store) => store.put(outfit));
    },
    async deleteOutfit(id) {
      await run(OUTFITS, "readwrite", (store) => store.delete(id));
    },
  };
}
