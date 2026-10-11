/*
  Reads and checks the two PUBLIC Supabase settings.

  NEXT_PUBLIC_ variables are copied into the browser bundle at build time, so they
  must be referenced literally (not through a variable name) and must never hold a
  secret. This file refuses a secret key and says why, instead of shipping it.
*/

export type KeyKind = "publishable" | "anon" | "secret" | "unknown";

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}

// Works from the key's shape only; it never contacts Supabase.
export function classifyKey(key: string): KeyKind {
  if (key.startsWith("sb_publishable_")) return "publishable";
  if (key.startsWith("sb_secret_")) return "secret";

  // Older JWT-style keys carry their role inside the payload.
  const parts = key.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(decodeBase64Url(parts[1])) as { role?: string };
      if (payload.role === "service_role") return "secret";
      if (payload.role === "anon") return "anon";
    } catch {
      // not a readable JWT
    }
  }
  return "unknown";
}

export type SupabaseConfigProblem =
  | "missing"
  | "invalid_url"
  | "secret_key_in_public_variable";

export type SupabaseConfig =
  | { ok: true; url: string; key: string; keyKind: KeyKind }
  | { ok: false; reason: SupabaseConfigProblem };

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) return { ok: false, reason: "missing" };

  try {
    const parsed = new URL(url);
    const secure = parsed.protocol === "https:";
    const local = parsed.protocol === "http:" && LOCAL_HOSTS.has(parsed.hostname);
    if (!secure && !local) return { ok: false, reason: "invalid_url" };
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  const keyKind = classifyKey(key);
  if (keyKind === "secret") {
    return { ok: false, reason: "secret_key_in_public_variable" };
  }

  return { ok: true, url, key, keyKind };
}
