import { createDraftStore } from "@/lib/persist/draft";
import { emptyFitDraft, validateFitDraft } from "./schema";

// Progress through Fit Guidance survives a refresh, for the usual week, in this
// browser only. It holds the choices and any measurements typed, never a photo.
export const fitDraft = createDraftStore({
  key: "veyoraq:draft:fit-guidance",
  version: 1,
  initial: emptyFitDraft,
  validate: validateFitDraft,
});
