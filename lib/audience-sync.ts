import type { SupabaseClient } from "@supabase/supabase-js";
import { isAudience, type Audience } from "./audience";

/*
  Keeping the audience preference between this browser and the signed-in account.

  Guests: the choice lives only in this browser (see audienceStore).
  Signed in: the choice is also stored on the account itself, in the user's own
  Supabase user_metadata, so it follows them to other devices. That needs no new
  table or migration, and a person can only ever change their own metadata.
*/

export const AUDIENCE_METADATA_KEY = "audience";

// Reads the saved preference from a user's metadata; anything unexpected is ignored.
export function audienceFromMetadata(metadata: unknown): Audience | null {
  const value = (metadata as Record<string, unknown> | null | undefined)?.[AUDIENCE_METADATA_KEY];
  return isAudience(value) ? value : null;
}

/*
  After signing in: an account that already has a preference wins (it is the person's
  explicit choice, possibly made on another device). An account with none takes this
  browser's choice, which is then written to the account.
*/
export function reconcileAudience(
  local: Audience,
  remote: Audience | null,
): { use: Audience; pushToAccount: boolean } {
  return remote ? { use: remote, pushToAccount: false } : { use: local, pushToAccount: true };
}

type Client = Pick<SupabaseClient, "auth">;

export async function saveAudienceToAccount(client: Client, audience: Audience): Promise<boolean> {
  try {
    const { error } = await client.auth.updateUser({ data: { [AUDIENCE_METADATA_KEY]: audience } });
    return !error;
  } catch {
    return false;
  }
}

export async function readAudienceFromAccount(client: Client): Promise<Audience | null> {
  try {
    const { data } = await client.auth.getSession();
    return audienceFromMetadata(data.session?.user?.user_metadata);
  } catch {
    return null;
  }
}
