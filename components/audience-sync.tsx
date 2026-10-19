"use client";

import { useEffect } from "react";
import { audienceStore } from "@/lib/audience";
import {
  readAudienceFromAccount,
  reconcileAudience,
  saveAudienceToAccount,
} from "@/lib/audience-sync";
import { authStore } from "@/lib/auth/use-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { setAudience, useAudience } from "@/lib/use-audience";

/*
  Mounted once in the root layout. It does two jobs and renders nothing:
  1. Mirrors the chosen audience onto <html data-audience>, which the homepage uses
     to show the matching imagery without waiting for scripts (see app/layout.tsx).
  2. After sign-in, reconciles this browser's choice with the account's saved one.
*/
export function AudienceSync() {
  const audience = useAudience();

  useEffect(() => {
    document.documentElement.dataset.audience = audience;
  }, [audience]);

  useEffect(() => {
    authStore.start();
    let handledUser: string | null = null;

    async function sync() {
      const state = authStore.getState();
      if (state.status !== "signed-in" || !state.userId || state.userId === handledUser) return;
      handledUser = state.userId;
      try {
        const client = createSupabaseBrowserClient();
        const remote = await readAudienceFromAccount(client);
        const local = audienceStore.getSnapshot().audience;
        const { use, pushToAccount } = reconcileAudience(local, remote);
        if (use !== local) setAudience(use);
        if (pushToAccount) await saveAudienceToAccount(client, use);
      } catch {
        // Supabase unavailable: the choice simply stays on this device.
      }
    }

    void sync();
    return authStore.subscribe(() => void sync());
  }, []);

  return null;
}
