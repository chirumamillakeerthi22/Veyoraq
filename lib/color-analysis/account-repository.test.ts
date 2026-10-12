import { describe, expect, it, vi } from "vitest";
import { createLooksStore } from "@/lib/fix-my-style/looks";
import { createAccountColourRepository, parseReportRows } from "./account-repository";
import type { ColourAnalysis } from "./schema";
import type { SavedColourReport } from "./use-colour-reports";

const swatch = (name: string, hex: string) => ({ name, hex, usage: "Wear it near the face." });

const analysis: ColourAnalysis = {
  photoUsable: true,
  photoNote: "",
  undertone: { value: "warm", confidence: "medium", explanation: "Golden tones look natural." },
  depth: "medium",
  contrast: "medium",
  likelySeason: "warm-autumn",
  alternativeSeason: "none",
  explorePalettes: [],
  confidenceExplanation: "One photo is never certain.",
  summary: "Earthy shades look natural.",
  recommendedColors: [swatch("Terracotta", "#C8693F"), swatch("Olive", "#6B6F3A"), swatch("Camel", "#B08968")],
  neutralColors: [swatch("Cream", "#F3E9D8"), swatch("Chocolate", "#4A3426")],
  accentColors: [],
  colorsToExploreCarefully: [],
  colorCombinations: [{ name: "Easy", colors: ["#C8693F", "#F3E9D8"], occasion: "work", idea: "Terracotta with cream." }],
  stylingAdvice: [],
};

// A tiny stand-in for the parts of the Supabase client the repository uses.
function fakeDb(options: { rows?: unknown[]; error?: boolean } = {}) {
  const calls: { op: string; table: string; args?: unknown; opts?: unknown; id?: string }[] = [];
  const result = { data: options.rows ?? [], error: options.error ? { code: "x" } : null };
  const db = {
    from(table: string) {
      return {
        select: (cols: string) => ({
          order: async () => {
            calls.push({ op: "select", table, args: cols });
            return result;
          },
        }),
        upsert: async (row: unknown, opts: unknown) => {
          calls.push({ op: "upsert", table, args: row, opts });
          return { error: options.error ? { code: "x" } : null };
        },
        delete: () => ({
          eq: async (_col: string, id: string) => {
            calls.push({ op: "delete", table, id });
            return { error: options.error ? { code: "x" } : null };
          },
        }),
      };
    },
  };
  return { db: db as never, calls };
}

describe("parseReportRows", () => {
  it("keeps valid reports and drops malformed, unusable or tampered rows", () => {
    const rows = [
      { id: "a", report: analysis, created_at: "2026-10-12T10:00:00Z" },
      { id: "b", report: { ...analysis, summary: "Only $9 at https://x.test" }, created_at: "2026-10-12T10:00:00Z" },
      { id: "c", report: { ...analysis, recommendedColors: [] }, created_at: "2026-10-12T10:00:00Z" },
      { id: 5, report: analysis },
      null,
    ];
    const parsed = parseReportRows(rows);
    expect(parsed.map((r) => r.id)).toEqual(["a"]);
    expect(parsed[0].savedAt).toBe(Date.parse("2026-10-12T10:00:00Z"));
  });

  it("returns an empty list for anything that is not a list", () => {
    expect(parseReportRows(null)).toEqual([]);
    expect(parseReportRows({})).toEqual([]);
  });
});

describe("account repository", () => {
  it("reads the colour_reports table, newest first, validating every row", async () => {
    const { db, calls } = fakeDb({ rows: [{ id: "a", report: analysis, created_at: "2026-10-12T10:00:00Z" }] });
    const repo = createAccountColourRepository(db);
    const list = await repo.loadAll();
    expect(list).toHaveLength(1);
    expect(calls[0]).toMatchObject({ op: "select", table: "colour_reports" });
  });

  it("saves with the same id ignoring duplicates, so a retry cannot create a second copy", async () => {
    const { db, calls } = fakeDb();
    await createAccountColourRepository(db).put({ id: "r1", savedAt: 1, analysis });
    expect(calls[0]).toMatchObject({
      op: "upsert",
      table: "colour_reports",
      opts: { onConflict: "id", ignoreDuplicates: true },
    });
    expect((calls[0].args as { id: string }).id).toBe("r1");
  });

  it("never sends anything but the id and the validated report", async () => {
    const { db, calls } = fakeDb();
    await createAccountColourRepository(db).put({ id: "r1", savedAt: 1, analysis, photo: "SECRET" } as never);
    const sent = calls[0].args as Record<string, unknown>;
    expect(Object.keys(sent).sort()).toEqual(["id", "report"]);
    expect(JSON.stringify(sent)).not.toContain("SECRET");
  });

  it("refuses to save an invalid report", async () => {
    const { db, calls } = fakeDb();
    await expect(
      createAccountColourRepository(db).put({ id: "r", savedAt: 1, analysis: { ...analysis, recommendedColors: [] } as never }),
    ).resolves.toBeUndefined(); // an empty list is schema-valid; usability is checked on read
    await expect(
      createAccountColourRepository(db).put({ id: "r", savedAt: 1, analysis: { nope: true } as never }),
    ).rejects.toThrow();
    expect(calls.filter((c) => c.op === "upsert")).toHaveLength(1);
  });

  it("surfaces database errors instead of pretending to succeed", async () => {
    const { db } = fakeDb({ error: true });
    const repo = createAccountColourRepository(db);
    await expect(repo.loadAll()).rejects.toThrow();
    await expect(repo.put({ id: "r", savedAt: 1, analysis })).rejects.toThrow();
    await expect(repo.remove("r")).rejects.toThrow();
  });

  it("deletes by id", async () => {
    const { db, calls } = fakeDb();
    await createAccountColourRepository(db).remove("r9");
    expect(calls[0]).toMatchObject({ op: "delete", table: "colour_reports", id: "r9" });
  });
});

describe("store with the account repository", () => {
  it("does not show a report as saved when the database refused it", async () => {
    const { db } = fakeDb({ error: true });
    const store = createLooksStore<SavedColourReport>(() => createAccountColourRepository(db));
    expect(await store.save({ id: "r", savedAt: 1, analysis })).toBe(false);
    expect(store.getState().looks).toHaveLength(0);
  });

  it("forgets the list on reset so a different person never sees it", async () => {
    const rows = [{ id: "a", report: analysis, created_at: "2026-10-12T10:00:00Z" }];
    const { db } = fakeDb({ rows });
    const store = createLooksStore<SavedColourReport>(() => createAccountColourRepository(db));
    await store.ensureLoaded();
    expect(store.getState().looks).toHaveLength(1);
    store.reset();
    expect(store.getState()).toMatchObject({ status: "idle", looks: [] });
    void vi;
  });
});
