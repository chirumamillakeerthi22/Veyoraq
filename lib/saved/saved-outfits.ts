import type { SupabaseClient } from "@supabase/supabase-js";
import { outfitKey } from "@/lib/saved/outfit-key";
import {
  outfitSchema,
  type Outfit,
  type StylistInput,
} from "@/lib/stylist/schema";

/*
  Saving and listing outfits in the saved_outfits table.

  The database enforces who may read or write which rows (Row Level Security), so
  these helpers run with the visitor's own login and never see anyone else's data.
  Everything read back is re-checked, because a stored row is data, not code.
*/

export const TABLE = "saved_outfits";
export const SAVED_LIMIT = 100;

// The questionnaire choices only. The free-text notes are deliberately left out.
export type SavedAnswers = Omit<StylistInput, "notes">;

export type SavedOutfit = {
  id: string;
  name: string;
  outfit: Outfit;
  // Identifies the look by its content, so the same look is recognised everywhere.
  key: string;
  createdAt: string;
};

export type SaveResult = { ok: true } | { ok: false; message: string };

type Db = Pick<SupabaseClient, "from">;

export type DbErrorLike =
  | { code?: string | null; message?: string | null }
  | null
  | undefined;

// Picks the allowed fields explicitly, so nothing extra can ever be stored.
export function toSavedAnswers(answers: SavedAnswers | null): SavedAnswers | null {
  if (!answers) return null;
  return {
    occasions: [...answers.occasions],
    styles: [...answers.styles],
    colours: [...answers.colours],
    fit: answers.fit,
    considerations: [...answers.considerations],
    budgetTier: answers.budgetTier,
    currency: answers.currency,
  };
}

export function buildSavedRow(outfit: Outfit, answers: SavedAnswers | null) {
  return {
    name: outfit.name.slice(0, 50),
    outfit,
    answers: toSavedAnswers(answers),
  };
}

export function friendlySaveError(error: DbErrorLike): string {
  const code = error?.code ?? "";
  const message = (error?.message ?? "").toLowerCase();

  if (code === "PGRST205" || code === "42P01" || message.includes("schema cache")) {
    return "Saving isn't available yet. Please check back soon.";
  }
  if (code === "42501" || message.includes("row-level security")) {
    return "Please sign in to save outfits.";
  }
  if (code === "P0001" || message.includes("limit reached")) {
    // (the 100-look limit is enforced by a database trigger)
    return `You've reached the limit of ${SAVED_LIMIT} saved outfits. Remove one to save another.`;
  }
  return "We couldn't save that just now. Please try again.";
}

export async function saveOutfit(
  db: Db,
  outfit: Outfit,
  answers: SavedAnswers | null,
): Promise<SaveResult> {
  const parsed = outfitSchema.safeParse(outfit);
  if (!parsed.success) {
    return { ok: false, message: "That outfit can't be saved." };
  }
  const { error } = await db.from(TABLE).insert(buildSavedRow(parsed.data, answers));
  return error ? { ok: false, message: friendlySaveError(error) } : { ok: true };
}

export async function deleteSavedOutfit(db: Db, id: string): Promise<SaveResult> {
  const { error } = await db.from(TABLE).delete().eq("id", id);
  return error
    ? { ok: false, message: "We couldn't remove that just now. Please try again." }
    : { ok: true };
}

// Keeps only rows whose outfit still passes the same validation as a fresh result.
export function parseSavedRows(rows: unknown): SavedOutfit[] {
  if (!Array.isArray(rows)) return [];
  const saved: SavedOutfit[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const { id, name, outfit, created_at: createdAt } = row as Record<string, unknown>;
    if (typeof id !== "string" || typeof name !== "string") continue;

    const parsed = outfitSchema.safeParse(outfit);
    if (!parsed.success) continue;

    saved.push({
      id,
      name,
      outfit: parsed.data,
      key: outfitKey(parsed.data),
      createdAt: typeof createdAt === "string" ? createdAt : "",
    });
  }
  return saved;
}
