import { createDraftStore } from "@/lib/persist/draft";
import { emptyColourDraft, validateColourDraft } from "./schema";

// Answers, step and the finished result survive a refresh. The photo never does.
// Shared so the Saved page can open a saved report in the Colour Analysis tool
// without asking the AI again.
export const colourDraft = createDraftStore({
  key: "veyoraq:draft:color-analysis",
  version: 1,
  initial: emptyColourDraft,
  validate: validateColourDraft,
});
