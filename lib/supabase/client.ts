import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/*
  Supabase client for Client Components (code that runs in the browser).
  Nothing uses it yet; it is here for the login and Saved Styles work.
  createBrowserClient keeps a single shared instance, so calling this repeatedly is fine.
*/
export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  if (!config.ok) {
    throw new Error(`Supabase is not configured (${config.reason}).`);
  }
  return createBrowserClient(config.url, config.key);
}
