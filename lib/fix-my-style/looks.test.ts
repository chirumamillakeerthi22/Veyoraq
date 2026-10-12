import { describe, expect, it, vi } from "vitest";
import { createLooksStore, type LooksRepository, type SavedLook } from "./looks";

const look = (id: string, savedAt = 1): SavedLook => ({
  id,
  savedAt,
  original: new Blob(),
  styled: null,
  assessment: "a",
  improvements: [],
  items: [],
  additions: [],
});

function fakeRepo(initial: SavedLook[] = []) {
  const rows = new Map(initial.map((entry) => [entry.id, entry]));
  return {
    loadAll: vi.fn(async () => [...rows.values()]),
    put: vi.fn(async (entry: SavedLook) => void rows.set(entry.id, entry)),
    remove: vi.fn(async (id: string) => void rows.delete(id)),
  } satisfies LooksRepository;
}

describe("looks store", () => {
  it("loads newest first and reads only once", async () => {
    const repo = fakeRepo([look("old", 1), look("new", 9)]);
    const store = createLooksStore(() => repo);
    await Promise.all([store.ensureLoaded(), store.ensureLoaded()]);
    expect(repo.loadAll).toHaveBeenCalledTimes(1);
    expect(store.getState().looks.map((entry) => entry.id)).toEqual(["new", "old"]);
  });

  it("reports unavailable when the browser cannot store looks", async () => {
    const store = createLooksStore(() => null);
    await store.ensureLoaded();
    expect(store.getState().status).toBe("unavailable");
    expect(await store.save(look("a"))).toBe(false);
  });

  it("saving twice keeps one copy and does not claim success on failure", async () => {
    const repo = fakeRepo();
    const store = createLooksStore(() => repo);
    await store.ensureLoaded();
    expect(await store.save(look("a"))).toBe(true);
    expect(await store.save(look("a", 5))).toBe(true);
    expect(store.getState().looks).toHaveLength(1);

    repo.put.mockRejectedValue(new Error("quota"));
    expect(await store.save(look("b"))).toBe(false);
    expect(store.getState().looks.map((entry) => entry.id)).toEqual(["a"]);
  });

  it("removes a look", async () => {
    const repo = fakeRepo([look("a")]);
    const store = createLooksStore(() => repo);
    await store.ensureLoaded();
    expect(await store.remove("a")).toBe(true);
    expect(store.getState().looks).toHaveLength(0);
  });
});
