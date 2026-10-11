/*
  Asks Supabase which sign-in methods are switched on, using its public settings
  endpoint. This lets the page say "being set up" instead of sending a visitor to
  a raw error page when a method is not enabled yet.

  null means "could not tell", and is treated as available so a hiccup here never
  hides a working method.
*/
export type ProviderAvailability = {
  google: boolean | null;
  email: boolean | null;
};

const UNKNOWN: ProviderAvailability = { google: null, email: null };

export function parseAuthSettings(json: unknown): ProviderAvailability {
  if (!json || typeof json !== "object") return UNKNOWN;
  const external = (json as { external?: unknown }).external;
  if (!external || typeof external !== "object") return UNKNOWN;

  const read = (name: string): boolean | null => {
    const value = (external as Record<string, unknown>)[name];
    return typeof value === "boolean" ? value : null;
  };

  return { google: read("google"), email: read("email") };
}

export async function fetchProviderAvailability(config: {
  url: string;
  key: string;
}): Promise<ProviderAvailability> {
  try {
    const response = await fetch(`${config.url}/auth/v1/settings`, {
      headers: { apikey: config.key },
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return UNKNOWN;
    return parseAuthSettings(await response.json());
  } catch {
    return UNKNOWN;
  }
}
