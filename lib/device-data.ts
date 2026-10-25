/*
  Removing what VEYORAQ keeps in this browser: small items in localStorage (all named
  "veyoraq:...") and the on-device looks and reports databases. It never touches the
  account or anything saved to it, and it does not sign anyone out.
*/

export const DEVICE_STORAGE_PREFIX = "veyoraq:";
export const DEVICE_DATABASES = [
  "veyoraq-colour-reports",
  "veyoraq-hair-looks",
  "veyoraq-looks",
  "veyoraq-fit-reports",
] as const;

type KeyedStorage = Pick<Storage, "length" | "key" | "removeItem">;

// Removes every VEYORAQ key and returns how many were removed.
export function clearVeyoraqStorage(storage: KeyedStorage): number {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith(DEVICE_STORAGE_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
  return keys.length;
}

function deleteDatabase(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
      request.onblocked = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

// Returns true only when everything was removed.
export async function clearDeviceData(): Promise<boolean> {
  let ok = true;
  try {
    clearVeyoraqStorage(window.localStorage);
  } catch {
    ok = false;
  }
  if (typeof indexedDB !== "undefined") {
    const results = await Promise.all(DEVICE_DATABASES.map(deleteDatabase));
    if (results.some((result) => !result)) ok = false;
  }
  return ok;
}
