"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  photoUrl,
  primaryButton,
  releasePhoto,
  secondaryButton,
  StylingProgress,
} from "@/components/fix-my-style/styled-result";
import { StrandGlyph, VolumeGlyph } from "@/components/hair-studio/glyphs";
import { QuizActions } from "@/components/quiz-actions";
import { Sheet } from "@/components/sheet";
import { OptionCard } from "@/components/stylist/option-card";
import { useAiStatus } from "@/lib/ai/use-ai-status";
import { blobToBase64, prepareImage, validateFile } from "@/lib/fix-my-style/image";
import {
  changeValues,
  emptyHairDraft,
  extraValues,
  firstMissingStep,
  framingValues,
  hairLimits,
  hairSteps,
  hairTypeValues,
  highlightValues,
  isStepAnswered,
  labels,
  lengthValues,
  occasionValues,
  stepProblem,
  stylingValues,
  thicknessValues,
  toggleLimited,
  toggleWithNone,
  validateHairDraft,
  volumeValues,
  type HairAnswers,
  type HairStepId,
} from "@/lib/hair-studio/quiz";
import { effortLabels, type HairConcept, type HairEvent, type LookImage } from "@/lib/hair-studio/schema";
import { hairLooksStore, useHairLooks } from "@/lib/hair-studio/use-hair-looks";
import { audienceStore } from "@/lib/audience";
import { createDraftStore } from "@/lib/persist/draft";

/* ---------- state ---------- */

// Answers and place in the quiz survive a refresh. The photo never does.
const hairDraft = createDraftStore({
  key: "veyoraq:draft:hair-studio",
  version: 1,
  initial: emptyHairDraft,
  validate: validateHairDraft,
});

type Slot =
  | { state: "pending" }
  | { state: "ready"; blob: Blob }
  | { state: "none"; kind: "not_configured" | "unavailable" | "failed"; message: string };

type Run =
  | { phase: "idle" }
  | { phase: "planning" }
  | { phase: "error"; message: string }
  | { phase: "results"; concepts: HairConcept[]; caveat: string; slots: Slot[] };

const ACCEPT = "image/jpeg,image/png,image/webp";
const REVIEW = hairSteps.length;
const OFFLINE = "You appear to be offline. Check your connection and try again.";

async function toSlot(image: LookImage): Promise<Slot> {
  if (image.status === "generated") {
    const blob = await (await fetch(`data:${image.mimeType};base64,${image.data}`)).blob();
    return { state: "ready", blob };
  }
  return { state: "none", kind: image.status, message: image.message };
}

/* ---------- question copy ---------- */

const questions: Record<HairStepId, { title: string; hint: string }> = {
  hairType: { title: "Tell us about your hair.", hint: "Pick the closest. “Not sure” is a perfectly good answer." },
  thickness: {
    title: "How would you describe your hair?",
    hint: "This is how thick your hair is overall, which is different from how curly it is.",
  },
  changes: { title: "What would you love to change about your look?", hint: `Pick up to ${hairLimits.changes}, or skip.` },
  occasions: { title: "Where would you love to wear your new hairstyle?", hint: `Pick up to ${hairLimits.occasions}, or skip.` },
  framing: {
    title: "How would you like your hairstyle to frame your face?",
    hint: "These are just your preferences. Pick up to 3, or skip.",
  },
  highlights: {
    title: "What would you love your hairstyle to bring attention to?",
    hint: "Pick up to 3, or skip.",
  },
  volume: { title: "How much volume feels right for you?", hint: "Optional." },
  lifestyle: { title: "What would work best for your lifestyle?", hint: "Optional. Combine as you like." },
};

const stepTitles: Record<HairStepId, string> = {
  hairType: "Hair type",
  thickness: "Thickness",
  changes: "Change",
  occasions: "Occasions",
  framing: "Face framing",
  highlights: "Highlight",
  volume: "Volume",
  lifestyle: "Lifestyle",
};

