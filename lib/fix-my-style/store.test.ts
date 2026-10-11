import { describe, expect, it, vi } from "vitest";
import { createWardrobeStore, type WardrobeRepository } from "./store";
import type { SavedOutfit, WardrobeItem } from "./wardrobe";

const item = (id: string, createdAt = 1): WardrobeItem => ({
  id,
  name: id,
  category: "tops",
  colours: [],
  pattern: null,
  material: null,
  style: null,
  seasons: [],
  occasions: [],
  photo: new Blob(),
  suggestedByAi: false,
  createdAt,
  updatedAt: createdAt,
});

const outfit = (id: string, itemIds: string[]): SavedOutfit => ({
  id,
  savedAt: 1,
  title: id,
  itemIds,
  layering: "l",
  whyItWorks: "w",
  occasions: ["everyday"],
  variations: [],
  additions: [],
  kind: "owned",
});

function fakeRepo(initial: { items?: WardrobeItem[]; outfits?: SavedOutfit[] } = {}) {
  const items = new Map((initial.items ?? []).map((i) => [i.id, i]));
  const outfits = new Map((initial.outfits ?? []).map((o) => [o.id, o]));
  return {
    loadAll: vi.fn(async () => ({ items: [...items.values()], outfits: [...outfits.values()] })),
    putItem: vi.fn(async (i: WardrobeItem) => void items.set(i.id, i)),
    deleteItem: vi.fn(async (id: string) => void items.delete(id)),
    putOutfit: vi.fn(async (o: SavedOutfit) => void outfits.set(o.id, o)),
    deleteOutfit: vi.fn(async (id: string) => void outfits.delete(id)),
  } satisfies WardrobeRepository;
}

describe("wardrobe store", () => {
  it("starts idle and loads newest first", async () => {
    const repo = fakeRepo({ items: [item("old", 1), item("new", 5)] });
    const store = createWardrobeStore(() => repo);
    expect(store.getState().status).toBe("idle");
    await store.ensureLoaded();
    expect(store.getState().status).toBe("ready");
    expect(store.getState().items.map((i) => i.id)).toEqual(["new", "old"]);
  });

  it("reads once even when asked several times at once", async () => {
    const repo = fakeRepo();
    const store = createWardrobeStore(() => repo);
    await Promise.all([store.ensureLoaded(), store.ensureLoaded(), store.ensureLoaded()]);
    expect(repo.loadAll).toHaveBeenCalledTimes(1);
  });

  it("reports unavailable when the browser cannot store a wardrobe", async () => {
    const store = createWardrobeStore(() => null);
    await store.ensureLoaded();
    expect(store.getState().status).toBe("unavailable");
  });

  it("reports an error, with no invented items, when reading fails", async () => {
    const repo = fakeRepo();
    repo.loadAll.mockRejectedValue(new Error("boom"));
    const store = createWardrobeStore(() => repo);
    await store.ensureLoaded();
    expect(store.getState()).toMatchObject({ status: "error", items: [] });
  });

  it("saving the same item twice keeps one copy", async () => {
    const repo = fakeRepo();
    const store = createWardrobeStore(() => repo);
    await store.ensureLoaded();
    expect(await store.saveItem(item("a"))).toBe(true);
    expect(await store.saveItem({ ...item("a"), name: "renamed" })).toBe(true);
    expect(store.getState().items).toHaveLength(1);
    expect(store.getState().items[0].name).toBe("renamed");
  });

  it("does not claim success when saving fails", async () => {
    const repo = fakeRepo();
    repo.putItem.mockRejectedValue(new Error("quota"));
    const store = createWardrobeStore(() => repo);
    await store.ensureLoaded();
    expect(await store.saveItem(item("a"))).toBe(false);
    expect(store.getState().items).toHaveLength(0);
  });

  it("removing an item also removes saved outfits that used it", async () => {
    const repo = fakeRepo({
      items: [item("a"), item("b")],
      outfits: [outfit("o1", ["a", "b"]), outfit("o2", ["b"])],
    });
    const store = createWardrobeStore(() => repo);
    await store.ensureLoaded();
    expect(await store.removeItem("a")).toBe(true);
    expect(store.getState().items.map((i) => i.id)).toEqual(["b"]);
    expect(store.getState().outfits.map((o) => o.id)).toEqual(["o2"]);
  });

  it("saves outfits without duplicating, and removes them", async () => {
    const repo = fakeRepo({ items: [item("a")] });
    const store = createWardrobeStore(() => repo);
    await store.ensureLoaded();
    await store.saveOutfit(outfit("o1", ["a"]));
    await store.saveOutfit(outfit("o1", ["a"]));
    expect(store.getState().outfits).toHaveLength(1);
    await store.removeOutfit("o1");
    expect(store.getState().outfits).toHaveLength(0);
  });

  it("toggling an outfit saves it once, then removes it", async () => {
    const repo = fakeRepo({ items: [item("a")] });
    const store = createWardrobeStore(() => repo);
    await store.ensureLoaded();
    const idea = {
      title: "Easy day",
      itemIds: ["a"],
      layering: "l",
      whyItWorks: "w",
      occasions: ["everyday" as const],
      variations: [],
      additions: [],
      kind: "owned" as const,
    };
    await store.toggleOutfit(idea);
    expect(store.getState().outfits).toHaveLength(1);
    await store.toggleOutfit(idea);
    expect(store.getState().outfits).toHaveLength(0);
  });
});
