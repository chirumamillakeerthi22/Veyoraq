import { createDraftStore } from "@/lib/persist/draft";

/*
  Who the person is styling for. It is deliberately not tied to the signed-in
  account (someone may shop for a family member). The choice is remembered in the
  browser so it survives navigation and a refresh. It defaults to Women.
*/

export const audienceValues = ["women", "men", "boys", "girls"] as const;
export type Audience = (typeof audienceValues)[number];

export const audienceLabels: Record<Audience, string> = {
  women: "Women",
  men: "Men",
  boys: "Boys",
  girls: "Girls",
};

export const DEFAULT_AUDIENCE: Audience = "women";

export function isAudience(value: unknown): value is Audience {
  return (audienceValues as readonly unknown[]).includes(value);
}

type Draft = { audience: Audience };

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
