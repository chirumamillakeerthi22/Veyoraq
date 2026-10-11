import { describe, expect, it, vi } from "vitest";
import { validOutput } from "@/lib/stylist/fixtures";
import { outfitKey } from "./outfit-key";
import { createSavedStore } from "./store";

const outfit = validOutput.outfits[0];
const other = { ...outfit, name: "Another Look" };
const answers = {
  occasion: "work",
  styles: ["minimal"],
  colours: [],
  budgetTier: "mid",
  currency: "INR",
} as never;

type Row = { id: string; name: string; outfit: unknown; created_at: string };

// A small in-memory stand-in for the Supabase client and the saved_outfits table.
function fakeDatabase(options: {
  signedIn?: boolean;
  rows?: Row[];
  selectError?: unknown;
  insertError?: unknown;
  deleteError?: unknown;
} = {}) {
  const { signedIn = true } = options;
  const state = { rows: [...(options.rows ?? [])], inserts: 0, deletes: [] as string[][], selects: 0 };
  let counter = 0;

  const client = {
    auth: {
      getSession: async () => ({ data: { session: signedIn ? { user: {} } : null } }),
    },
    from: () => ({
      select: () => ({
        order: () => ({
          limit: async () => {
            state.selects += 1;
            return options.selectError
              ? { data: null, error: options.selectError }
              : { data: [...state.rows], error: null };
          },
        }),
      }),
      insert: async (row: { name: string; outfit: unknown }) => {
        if (options.insertError) return { error: options.insertError };
        state.inserts += 1;
        counter += 1;
        state.rows.unshift({
          id: `row-${counter}`,
          name: row.name,
          outfit: row.outfit,
          created_at: new Date(2026, 9, 11, 10, counter).toISOString(),
        });
        return { error: null };
      },
      delete: () => ({
        in: async (_column: string, ids: string[]) => {
          if (options.deleteError) return { error: options.deleteError };
          state.deletes.push(ids);
          state.rows = state.rows.filter((row) => !ids.includes(row.id));
          return { error: null };
        },
      }),
    }),
  };
  return { client: client as never, state };
}

const row = (id: string, value = outfit): Row => ({
  id,
  name: value.name,
  outfit: value,
  created_at: "2026-10-11T10:00:00Z",
});

