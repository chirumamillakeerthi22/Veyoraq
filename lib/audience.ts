import { createDraftStore } from "@/lib/persist/draft";

/*
  Who the person is styling and shopping for: Women or Men. It is a choice the
  visitor makes, never something inferred from their account or profile, and it is
  kept in this browser so it survives navigation and a refresh. New visitors start
  on Women.

  This module is the single source of truth. Read it in components with
  useAudience() (lib/use-audience.ts); server code only ever receives the value in a
  request and validates it against audienceValues.
*/

export const audienceValues = ["women", "men"] as const;
export type Audience = (typeof audienceValues)[number];

export const audienceLabels: Record<Audience, string> = {
  women: "Women",
  men: "Men",
};

export const DEFAULT_AUDIENCE: Audience = "women";

export function isAudience(value: unknown): value is Audience {
  return (audienceValues as readonly unknown[]).includes(value);
}

type Draft = { audience: Audience };

// An older saved value (for example "boys") fails validation and falls back to the
// default, rather than being mapped to something it was never meant to be.
export const audienceStore = createDraftStore<Draft>({
  key: "veyoraq:audience",
  version: 1,
  initial: { audience: DEFAULT_AUDIENCE },
  validate: (data) => {
    const value = (data as { audience?: unknown } | null)?.audience;
    return isAudience(value) ? { audience: value } : null;
  },
  // A preference rather than a draft, so it is kept for a year.
  ttlMs: 365 * 24 * 60 * 60 * 1000,
});
