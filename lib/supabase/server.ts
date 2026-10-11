import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

export class SupabaseConfigError extends Error {
  constructor(public readonly reason: string) {
    super(`Supabase is not configured (${reason}).`);
    this.name = "SupabaseConfigError";
  }
}

/*
  Supabase client for server code (route handlers, Server Components, Server Actions).
  Create a new one for every request, because it carries that request's cookies.
  Uses only the PUBLIC key, so everything it can do is limited by Row Level Security.
*/
export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config.ok) throw new SupabaseConfigError(config.reason);

  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot set cookies. Once login exists, a proxy.ts
          // refreshes sessions, so this is safe to ignore here.
        }
      },
    },
  });
}
