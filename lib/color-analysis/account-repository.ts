import type { SupabaseClient } from "@supabase/supabase-js";
import type { LooksRepository } from "@/lib/fix-my-style/looks";
import { analysisSchema, hasUsablePalette } from "./schema";
import type { SavedColourReport } from "./use-colour-reports";

/*
  Colour reports in the signed-in person's own account (the colour_reports table).
  The database enforces who may read or write which rows (Row Level Security), so
  this runs with the visitor's login and can only ever see their own reports.
  Everything read back is validated again, because a stored row is data, not code.
  No photo is ever part of a report.
*/

export const COLOUR_TABLE = "colour_reports";

type Db = Pick<SupabaseClient, "from">;

export function parseReportRows(rows: unknown): SavedColourReport[] {
  if (!Array.isArray(rows)) return [];
  const reports: SavedColourReport[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const { id, report, created_at: createdAt } = row as Record<string, unknown>;
    if (typeof id !== "string") continue;
    const parsed = analysisSchema.safeParse(report);
    if (!parsed.success || !hasUsablePalette(parsed.data)) continue;
    const savedAt = typeof createdAt === "string" ? Date.parse(createdAt) : NaN;
    reports.push({ id, savedAt: Number.isFinite(savedAt) ? savedAt : 0, analysis: parsed.data });
  }
  return reports;
}

export function createAccountColourRepository(db: Db): LooksRepository<SavedColourReport> {
  return {
    async loadAll() {
      const { data, error } = await db
        .from(COLOUR_TABLE)
        .select("id, report, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error("load failed");
      return parseReportRows(data);
    },

    // The same id is never inserted twice: a retry is a harmless no-op.
    async put(look) {
      const parsed = analysisSchema.safeParse(look.analysis);
      if (!parsed.success) throw new Error("invalid report");
      const { error } = await db
        .from(COLOUR_TABLE)
        .upsert({ id: look.id, report: parsed.data }, { onConflict: "id", ignoreDuplicates: true });
      if (error) throw new Error("save failed");
    },

    async remove(id) {
      const { error } = await db.from(COLOUR_TABLE).delete().eq("id", id);
      if (error) throw new Error("delete failed");
    },
  };
}
