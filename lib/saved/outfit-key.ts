import type { Outfit } from "@/lib/stylist/schema";

/*
  A look has no ID until it is saved, so "the same look" is decided by its content.
  The key is the outfit written out with its fields in a fixed order, so the copy the
  AI just returned and the copy read back from the database give the same key.
*/
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function outfitKey(outfit: Outfit): string {
  return canonicalJson(outfit);
}
