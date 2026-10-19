"use client";

import { useState } from "react";
import { audienceLabels, audienceValues, type Audience } from "@/lib/audience";
import { saveAudienceToAccount } from "@/lib/audience-sync";
import { useAuthState } from "@/lib/auth/use-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { setAudience, useAudience } from "@/lib/use-audience";

type Note = { kind: "ok" | "warn"; text: string } | null;

/*
  Styling Preferences: whose style inspiration and recommendations to show across
  VEYORAQ. The one place the audience is chosen. The choice applies at once on this
  device; when signed in it is also saved to the account, and if that save fails the
  person is told it is only on this device rather than being shown a false "saved".
*/
export function StylingPreferences() {
  const audience = useAudience();
  const auth = useAuthState();
  const [note, setNote] = useState<Note>(null);
  const [saving, setSaving] = useState(false);

  async function choose(value: Audience) {
    if (value === audience && !saving) return;
    setAudience(value);
    if (auth.status !== "signed-in") {
      setNote({
        kind: "ok",
        text:
          auth.status === "loading"
            ? `Showing ${audienceLabels[value]} on this device.`
            : `Showing ${audienceLabels[value]}. Saved on this device. Sign in to keep it on your account.`,
      });
      return;
    }
    setSaving(true);
    setNote(null);
    let saved = false;
    try {
      saved = await saveAudienceToAccount(createSupabaseBrowserClient(), value);
    } catch {
      saved = false;
    }
    setSaving(false);
    setNote(
      saved
        ? { kind: "ok", text: `Saved to your account. VEYORAQ now shows ${audienceLabels[value]}.` }
        : {
            kind: "warn",
            text: `Showing ${audienceLabels[value]} on this device, but we couldn’t save it to your account. Please try again.`,
          },
    );
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Styling Preferences"
        className="grid max-w-sm grid-cols-2 border border-sand"
      >
        {audienceValues.map((value) => {
          const selected = audience === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => void choose(value)}
              className={`flex min-h-12 items-center justify-center gap-2 text-sm transition-colors duration-200 ${
                selected ? "bg-espresso text-ivory" : "hover:bg-espresso/5"
              }`}
            >
              {selected && (
                <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m2 6.5 2.5 2.5L10 3.5" />
                </svg>
              )}
              {audienceLabels[value]}
            </button>
          );
        })}
      </div>
      <p
        role={note?.kind === "warn" ? "alert" : "status"}
        className="mt-3 min-h-6 text-sm leading-6 text-stone"
      >
        {saving ? "Saving…" : note?.text}
      </p>
    </div>
  );
}
