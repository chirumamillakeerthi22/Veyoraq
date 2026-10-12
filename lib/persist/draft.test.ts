import { describe, expect, it } from "vitest";
import { createDraftStore } from "./draft";

type Draft = { step: number; picks: string[] };
const initial: Draft = { step: 0, picks: [] };

const validate = (data: unknown): Draft | null => {
  const d = data as Partial<Draft> | null;
  if (!d || typeof d.step !== "number" || !Array.isArray(d.picks)) return null;
  if (!d.picks.every((entry) => typeof entry === "string")) return null;
  return { step: d.step, picks: d.picks };
};

function fakeStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    data,
    storage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    },
  };
}

const make = (fake: ReturnType<typeof fakeStorage>, now = () => 1_000, version = 1) =>
  createDraftStore<Draft>({
    key: "test",
    version,
    initial,
    validate,
    storage: () => fake.storage,
    now,
  });

describe("draft store", () => {
  it("starts from the initial value and saves every change", () => {
    const fake = fakeStorage();
    const store = make(fake);
    expect(store.getSnapshot()).toEqual(initial);
    store.set({ step: 3, picks: ["a", "b"] });
    expect(JSON.parse(fake.data.get("test")!)).toMatchObject({ v: 1, data: { step: 3, picks: ["a", "b"] } });
  });

  it("restores an earlier draft on the next page load", () => {
    const fake = fakeStorage();
    make(fake).set({ step: 4, picks: ["x"] });

    const reloaded = make(fake);
    expect(reloaded.getServerSnapshot()).toEqual(initial); // server and first render agree
    expect(reloaded.getSnapshot()).toEqual({ step: 4, picks: ["x"] });
    expect(reloaded.wasRestored()).toBe(true);
  });

  it("supports functional updates built on the restored value", () => {
    const fake = fakeStorage();
    make(fake).set({ step: 2, picks: ["a"] });
    const reloaded = make(fake);
    reloaded.set((previous) => ({ ...previous, picks: [...previous.picks, "b"] }));
    expect(reloaded.getSnapshot()).toEqual({ step: 2, picks: ["a", "b"] });
  });

  it("ignores and removes corrupt, invalid or outdated data", () => {
    for (const raw of ["not json", JSON.stringify({ v: 1, savedAt: 1_000, data: { step: "x" } })]) {
      const fake = fakeStorage({ test: raw });
      const store = make(fake);
      expect(store.getSnapshot()).toEqual(initial);
      expect(store.wasRestored()).toBe(false);
      expect(fake.data.has("test")).toBe(false);
    }
  });

  it("drops a draft saved under an older version", () => {
    const fake = fakeStorage();
    make(fake, () => 1_000, 1).set({ step: 5, picks: [] });
    const upgraded = make(fake, () => 1_000, 2);
    expect(upgraded.getSnapshot()).toEqual(initial);
    expect(fake.data.has("test")).toBe(false);
  });

  it("expires old drafts", () => {
    const fake = fakeStorage();
    make(fake, () => 1_000).set({ step: 5, picks: [] });
    const later = make(fake, () => 1_000 + 8 * 24 * 60 * 60 * 1000);
    expect(later.getSnapshot()).toEqual(initial);
  });

  it("Start Over forgets the draft", () => {
    const fake = fakeStorage();
    const store = make(fake);
    store.set({ step: 6, picks: ["a"] });
    store.clear();
    expect(store.getSnapshot()).toEqual(initial);
    expect(fake.data.has("test")).toBe(false);
    expect(make(fake).getSnapshot()).toEqual(initial);
  });

  it("keeps working when storage is unavailable", () => {
    const store = createDraftStore<Draft>({
      key: "test",
      version: 1,
      initial,
      validate,
      storage: () => null,
    });
    store.set({ step: 1, picks: [] });
    expect(store.getSnapshot()).toEqual({ step: 1, picks: [] });
  });
});