describe("loading", () => {
  it("shows the visitor's looks, with a key for each", async () => {
    const { client } = fakeDatabase({ rows: [row("a"), row("b", other)] });
    const store = createSavedStore(() => client);
    await store.ensureLoaded();
    const state = store.getState();
    expect(state.status).toBe("ready");
    expect(state.items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(state.items[0].key).toBe(outfitKey(outfit));
  });

  it("reports signed out, with nothing, when there is no session", async () => {
    const { client, state } = fakeDatabase({ signedIn: false, rows: [row("a")] });
    const store = createSavedStore(() => client);
    await store.ensureLoaded();
    expect(store.getState()).toMatchObject({ status: "signed-out", items: [] });
    expect(state.selects).toBe(0);
  });

  it("reports unavailable while the table does not exist", async () => {
    const { client } = fakeDatabase({ selectError: { code: "PGRST205" } });
    const store = createSavedStore(() => client);
    await store.ensureLoaded();
    expect(store.getState().status).toBe("unavailable");
  });

  it("keeps the last known list when a later refresh fails", async () => {
    const database = fakeDatabase({ rows: [row("a")] });
    const store = createSavedStore(() => database.client);
    await store.ensureLoaded();
    const failing = fakeDatabase({ selectError: { code: "XX000", message: "boom" } });
    const store2 = createSavedStore(() => failing.client);
    await store2.refresh();
    expect(store2.getState().status).toBe("error");
    expect(store.getState().items).toHaveLength(1);
  });

  it("only loads once when asked repeatedly", async () => {
    const { client, state } = fakeDatabase();
    const store = createSavedStore(() => client);
    await Promise.all([store.ensureLoaded(), store.ensureLoaded(), store.ensureLoaded()]);
    expect(state.selects).toBe(1);
  });
});

describe("save", () => {
  it("saves a look once and then reports it as saved", async () => {
    const { client, state } = fakeDatabase();
    const store = createSavedStore(() => client);
    expect(await store.save(outfit, answers)).toEqual({ ok: true, alreadySaved: false });
    expect(state.inserts).toBe(1);
    expect(store.isSaved(outfit)).toBe(true);
    expect(store.isSaved(other)).toBe(false);
  });

  it("does not create a duplicate for a look that is already saved", async () => {
    const { client, state } = fakeDatabase({ rows: [row("existing")] });
    const store = createSavedStore(() => client);
    expect(await store.save(outfit, answers)).toEqual({ ok: true, alreadySaved: true });
    expect(state.inserts).toBe(0);
    expect(state.rows).toHaveLength(1);
  });

  it("does not create a duplicate on a rapid double press", async () => {
    const { client, state } = fakeDatabase();
    const store = createSavedStore(() => client);
    const [first, second] = await Promise.all([
      store.save(outfit, answers),
      store.save(outfit, answers),
    ]);
    expect(first).toEqual({ ok: true, alreadySaved: false });
    expect(second).toEqual({ ok: true, alreadySaved: true });
    expect(state.inserts).toBe(1);
    expect(state.rows).toHaveLength(1);
  });

  it("treats a database uniqueness rejection as already saved", async () => {
    const { client } = fakeDatabase({ insertError: { code: "23505" } });
    const store = createSavedStore(() => client);
    expect(await store.save(outfit, answers)).toEqual({ ok: true, alreadySaved: true });
  });

  it("does not show a look as saved when the database refused it", async () => {
    const { client } = fakeDatabase({ insertError: { code: "XX000", message: "internal detail" } });
    const store = createSavedStore(() => client);
    const result = await store.save(outfit, answers);
    expect(result).toMatchObject({ ok: false, reason: "failed" });
    expect(JSON.stringify(result)).not.toContain("internal detail");
    expect(store.isSaved(outfit)).toBe(false);
  });

  it("explains the 100-look limit", async () => {
    const { client } = fakeDatabase({ insertError: { code: "P0001", message: "limit reached (100)" } });
    const store = createSavedStore(() => client);
    expect(JSON.stringify(await store.save(outfit, answers))).toMatch(/limit of 100/);
  });

  it("refuses when signed out, without writing anything", async () => {
    const { client, state } = fakeDatabase({ signedIn: false });
    const store = createSavedStore(() => client);
    expect(await store.save(outfit, answers)).toMatchObject({ ok: false, reason: "signed-out" });
    expect(state.inserts).toBe(0);
  });

  it("refuses an invalid outfit without touching the database", async () => {
    const { client, state } = fakeDatabase();
    const store = createSavedStore(() => client);
    const result = await store.save({ ...outfit, pieces: [] } as never, answers);
    expect(result).toMatchObject({ ok: false });
    expect(state.selects).toBe(0);
  });

  it("marks the look busy while it is being saved, then clears it", async () => {
    const { client } = fakeDatabase();
    const store = createSavedStore(() => client);
    const seen: boolean[] = [];
    store.subscribe(() => seen.push(store.getState().busyKeys.includes(outfitKey(outfit))));
    await store.save(outfit, answers);
    expect(seen).toContain(true);
    expect(store.getState().busyKeys).toEqual([]);
  });
});

describe("remove", () => {
  it("removes a look and every screen then sees it as not saved", async () => {
    const { client, state } = fakeDatabase({ rows: [row("a"), row("b", other)] });
    const store = createSavedStore(() => client);
    await store.ensureLoaded();
    expect(store.isSaved(outfit)).toBe(true);

    expect(await store.removeById("a")).toEqual({ ok: true });
    expect(store.isSaved(outfit)).toBe(false);
    expect(store.isSaved(other)).toBe(true);
    expect(state.rows.map((r) => r.id)).toEqual(["b"]);
  });

  it("removes every saved copy when removing by look", async () => {
    const { client, state } = fakeDatabase({ rows: [row("a"), row("b"), row("c", other)] });
    const store = createSavedStore(() => client);
    await store.ensureLoaded();
    expect(await store.removeByKey(outfitKey(outfit))).toEqual({ ok: true });
    expect(state.deletes).toEqual([["a", "b"]]);
    expect(store.isSaved(outfit)).toBe(false);
  });

  it("keeps the look as saved when the database refuses to remove it", async () => {
    const { client } = fakeDatabase({ rows: [row("a")], deleteError: { code: "XX000" } });
    const store = createSavedStore(() => client);
    await store.ensureLoaded();
    const result = await store.removeById("a");
    expect(result).toMatchObject({ ok: false });
    expect(store.isSaved(outfit)).toBe(true);
  });

  it("saving again after removing creates exactly one record", async () => {
    const { client, state } = fakeDatabase({ rows: [row("a")] });
    const store = createSavedStore(() => client);
    await store.ensureLoaded();
    await store.removeById("a");
    expect(state.rows).toHaveLength(0);
    await store.save(outfit, answers);
    await store.save(outfit, answers);
    expect(state.rows).toHaveLength(1);
    expect(store.isSaved(outfit)).toBe(true);
  });
});

describe("reset (signing out)", () => {
  it("forgets everything at once", async () => {
    const { client } = fakeDatabase({ rows: [row("a")] });
    const store = createSavedStore(() => client);
    await store.ensureLoaded();
    const listener = vi.fn();
    store.subscribe(listener);
    store.reset();
    expect(store.getState()).toMatchObject({ status: "signed-out", items: [] });
    expect(listener).toHaveBeenCalled();
  });

  it("loads the next person's looks after signing back in", async () => {
    const first = fakeDatabase({ rows: [row("a")] });
    let current = first.client;
    const store = createSavedStore(() => current);
    await store.ensureLoaded();
    store.reset();
    const second = fakeDatabase({ rows: [row("z", other)] });
    current = second.client;
    await store.refresh();
    expect(store.getState().items.map((item) => item.id)).toEqual(["z"]);
    expect(store.isSaved(outfit)).toBe(false);
  });
});
