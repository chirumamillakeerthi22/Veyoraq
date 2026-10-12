import { describe, expect, it, vi } from "vitest";
import { validOutput } from "@/lib/stylist/fixtures";
import {
  SAVED_LIMIT,
  TABLE,
  buildSavedRow,
  deleteSavedOutfit,
  friendlySaveError,
  parseSavedRows,
  saveOutfit,
  toSavedAnswers,
  type SavedAnswers,
} from "./saved-outfits";

const outfit = validOutput.outfits[0];
const answers: SavedAnswers = {
  occasions: ["work"],
  fit: null,
  considerations: [],
  styles: ["minimal", "classic"],
  colours: ["neutrals"],
  budgetTier: "mid",
  currency: "INR",
};

function fakeDb(result: { error: unknown } = { error: null }) {
  const eq = vi.fn().mockResolvedValue(result);
  const insert = vi.fn().mockResolvedValue(result);
  const del = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ insert, delete: del });
  return { db: { from } as never, from, insert, del, eq };
}

describe("toSavedAnswers", () => {
  it("keeps only the five questionnaire choices and drops notes", () => {
    const withNotes = { ...answers, notes: "my phone is 555-0100", extra: "x" };
    const result = toSavedAnswers(withNotes as never);
    expect(result).toEqual(answers);
    expect(JSON.stringify(result)).not.toContain("555");
    expect(result).not.toHaveProperty("notes");
    expect(result).not.toHaveProperty("extra");
  });

  it("passes null through", () => {
    expect(toSavedAnswers(null)).toBeNull();
  });
});

describe("buildSavedRow", () => {
  it("builds the insert payload without a user id (the database fills it in)", () => {
    const row = buildSavedRow(outfit, answers);
    expect(Object.keys(row).sort()).toEqual(["answers", "name", "outfit"]);
    expect(row.name).toBe(outfit.name);
    expect(row).not.toHaveProperty("user_id");
  });

  it("never exceeds the 50 character name limit", () => {
    const long = { ...outfit, name: "x".repeat(80) };
    expect(buildSavedRow(long, null).name).toHaveLength(50);
  });
});

describe("friendlySaveError", () => {
  it.each([
    [{ code: "PGRST205" }, /isn't available yet/],
    [{ code: "42P01" }, /isn't available yet/],
    [{ code: "42501" }, /sign in/i],
    [{ message: "new row violates row-level security policy" }, /sign in/i],
    [{ code: "P0001", message: "Saved outfit limit reached (100)" }, /limit of 100/],
    [{ code: "XX000", message: "boom internal detail" }, /couldn't save/],
    [null, /couldn't save/],
  ])("maps %j", (error, pattern) => {
    expect(friendlySaveError(error)).toMatch(pattern);
  });

  it("never repeats raw database text", () => {
    expect(friendlySaveError({ code: "XX000", message: "secret_table.col" })).not.toContain(
      "secret_table",
    );
  });

  it("uses the same limit number as the database trigger", () => {
    expect(SAVED_LIMIT).toBe(100);
  });
});

describe("saveOutfit", () => {
  it("inserts one validated row into saved_outfits", async () => {
    const { db, from, insert } = fakeDb();
    const result = await saveOutfit(db, outfit, answers);
    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith(TABLE);
    expect(insert).toHaveBeenCalledWith({ name: outfit.name, outfit, answers });
  });

  it("refuses an outfit that fails validation, without calling the database", async () => {
    const { db, from } = fakeDb();
    const bad = { ...outfit, pieces: [] } as never;
    const result = await saveOutfit(db, bad, answers);
    expect(result).toMatchObject({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("explains the limit and a signed-out attempt", async () => {
    const limit = await saveOutfit(
      fakeDb({ error: { code: "P0001", message: "limit reached" } }).db,
      outfit,
      answers,
    );
    expect(JSON.stringify(limit)).toMatch(/limit of 100/);

    const signedOut = await saveOutfit(
      fakeDb({ error: { code: "42501" } }).db,
      outfit,
      answers,
    );
    expect(JSON.stringify(signedOut)).toMatch(/sign in/i);
  });

  it("reports that saving is unavailable while the table does not exist", async () => {
    const result = await saveOutfit(
      fakeDb({ error: { code: "PGRST205" } }).db,
      outfit,
      answers,
    );
    expect(JSON.stringify(result)).toMatch(/isn't available yet/);
  });
});

describe("deleteSavedOutfit", () => {
  it("deletes by id", async () => {
    const { db, from, del, eq } = fakeDb();
    expect(await deleteSavedOutfit(db, "abc-123")).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith(TABLE);
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "abc-123");
  });

  it("returns a friendly message on failure", async () => {
    const result = await deleteSavedOutfit(
      fakeDb({ error: { code: "XX000", message: "internal" } }).db,
      "abc",
    );
    expect(result).toMatchObject({ ok: false });
    expect(JSON.stringify(result)).not.toContain("internal");
  });
});

describe("parseSavedRows", () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    id: "id-1",
    name: outfit.name,
    outfit,
    created_at: "2026-10-11T10:00:00Z",
    ...overrides,
  });

  it("returns valid rows in order", () => {
    const result = parseSavedRows([row({ id: "a" }), row({ id: "b" })]);
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result[0].outfit).toEqual(outfit);
  });

  it("skips rows whose outfit no longer validates", () => {
    const tampered = { ...outfit, pieces: [{ ...outfit.pieces[0], hex: "red;background:url(x)" }] };
    const result = parseSavedRows([
      row({ id: "ok" }),
      row({ id: "bad-hex", outfit: tampered }),
      row({ id: "no-outfit", outfit: null }),
      row({ id: 5 }),
      null,
      "string",
    ]);
    expect(result.map((r) => r.id)).toEqual(["ok"]);
  });

  it("returns an empty list for anything that is not an array", () => {
    expect(parseSavedRows(null)).toEqual([]);
    expect(parseSavedRows({})).toEqual([]);
    expect(parseSavedRows(undefined)).toEqual([]);
  });
});