function summary(step: HairStepId, a: HairAnswers): string {
  const join = <T extends string>(values: T[], map: Record<T, string>) =>
    values.length > 0 ? values.map((value) => map[value]).join(", ") : "Skipped";
  switch (step) {
    case "hairType":
      return a.hairType ? labels.hairType[a.hairType] : "Not chosen";
    case "thickness":
      return a.thickness ? labels.thickness[a.thickness] : "Not chosen";
    case "changes":
      return join(a.changes, labels.change);
    case "occasions":
      return join(a.occasions, labels.occasion);
    case "framing":
      return join(a.framing, labels.framing);
    case "highlights":
      return join(a.highlights, labels.highlight);
    case "volume":
      return a.volume ? labels.volume[a.volume] : "Skipped";
    case "lifestyle": {
      const parts = [
        a.length ? labels.length[a.length] : null,
        a.styling ? labels.styling[a.styling] : null,
        ...a.extras.map((extra) => labels.extra[extra]),
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : "Skipped";
    }
  }
}

/* ---------- component ---------- */

export function HairStudio() {
  const ai = useAiStatus();
  const looks = useHairLooks();
  const draft = useSyncExternalStore(hairDraft.subscribe, hairDraft.getSnapshot, hairDraft.getServerSnapshot);
  const restored = useSyncExternalStore(
    () => () => {},
    () => hairDraft.wasRestored(),
    () => false,
  );
  const { answers, index } = draft;

  const setAnswers = (patch: Partial<HairAnswers>) =>
    hairDraft.set((current) => ({ ...current, answers: { ...current.answers, ...patch } }));
  const setIndex = (next: number | ((current: number) => number)) =>
    hairDraft.set((current) => ({
      ...current,
      index: typeof next === "function" ? next(current.index) : next,
    }));

  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [photo, setPhoto] = useState<Blob | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [problem, setProblem] = useState("");
  const [stepError, setStepError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [run, setRun] = useState<Run>({ phase: "idle" });
  const [large, setLarge] = useState<number | null>(null);
  const [saved, setSaved] = useState<Record<number, "saving" | "saved" | "error">>({});

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (confirmed) headingRef.current?.focus();
  }, [index, confirmed]);

  const stylingUnavailable = ai.state === "ready" && !ai.text;
  const imagesOff = ai.state === "ready" && ai.text && !ai.images;

  /* ----- photo ----- */

  async function choose(file: File | undefined) {
    if (!file) return;
    setProblem("");
    const invalid = validateFile(file);
    if (invalid) return setProblem(invalid);
    setPreparing(true);
    const prepared = await prepareImage(file);
    setPreparing(false);
    if (!prepared.ok) return setProblem(prepared.message);
    if (photo) releasePhoto(photo);
    setPhoto(prepared.blob);
    setRun({ phase: "idle" });
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void choose(file);
  }

  function removePhoto() {
    abortRef.current?.abort();
    if (photo) releasePhoto(photo);
    setPhoto(null);
    setConfirmed(false);
    setRun({ phase: "idle" });
  }

  function startOver() {
    removePhoto();
    hairDraft.clear();
    setProblem("");
    setStepError("");
    setSaved({});
  }

  /* ----- generation ----- */

  async function readStream(response: Response, onEvent: (event: HairEvent) => Promise<void> | void) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const handle = async (line: string) => {
      if (!line.trim()) return;
      try {
        await onEvent(JSON.parse(line) as HairEvent);
      } catch {
        // an unreadable line is skipped; the rest of the stream still counts
      }
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) await handle(line);
    }
    await handle(buffer);
  }

  async function post(body: Record<string, unknown>, signal: AbortSignal): Promise<Response | string> {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return OFFLINE;
    try {
      const response = await fetch("/api/hair-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, audience: audienceStore.getSnapshot().audience }),
        signal,
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        return data?.error?.message ?? "We couldn't create your looks just now. Please try again.";
      }
      return response;
    } catch {
      return "We couldn't reach the styling service. Check your connection and try again.";
    }
  }

  async function generateAll() {
    if (!photo || run.phase === "planning") return;
    const missing = firstMissingStep(answers);
    if (missing) {
      setIndex(hairSteps.findIndex((step) => step.id === missing));
      return setStepError(stepProblem(missing, answers) ?? "");
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort(), 115_000);
    setSaved({});
    setRun({ phase: "planning" });

    try {
      const response = await post(
        { image: await blobToBase64(photo), answers, mode: "all" },
        controller.signal,
      );
      if (typeof response === "string") return setRun({ phase: "error", message: response });

      let concepts: HairConcept[] = [];
      await readStream(response, async (event) => {
        if (event.type === "plan") {
          concepts = event.concepts;
          setRun({
            phase: "results",
            concepts: event.concepts,
            caveat: event.caveat,
            slots: event.concepts.map(() => ({ state: "pending" }) as Slot),
          });
        } else if (event.type === "image") {
          const slot = await toSlot(event.image);
          setRun((current) =>
            current.phase === "results"
              ? { ...current, slots: current.slots.map((existing, i) => (i === event.index ? slot : existing)) }
              : current,
          );
        } else if (event.type === "error") {
          setRun({ phase: "error", message: event.message });
        }
      });

      // The stream ended. Anything still waiting did not arrive: say so, never spin.
      setRun((current) => {
        if (current.phase === "planning") {
          return { phase: "error", message: "We didn't get a result. Please try again." };
        }
        if (current.phase === "results") {
          return {
            ...current,
            slots: current.slots.map((slot) =>
              slot.state === "pending"
                ? { state: "none", kind: "failed", message: "We couldn't generate your styled look this time. Please try again." }
                : slot,
            ),
          };
        }
        return current;
      });
      void concepts;
    } catch {
      setRun({ phase: "error", message: "That took too long. Please try again." });
    } finally {
      clearTimeout(timer);
    }
  }

  async function regenerateOne(slotIndex: number) {
    if (!photo || run.phase !== "results") return;
    const concept = run.concepts[slotIndex];
    setRun((current) =>
      current.phase === "results"
        ? { ...current, slots: current.slots.map((slot, i) => (i === slotIndex ? { state: "pending" } : slot)) }
        : current,
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 70_000);
    const response = await post(
      { image: await blobToBase64(photo), answers, mode: "one", index: slotIndex, concept },
      controller.signal,
    );
    clearTimeout(timer);

    let slot: Slot = {
      state: "none",
      kind: "failed",
      message: typeof response === "string" ? response : "We couldn't generate your styled look this time. Please try again.",
    };
    if (typeof response !== "string") {
      await readStream(response, async (event) => {
        if (event.type === "image") slot = await toSlot(event.image);
      });
    }
    setRun((current) =>
      current.phase === "results"
        ? { ...current, slots: current.slots.map((existing, i) => (i === slotIndex ? slot : existing)) }
        : current,
    );
  }

  async function saveLook(slotIndex: number) {
    if (run.phase !== "results") return;
    const slot = run.slots[slotIndex];
    const concept = run.concepts[slotIndex];
    if (slot.state !== "ready") return;
    setSaved((current) => ({ ...current, [slotIndex]: "saving" }));
    const id = `hair-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const ok = await hairLooksStore.save({
      id,
      savedAt: Date.now(),
      name: concept.name,
      description: concept.description,
      effort: concept.effort,
      image: slot.blob,
    });
    setSaved((current) => ({ ...current, [slotIndex]: ok ? "saved" : "error" }));
  }

  /* ----- render helpers ----- */

  const toggleSet = <T extends string>(list: readonly T[], value: T, max: number) =>
    toggleLimited(list, value, max);

  // A plain function that returns the cards for one step (not a component).
  function renderQuestion(step: HairStepId) {
    const single = <T extends string>(
      name: string,
      values: readonly T[],
      map: Record<T, string>,
      current: T | null,
      set: (value: T | null) => void,
      visual?: (value: T) => React.ReactNode,
      cols = "grid-cols-2 sm:grid-cols-3",
    ) => (
      <fieldset className="mt-6">
        <legend className="sr-only">{questions[step].title}</legend>
        <div className={`grid gap-3 ${cols}`}>
          {values.map((value) => (
            <OptionCard
              key={value}
              type="radio"
              name={name}
              value={value}
              label={map[value]}
              visual={visual?.(value)}
              checked={current === value}
              onChange={() => set(current === value ? null : value)}
            />
          ))}
        </div>
      </fieldset>
    );

    const multi = <T extends string>(
      name: string,
      values: readonly T[],
      map: Record<T, string>,
      current: readonly T[],
      max: number,
      set: (next: T[]) => void,
      none?: T,
      cols = "grid-cols-2 sm:grid-cols-3",
    ) => (
      <fieldset className="mt-6">
        <legend className="sr-only">{questions[step].title}</legend>
        <div className={`grid gap-3 ${cols}`}>
          {values.map((value) => {
            const checked = current.includes(value);
            return (
              <OptionCard
                key={value}
                type="checkbox"
                name={name}
                value={value}
                label={map[value]}
                checked={checked}
                disabled={!checked && value !== none && !current.includes(none as T) && current.length >= max}
                onChange={() =>
                  set(none ? toggleWithNone(current, value, none, max) : toggleSet(current, value, max))
                }
              />
            );
          })}
        </div>
      </fieldset>
    );

    switch (step) {
      case "hairType":
        return single("hairType", hairTypeValues, labels.hairType, answers.hairType, (v) => setAnswers({ hairType: v }), (v) => <StrandGlyph kind={v} />);
      case "thickness":
        return single("thickness", thicknessValues, labels.thickness, answers.thickness, (v) => setAnswers({ thickness: v }), undefined, "grid-cols-2 sm:grid-cols-4");
      case "changes":
        return multi("changes", changeValues, labels.change, answers.changes, hairLimits.changes, (v) => setAnswers({ changes: v }));
      case "occasions":
        return multi("occasions", occasionValues, labels.occasion, answers.occasions, hairLimits.occasions, (v) => setAnswers({ occasions: v }), undefined, "grid-cols-2 sm:grid-cols-4");
      case "framing":
        return multi("framing", framingValues, labels.framing, answers.framing, hairLimits.framing, (v) => setAnswers({ framing: v }), "no-preference");
      case "highlights":
        return multi("highlights", highlightValues, labels.highlight, answers.highlights, hairLimits.highlights, (v) => setAnswers({ highlights: v }), "no-preference");
      case "volume":
        return single("volume", volumeValues, labels.volume, answers.volume, (v) => setAnswers({ volume: v }), (v) => <VolumeGlyph level={v} />);
      case "lifestyle":
        return (
          <div className="mt-6 space-y-6">
            <fieldset>
              <legend className="text-sm text-stone">Length</legend>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {lengthValues.map((value) => (
                  <OptionCard
                    key={value}
                    type="radio"
                    name="length"
                    value={value}
                    label={labels.length[value]}
                    checked={answers.length === value}
                    onChange={() => setAnswers({ length: answers.length === value ? null : value })}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm text-stone">Styling</legend>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {stylingValues.map((value) => (
                  <OptionCard
                    key={value}
                    type="radio"
                    name="styling"
                    value={value}
                    label={labels.styling[value]}
                    checked={answers.styling === value}
                    onChange={() => setAnswers({ styling: answers.styling === value ? null : value })}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm text-stone">Also</legend>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {extraValues.map((value) => {
                  const checked = answers.extras.includes(value);
                  // "Open to a major change" and "keep my length" would contradict each
                  // other. The option is disabled, and nothing already chosen is reset.
                  const conflict = value === "open-to-change" && answers.length === "keep";
                  return (
                    <OptionCard
                      key={value}
                      type="checkbox"
                      name="extras"
                      value={value}
                      label={labels.extra[value]}
                      hint={conflict ? "Unavailable while you keep your current length" : undefined}
                      checked={checked}
                      disabled={conflict}
                      onChange={() => setAnswers({ extras: toggleSet(answers.extras, value, extraValues.length) })}
                    />
                  );
                })}
              </div>
            </fieldset>
          </div>
        );
    }
  }

  function goNext() {
    const current = hairSteps[index];
    if (current) {
      const message = stepProblem(current.id, answers);
      if (message) return setStepError(message);
    }
    setStepError("");
    setIndex((value) => Math.min(REVIEW, value + 1));
  }

  function skip() {
    const current = hairSteps[index];
    const clear: Partial<Record<HairStepId, Partial<HairAnswers>>> = {
      changes: { changes: [] },
      occasions: { occasions: [] },
      framing: { framing: [] },
      highlights: { highlights: [] },
      volume: { volume: null },
      lifestyle: { length: null, styling: null, extras: [] },
    };
    if (current && clear[current.id]) setAnswers(clear[current.id]!);
    setStepError("");
    setIndex((value) => Math.min(REVIEW, value + 1));
  }

  const busy = preparing || run.phase === "planning";
  const current = hairSteps[index];
  const atReview = index === REVIEW;
  const anyAnswer = hairSteps.some((step) => isStepAnswered(step.id, answers));

  /* ----- screens ----- */

  const header = (
    <header className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.22em] text-stone">Hair Studio</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">Hair Studio</h1>
      <p className="mt-3 text-base leading-7 text-stone md:mt-4 md:text-lg md:leading-8">
        Your next hair look starts here. Tell us what you love, explore styles that suit your
        preferences, and preview four new looks with your own photo.
      </p>
    </header>
  );

  const inputs = (
    <>
      <input ref={cameraInput} type="file" accept={ACCEPT} capture="user" onChange={onPick} tabIndex={-1} aria-hidden="true" className="sr-only" />
      <input ref={libraryInput} type="file" accept={ACCEPT} onChange={onPick} tabIndex={-1} aria-hidden="true" className="sr-only" />
    </>
  );

  // ---- results ----
  if (run.phase === "results" || run.phase === "planning") {
    const results = run.phase === "results" ? run : null;
    const failedCount = results ? results.slots.filter((slot) => slot.state === "none" && slot.kind === "failed").length : 0;
    const noneKind = results?.slots.find((slot) => slot.state === "none");
    const largeConcept = large !== null && results ? results.concepts[large] : null;
    const largeSlot = large !== null && results ? results.slots[large] : null;

    return (
      <div>
        {header}
        <section aria-label="Your four looks" className="mt-8">
          {run.phase === "planning" && (
            <div className="border border-sand bg-soft-white">
              <StylingProgress />
            </div>
          )}

          {results && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-display text-3xl leading-tight">Your four looks</h2>
                <p className="text-xs uppercase tracking-[0.18em] text-stone">AI-generated visualisations</p>
              </div>

              {noneKind && noneKind.state === "none" && noneKind.kind !== "failed" && (
                <p role="status" className="mt-4 border border-espresso/40 bg-soft-white p-4 text-sm leading-6">
                  {noneKind.kind === "not_configured"
                    ? "AI picture generation isn’t switched on for this site yet, so here are the four hairstyle ideas without pictures."
                    : "AI picture generation isn’t available on the current plan, so here are the four hairstyle ideas without pictures."}
                </p>
              )}
              {failedCount > 0 && (
                <p role="status" className="mt-4 border border-espresso/40 bg-soft-white p-4 text-sm leading-6">
                  {failedCount === 4
                    ? "We couldn’t generate your styled looks this time."
                    : `${failedCount} of the four pictures didn’t come through. The others are kept.`}{" "}
                  Use Regenerate on a look to try just that one again.
                </p>
              )}

              <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-5 lg:grid-cols-4">
                {results.concepts.map((concept, i) => {
                  const slot = results.slots[i];
                  const saveState = saved[i];
                  return (
                    <li key={`${concept.name}-${i}`} className="flex flex-col">
                      <div className="aspect-[4/5] w-full overflow-hidden border border-sand bg-sand">
                        {slot.state === "ready" && (
                          <button type="button" onClick={() => setLarge(i)} className="block h-full w-full" aria-label={`View ${concept.name} larger`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photoUrl(slot.blob)} alt={`AI-generated hairstyle preview: ${concept.name}`} className="h-full w-full object-cover" />
                          </button>
                        )}
                        {slot.state === "pending" && <StylingProgress compact />}
                        {slot.state === "none" && (
                          <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                            <p className="font-display text-lg leading-6">
                              {slot.kind === "failed" ? "No picture this time" : "No picture"}
                            </p>
                            <p className="text-xs leading-5 text-stone">{slot.message}</p>
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 font-display text-lg leading-6 sm:text-xl">{concept.name}</h3>
                      <p className="text-xs text-stone">{effortLabels[concept.effort]}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setLarge(i)} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
                          {slot.state === "ready" ? "View larger" : "Details"}
                        </button>
                        {slot.state === "ready" && (
                          <button
                            type="button"
                            disabled={saveState === "saving" || saveState === "saved"}
                            onClick={() => void saveLook(i)}
                            className="inline-flex min-h-11 items-center text-sm underline underline-offset-4 disabled:no-underline disabled:opacity-60"
                          >
                            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save look"}
                          </button>
                        )}
                        {slot.state === "none" && slot.kind !== "not_configured" && (
                          <button type="button" onClick={() => void regenerateOne(i)} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
                            Regenerate
                          </button>
                        )}
                      </div>
                      {saveState === "saved" && <p className="text-xs text-stone">Saved on this device only.</p>}
                      {saveState === "error" && (
                        <p role="alert" className="text-xs leading-5">
                          We couldn’t save this on your device. Your browser may be blocking storage.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              <p className="mt-8 max-w-2xl text-xs leading-5 text-stone">{results.caveat}</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" disabled={busy || stylingUnavailable} onClick={() => void generateAll()} className={primaryButton}>
                  Generate Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRun({ phase: "idle" });
                    setIndex(REVIEW);
                  }}
                  className={secondaryButton}
                >
                  Adjust my answers
                </button>
                <button type="button" onClick={startOver} className={secondaryButton}>
                  Start Over
                </button>
              </div>
            </>
          )}
        </section>

        {largeConcept && largeSlot && (
          <Sheet open onClose={() => setLarge(null)} title={largeConcept.name}>
            {largeSlot.state === "ready" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl(largeSlot.blob)} alt={`AI-generated hairstyle preview: ${largeConcept.name}`} className="mx-auto max-h-[60dvh] w-auto max-w-full border border-sand" />
            )}
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone">
              {effortLabels[largeConcept.effort]}
              {largeSlot.state === "ready" ? " · AI-generated visualisation" : " · Hairstyle idea (no picture)"}
            </p>
            <p className="mt-2 leading-7">{largeConcept.description}</p>
            <p className="mt-2 leading-7 text-stone">
              <span className="font-medium text-espresso">Why it matches: </span>
              {largeConcept.whyItMatches}
            </p>
            <p className="mt-2 leading-7 text-stone">
              <span className="font-medium text-espresso">Upkeep: </span>
              {largeConcept.maintenance}
            </p>
            {largeConcept.professionalNote && (
              <p className="mt-2 leading-7 text-stone">
                <span className="font-medium text-espresso">Worth asking a stylist: </span>
                {largeConcept.professionalNote}
              </p>
            )}
          </Sheet>
        )}
      </div>
    );
  }

  // ---- step 1: photo ----
  if (!photo || !confirmed) {
    return (
      <div>
        {header}
        {inputs}
        <section aria-label="Your photo" className="mt-6 grid gap-6 md:mt-8 md:grid-cols-12 md:items-start md:gap-10">
          <div className="md:col-span-6 lg:col-span-5">
            {restored && anyAnswer && !photo && (
              <p role="status" className="mb-4 border border-espresso/40 bg-soft-white p-4 text-sm leading-6">
                Welcome back. We kept your answers, but a photo can’t be kept when the page reloads, so
                please add it again to carry on.
              </p>
            )}
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void choose(event.dataTransfer.files[0]);
              }}
              className={`relative w-full overflow-hidden border md:max-h-none ${
                photo ? "aspect-[4/5] max-h-[62dvh] border-sand bg-sand" : `aspect-[3/2] md:aspect-[4/5] ${dragging ? "border-dashed border-espresso bg-sand/60" : "border-dashed border-espresso/40 bg-soft-white"}`
              }`}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl(photo)} alt="The photo you chose" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="font-display text-2xl leading-7">Add a photo of yourself</p>
                  <p className="max-w-xs text-sm leading-6 text-stone">
                    Take a photo or choose one. It is only sent when you generate your looks.
                  </p>
                </div>
              )}
              {preparing && (
                <div role="status" className="absolute inset-0 flex items-end justify-center bg-espresso/30 p-4">
                  <p className="bg-ivory px-4 py-2 text-sm">Preparing your photo…</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              {photo ? (
                <>
                  <button type="button" disabled={busy} onClick={() => libraryInput.current?.click()} className={`${secondaryButton} flex-1`}>
                    Replace Photo
                  </button>
                  <button type="button" onClick={removePhoto} className={`${secondaryButton} flex-1`}>
                    Remove Photo
                  </button>
                </>
              ) : (
                <>
                  <button type="button" disabled={busy} onClick={() => cameraInput.current?.click()} className={`${primaryButton} flex-1`}>
                    Take a Photo
                  </button>
                  <button type="button" disabled={busy} onClick={() => libraryInput.current?.click()} className={`${secondaryButton} flex-1`}>
                    Upload Photo
                  </button>
                </>
              )}
            </div>
            {problem && (
              <p role="alert" className="mt-3 border border-espresso p-3 text-sm leading-6">
                {problem}
              </p>
            )}
          </div>

          <div className="md:col-span-6 lg:col-span-7">
            <h2 className="font-display text-2xl leading-8">For the best previews</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-stone">
              <li>Show your face clearly, in reasonable light.</li>
              <li>Keep your hair visible where you can.</li>
              <li>Avoid strong filters and extreme angles.</li>
              <li>A front-facing or slightly angled photo works well.</li>
            </ul>
            <p className="mt-3 text-sm leading-6 text-stone">
              Your photo doesn’t have to be perfect. If it isn’t ideal, the previews may be less
              accurate, but you can still go ahead. Please use a photo of yourself, or of someone who
              has agreed.
            </p>
            {photo && (
              <button type="button" onClick={() => setConfirmed(true)} className={`${primaryButton} mt-6 w-full md:w-auto`}>
                Continue to the quiz
              </button>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ---- steps 2 to 9: the quiz ----
  const progress = Math.round(((Math.min(index, hairSteps.length - 1) + 1) / hairSteps.length) * 100);

  return (
    <div>
      {header}
      {inputs}
      <div className="mx-auto mt-8 max-w-3xl">
        {run.phase === "error" && (
          <div role="alert" className="mb-6 border border-espresso p-4">
            <p className="font-display text-2xl leading-7">That didn’t work.</p>
            <p className="mt-1 text-sm leading-6">{run.message}</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => void generateAll()} className={secondaryButton}>
                Retry
              </button>
              <button type="button" onClick={removePhoto} className={secondaryButton}>
                Choose Another Photo
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="flex items-center justify-between text-sm text-stone">
            <span>{atReview ? "Review your answers" : `Question ${index + 1} of ${hairSteps.length}`}</span>
            {!atReview && current?.optional && <span>Optional</span>}
          </p>
          <div
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={hairSteps.length}
            aria-valuenow={atReview ? hairSteps.length : index + 1}
            className="mt-2 h-1 w-full bg-sand"
          >
            <div className="h-full bg-espresso transition-[width] duration-300" style={{ width: `${atReview ? 100 : progress}%` }} />
          </div>
          <button type="button" onClick={startOver} className="mt-1 inline-flex min-h-11 items-center text-sm text-stone underline underline-offset-4">
            Start Over
          </button>
        </div>

        <div key={index} className="quiz-step mt-4">
          {current && (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl leading-tight outline-none md:text-4xl">
                {questions[current.id].title}
              </h2>
              <p className="mt-2 text-stone">{questions[current.id].hint}</p>
              {renderQuestion(current.id)}
            </>
          )}

          {atReview && (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl leading-tight outline-none md:text-4xl">
                Ready when you are.
              </h2>
              <p className="mt-2 text-stone">Check your answers. Tap Edit to change any of them.</p>
              <ul className="mt-6 divide-y divide-sand border-y border-sand">
                {hairSteps.map((step, stepIndex) => (
                  <li key={step.id} className="flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-stone">{stepTitles[step.id]}</p>
                      <p className="mt-1 [overflow-wrap:anywhere]">{summary(step.id, answers)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStepError("");
                        setIndex(stepIndex);
                      }}
                      className="inline-flex min-h-11 shrink-0 items-center text-sm underline underline-offset-4"
                    >
                      Edit<span className="sr-only"> {stepTitles[step.id]}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-20 w-16 shrink-0 overflow-hidden border border-sand bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {photo && <img src={photoUrl(photo)} alt="Your photo" className="h-full w-full object-cover" />}
                </div>
                <p className="text-sm leading-6 text-stone">
                  Generating will use this photo to create four hairstyle previews of you.
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-stone">
                The next step sends your photo to Google’s Gemini to plan four looks and create
                previews of your hair. VEYORAQ doesn’t store it. Previews are AI visualisations and
                may not match exactly.
              </p>
              {stylingUnavailable && (
                <p role="alert" className="mt-3 border border-espresso p-3 text-sm leading-6">
                  Hair previews can’t be created on this site right now, because the AI service
                  isn’t set up here. Your answers are safe.
                </p>
              )}
              {imagesOff && (
                <p className="mt-3 text-sm leading-6 text-stone">
                  AI picture generation isn’t switched on for this site yet, so you’ll get four
                  written hairstyle ideas without pictures.
                </p>
              )}
            </>
          )}
        </div>

        {stepError && (
          <p role="alert" className="mt-4 border border-espresso p-3 text-sm">
            {stepError}
          </p>
        )}

        <QuizActions>
            <button
              type="button"
              disabled={index === 0 && !atReview ? true : false}
              onClick={() => {
                setStepError("");
                if (index === 0) setConfirmed(false);
                else setIndex((value) => Math.max(0, value - 1));
              }}
              className={secondaryButton}
            >
              Back
            </button>
            {atReview ? (
              <button
                type="button"
                disabled={busy || stylingUnavailable}
                onClick={() => void generateAll()}
                className={`${primaryButton} flex-1 md:flex-none`}
              >
                {busy ? "Generating…" : "Generate My Four Looks"}
              </button>
            ) : (
              <>
                <button type="button" onClick={goNext} className={`${primaryButton} flex-1 md:flex-none`}>
                  Continue
                </button>
                {current?.optional && (
                  <button type="button" onClick={skip} className="inline-flex min-h-12 items-center px-2 text-sm underline underline-offset-4">
                    Skip
                  </button>
                )}
              </>
            )}
        </QuizActions>
      </div>

      {looks.status === "ready" && looks.looks.length > 0 && (
        <section aria-labelledby="saved-hair" className="mt-14 border-t border-sand pt-8">
          <h2 id="saved-hair" className="font-display text-3xl leading-tight">
            Your saved hair looks
          </h2>
          <p className="mt-1 text-sm text-stone">Kept on this device only.</p>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {looks.looks.map((look) => (
              <li key={look.id}>
                <div className="aspect-[4/5] overflow-hidden border border-sand bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(look.image)} alt={`Saved hairstyle preview: ${look.name}`} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 font-display text-lg leading-6">{look.name}</p>
                <button
                  type="button"
                  onClick={() => void hairLooksStore.remove(look.id)}
                  className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
