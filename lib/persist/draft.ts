import { createExternalStore } from "@/lib/store/external-store";

/*
  A small, versioned "draft" kept in the browser so a refresh does not lose
  someone's progress through a quiz.

  - Only plain, non-sensitive answers belong here. Never photos, tokens or keys.
  - The stored value is checked by the caller's validate() on every load, so old,
    edited or corrupted data is ignored instead of crashing the page.
  - It expires, so a draft left on a shared device does not linger.
  - Server rendering and the first client render both use `initial`; the stored
    value is read lazily on the client, so React never sees a hydration mismatch.
*/

type Envelope = { v: number; savedAt: number; data: unknown };

export type DraftOptions<T> = {
  // Storage key. Include the page, e.g. "veyoraq:draft:style-quiz".
  key: string;
  // Bump when the stored shape changes; older drafts are then dropped.
  version: number;
  initial: T;
  // Returns a clean value, or null when the stored data is not usable.
  validate: (data: unknown) => T | null;
  // Defaults to 7 days.
  ttlMs?: number;
  // Replaceable for tests.
  storage?: () => Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
  now?: () => number;
};

const WEEK = 7 * 24 * 60 * 60 * 1000;

function browserStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // blocked (private mode, cookies disabled)
  }
}

export function createDraftStore<T>(options: DraftOptions<T>) {
  const { key, version, initial, validate } = options;
  const ttl = options.ttlMs ?? WEEK;
  const getStorage = options.storage ?? browserStorage;
  const now = options.now ?? Date.now;

  const store = createExternalStore<T>(initial);
  let loaded = false;
  // True when this page load found a usable earlier draft.
  let restored = false;

  function read(): T | null {
    const storage = getStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const envelope = JSON.parse(raw) as Envelope;
      if (
        !envelope ||
        envelope.v !== version ||
        typeof envelope.savedAt !== "number" ||
        now() - envelope.savedAt > ttl
      ) {
        storage.removeItem(key);
        return null;
      }
      const clean = validate(envelope.data);
      if (clean === null) storage.removeItem(key);
      return clean;
    } catch {
      // Not valid JSON (or storage threw): forget it so it is not tried again.
      try {
        storage.removeItem(key);
      } catch {
        // ignore
      }
      return null;
    }
  }

  // Reads the stored draft once, on first use in the browser.
  function ensureLoaded() {
    if (loaded || !getStorage()) return;
    loaded = true;
    const stored = read();
    if (stored !== null) {
      restored = true;
      store.set(stored);
    }
  }

  function persist(value: T) {
    const storage = getStorage();
    if (!storage) return;
    try {
      const envelope: Envelope = { v: version, savedAt: now(), data: value };
      storage.setItem(key, JSON.stringify(envelope));
    } catch {
      // Storage full or blocked: the quiz still works, it just will not survive a refresh.
    }
  }

  return {
    subscribe: store.subscribe,
    // The value React reads on the client.
    getSnapshot(): T {
      ensureLoaded();
      return store.get();
    },
    getServerSnapshot(): T {
      return initial;
    },
    set(next: T | ((previous: T) => T)) {
      ensureLoaded();
      store.set(next);
      persist(store.get());
    },
    // Start Over: forgets the draft and returns to the initial value.
    clear() {
      loaded = true;
      restored = false;
      const storage = getStorage();
      try {
        storage?.removeItem(key);
      } catch {
        // ignore
      }
      store.set(initial);
    },
    wasRestored(): boolean {
      ensureLoaded();
      return restored;
    },
  };
}

export type DraftStore<T> = ReturnType<typeof createDraftStore<T>>;
