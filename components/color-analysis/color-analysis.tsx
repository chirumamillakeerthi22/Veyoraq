"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  photoUrl,
  primaryButton,
  releasePhoto,
  secondaryButton,
  StylingProgress,
} from "@/components/fix-my-style/styled-result";
import { QuizActions } from "@/components/quiz-actions";
import { OptionCard } from "@/components/stylist/option-card";
import { useAiStatus } from "@/lib/ai/use-ai-status";
import { useAuthState } from "@/lib/auth/use-auth";
import {
  assessPhoto,
  detectFace,
  warningText,
  type PhotoWarning,
} from "@/lib/color-analysis/photo-check";
import {
  budgetValues,
  colourLimits,
  colourSteps,
  eyeSwatch,
  eyeValues,
  firstMissingStep,
  hairSwatch,
  hairValues,
  helpValues,
  isStepAnswered,
  labels,
  qualitySwatch,
  qualityValues,
  stepProblem,
  sunValues,
  toggleLimited,
  currencyValues,
  type ColourAnswers,
  type ColourStepId,
} from "@/lib/color-analysis/quiz";
import {
  analysisSchema,
  emptyColourDraft,
  hasUsablePalette,
  seasonLabels,
  validateColourDraft,
  type ColourAnalysis,
  type ColourStage,
  type Swatch,
} from "@/lib/color-analysis/schema";
import { colourReportsStore, useColourReports } from "@/lib/color-analysis/use-colour-reports";
import { blobToBase64, prepareImage, validateFile } from "@/lib/fix-my-style/image";
import { createDraftStore } from "@/lib/persist/draft";
import { filterProducts, noFilters } from "@/lib/shop/match";
import type { Product } from "@/lib/shop/product";

/* ---------- state ---------- */

// Answers, step and the finished result survive a refresh. The photo never does.
const colourDraft = createDraftStore({
  key: "veyoraq:draft:color-analysis",
  version: 1,
  initial: emptyColourDraft,
  validate: validateColourDraft,
});

type Run =
  | { phase: "idle" }
  | { phase: "analysing" }
  | { phase: "error"; message: string; retry: boolean };

const ACCEPT = "image/jpeg,image/png,image/webp";
const REVIEW = colourSteps.length;
const OFFLINE = "You appear to be offline. Check your connection and try again.";

// VEYORAQ has no product catalogue yet. When one exists, records go here (or are
// loaded from it) and Shop My Colors filters them; nothing is ever invented.
const catalogue: Product[] = [];

const questions: Record<ColourStepId, { title: string; hint: string }> = {
  hair: { title: "What is your natural hair colour?", hint: "Your natural colour if you know it, rather than a dye. “Other or unsure” is fine." },
  eyes: { title: "What colour are your eyes?", hint: "Pick the closest." },
  sun: {
    title: "How does your skin usually react to the sun?",
    hint: "This is only supporting context. It doesn’t decide your undertone.",
  },
  qualities: {
    title: "Which colour qualities appeal to you?",
    hint: "Pick up to 2. What you like isn’t proof of what suits you, but it helps us tailor your picks.",
  },
  help: { title: "What would you like help with?", hint: "Pick any that apply." },
  budget: { title: "What’s your shopping budget?", hint: "A comfortable range for a new piece." },
};

const stepTitles: Record<ColourStepId, string> = {
  hair: "Hair colour",
  eyes: "Eye colour",
  sun: "Sun reaction",
  qualities: "Colour qualities",
  help: "Help with",
  budget: "Budget",
};

function summary(step: ColourStepId, a: ColourAnswers): string {
  switch (step) {
    case "hair":
      return a.hair ? labels.hair[a.hair] : "Not chosen";
    case "eyes":
      return a.eyes ? labels.eyes[a.eyes] : "Not chosen";
    case "sun":
      return a.sun ? labels.sun[a.sun] : "Skipped";
    case "qualities":
      return a.qualities.length ? a.qualities.map((v) => labels.quality[v]).join(", ") : "Skipped";
    case "help":
      return a.help.length ? a.help.map((v) => labels.help[v]).join(", ") : "Skipped";
    case "budget":
      return a.budget ? `${labels.budget[a.budget]} (${a.currency})` : "Skipped";
  }
}

/* ---------- small pieces ---------- */

function Dots({ colours }: { colours: string[] }) {
  return (
    <span aria-hidden="true" className="mb-2 flex gap-1">
      {colours.map((c) => (
        <span key={c} className="h-6 w-6 rounded-full border border-espresso/15" style={{ backgroundColor: c }} />
      ))}
    </span>
  );
}

function SwatchCard({
  swatch,
  selected,
  onSelect,
}: {
  swatch: Swatch;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(swatch.hex.toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the HEX is shown as text, so nothing is lost.
    }
  }
  return (
    <li className={`border bg-soft-white ${selected ? "border-espresso" : "border-sand"}`}>
      <button
        type="button"
        onClick={onSelect}
        disabled={!onSelect}
        aria-pressed={onSelect ? selected : undefined}
        aria-label={`${swatch.name}, ${swatch.hex.toUpperCase()}`}
        className="block h-20 w-full disabled:cursor-default"
        style={{ backgroundColor: swatch.hex }}
      />
      <div className="p-3">
        <p className="text-sm font-medium leading-5">{swatch.name}</p>
        <p className="mt-0.5 text-xs leading-5 text-stone">{swatch.usage}</p>
        <button
          type="button"
          onClick={copy}
          className="mt-1 inline-flex min-h-11 items-center text-xs uppercase tracking-[0.1em] underline underline-offset-4"
        >
          {copied ? "Copied" : swatch.hex.toUpperCase()}
          <span className="sr-only"> Copy HEX</span>
        </button>
      </div>
    </li>
  );
}

function SwatchGroup({
  title,
  note,
  swatches,
  selected,
  onSelect,
}: {
  title: string;
  note?: string;
  swatches: Swatch[];
  selected: string | null;
  onSelect: (hex: string) => void;
}) {
  if (swatches.length === 0) return null;
  return (
    <section aria-label={title}>
      <h3 className="font-display text-2xl leading-8">{title}</h3>
      {note && <p className="mt-1 text-sm leading-6 text-stone">{note}</p>}
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {swatches.map((swatch) => (
          <SwatchCard
            key={`${swatch.name}-${swatch.hex}`}
            swatch={swatch}
            selected={selected?.toLowerCase() === swatch.hex.toLowerCase()}
            onSelect={() => onSelect(swatch.hex)}
          />
        ))}
      </ul>
    </section>
  );
}

/* ---------- component ---------- */

export function ColourAnalysisTool() {
  const ai = useAiStatus();
  const auth = useAuthState();
  const signedIn = auth.status === "signed-in";
  const reports = useColourReports();
  const draft = useSyncExternalStore(
    colourDraft.subscribe,
    colourDraft.getSnapshot,
    colourDraft.getServerSnapshot,
  );
  const restored = useSyncExternalStore(
    () => () => {},
    () => colourDraft.wasRestored(),
    () => false,
  );
  const { stage, index, answers, result } = draft;

  const patch = (next: Partial<typeof draft>) => colourDraft.set((current) => ({ ...current, ...next }));
  const setAnswers = (next: Partial<ColourAnswers>) =>
    colourDraft.set((current) => ({ ...current, answers: { ...current.answers, ...next } }));

  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [photo, setPhoto] = useState<Blob | null>(null);
  // The person has looked at the photo (and any warnings) and pressed Continue.
  const [confirmed, setConfirmed] = useState(false);
  const [warnings, setWarnings] = useState<PhotoWarning[]>([]);
  const [faceMissing, setFaceMissing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [problem, setProblem] = useState("");
  const [stepError, setStepError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [run, setRun] = useState<Run>({ phase: "idle" });
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    headingRef.current?.focus();
  }, [stage, index]);

  const stylingUnavailable = ai.state === "ready" && !ai.text;
  // After a refresh the photo is gone, so a quiz in progress goes back to the photo
  // screen first (answers and step are kept).
  const shown: ColourStage = stage === "quiz" && !(photo && confirmed) ? "photo" : stage;
  const busy = preparing || run.phase === "analysing";

  /* ----- photo ----- */

  async function choose(file: File | undefined) {
    if (!file) return;
    setProblem("");
    const invalid = validateFile(file);
    if (invalid) return setProblem(invalid);
    setPreparing(true);
    const prepared = await prepareImage(file);
    if (!prepared.ok) {
      setPreparing(false);
      return setProblem(prepared.message);
    }
    const [found, faces] = await Promise.all([assessPhoto(prepared.blob), detectFace(prepared.blob)]);
    setPreparing(false);
    if (photo) releasePhoto(photo);
    setPhoto(prepared.blob);
    setConfirmed(false);
    setWarnings(found);
    setFaceMissing(faces === false);
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
    setWarnings([]);
    setFaceMissing(false);
    setRun({ phase: "idle" });
  }

  function startOver() {
    removePhoto();
    colourDraft.clear();
    setProblem("");
    setStepError("");
    setSaveState("idle");
    setSelectedHex(null);
  }

  /* ----- analysis ----- */

  async function analyse() {
    if (!photo || run.phase === "analysing") return;
    const missing = firstMissingStep(answers);
    if (missing) {
      patch({ index: colourSteps.findIndex((step) => step.id === missing) });
      return setStepError(stepProblem(missing, answers) ?? "");
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return setRun({ phase: "error", message: OFFLINE, retry: true });
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort(), 60_000);
    setRun({ phase: "analysing" });
    setSaveState("idle");

    try {
      const response = await fetch("/api/color-analysis/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: await blobToBase64(photo), answers }),
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
        return setRun({
          phase: "error",
          message: err?.message ?? "We couldn't analyse your colours just now. Please try again.",
          retry: err?.code !== "no_photo" && response.status !== 400 && response.status !== 415,
        });
      }
      const parsed = analysisSchema.safeParse(data);
      if (!parsed.success || !hasUsablePalette(parsed.data)) {
        return setRun({ phase: "error", message: "We couldn't read the result. Please try again.", retry: true });
      }
      setRun({ phase: "idle" });
      setSelectedHex(null);
      patch({ stage: "results", result: parsed.data });
    } catch {
      setRun({
        phase: "error",
        message: controller.signal.aborted
          ? "That took too long. Please try again."
          : "We couldn't reach the analysis service. Check your connection and try again.",
        retry: true,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function saveReport(analysis: ColourAnalysis) {
    setSaveState("saving");
    const id = `colour-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const ok = await colourReportsStore.save({ id, savedAt: Date.now(), analysis });
    setSaveState(ok ? "saved" : "error");
  }

  /* ----- quiz rendering ----- */

  function renderQuestion(step: ColourStepId) {
    const cols = "grid-cols-2 sm:grid-cols-3";
    const radio = <T extends string>(
      name: string,
      values: readonly T[],
      map: Record<T, string>,
      current: T | null,
      set: (v: T | null) => void,
      swatches?: Record<T, string[]>,
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
              visual={swatches ? <Dots colours={swatches[value]} /> : undefined}
              checked={current === value}
              onChange={() => set(current === value ? null : value)}
            />
          ))}
        </div>
      </fieldset>
    );

    switch (step) {
      case "hair":
        return radio("hair", hairValues, labels.hair, answers.hair, (v) => setAnswers({ hair: v }), hairSwatch);
      case "eyes":
        return radio("eyes", eyeValues, labels.eyes, answers.eyes, (v) => setAnswers({ eyes: v }), eyeSwatch);
      case "sun":
        return radio("sun", sunValues, labels.sun, answers.sun, (v) => setAnswers({ sun: v }));
      case "qualities":
        return (
          <fieldset className="mt-6">
            <legend className="sr-only">{questions[step].title}</legend>
            <div className={`grid gap-3 ${cols}`}>
              {qualityValues.map((value) => {
                const checked = answers.qualities.includes(value);
                return (
                  <OptionCard
                    key={value}
                    type="checkbox"
                    name="qualities"
                    value={value}
                    label={labels.quality[value]}
                    visual={<Dots colours={qualitySwatch[value]} />}
                    checked={checked}
                    disabled={!checked && answers.qualities.length >= colourLimits.qualities}
                    onChange={() =>
                      setAnswers({ qualities: toggleLimited(answers.qualities, value, colourLimits.qualities) })
                    }
                  />
                );
              })}
            </div>
          </fieldset>
        );
      case "help":
        return (
          <fieldset className="mt-6">
            <legend className="sr-only">{questions[step].title}</legend>
            <div className={`grid gap-3 ${cols}`}>
              {helpValues.map((value) => (
                <OptionCard
                  key={value}
                  type="checkbox"
                  name="help"
                  value={value}
                  label={labels.help[value]}
                  checked={answers.help.includes(value)}
                  onChange={() => setAnswers({ help: toggleLimited(answers.help, value, colourLimits.help) })}
                />
              ))}
            </div>
          </fieldset>
        );
      case "budget":
        return (
          <div className="mt-6">
            <fieldset>
              <legend className="sr-only">{questions[step].title}</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {budgetValues.map((value) => (
                  <OptionCard
                    key={value}
                    type="radio"
                    name="budget"
                    value={value}
                    label={labels.budget[value]}
                    checked={answers.budget === value}
                    onChange={() => setAnswers({ budget: answers.budget === value ? null : value })}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-5">
              <legend className="text-sm text-stone">Currency</legend>
              <p className="mt-1 text-xs leading-5 text-stone">Choose the one you shop in; we don’t guess it from where you are.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {currencyValues.map((value) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="currency"
                      value={value}
                      checked={answers.currency === value}
                      onChange={() => setAnswers({ currency: value })}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-11 items-center border border-sand bg-soft-white px-4 text-sm transition-colors duration-200 peer-checked:border-espresso peer-checked:bg-espresso peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso">
                      {value}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        );
    }
  }

  function goNext() {
    const current = colourSteps[index];
    if (current) {
      const message = stepProblem(current.id, answers);
      if (message) return setStepError(message);
    }
    setStepError("");
    patch({ index: Math.min(REVIEW, index + 1) });
  }

  function skip() {
    const current = colourSteps[index];
    const clear: Partial<Record<ColourStepId, Partial<ColourAnswers>>> = {
      sun: { sun: null },
      qualities: { qualities: [] },
      help: { help: [] },
      budget: { budget: null },
    };
    if (current && clear[current.id]) setAnswers(clear[current.id]!);
    setStepError("");
    patch({ index: Math.min(REVIEW, index + 1) });
  }

  /* ----- shared bits ----- */

  const inputs = (
    <>
      <input ref={cameraInput} type="file" accept={ACCEPT} capture="user" onChange={onPick} tabIndex={-1} aria-hidden="true" className="sr-only" />
      <input ref={libraryInput} type="file" accept={ACCEPT} onChange={onPick} tabIndex={-1} aria-hidden="true" className="sr-only" />
    </>
  );

  const estimateNote = (
    <p className="text-sm leading-6 text-stone">
      This is an estimate, not a scientific measurement. Lighting, camera processing, makeup and
      screen settings all affect how colour looks in a photo, so no photo can give a perfect result.
    </p>
  );

  /* ---------- screens ---------- */

  // Results
  if (shown === "results" && result) {
    const allHexes = [...result.recommendedColors, ...result.neutralColors, ...result.accentColors];
    const uncertain = result.likelySeason === "uncertain";
    const matches = filterProducts(catalogue, allHexes.map((s) => s.hex), {
      ...noFilters,
      colourHex: selectedHex,
    });
    const known = (hex: string) => allHexes.find((s) => s.hex.toLowerCase() === hex.toLowerCase());

    return (
      <div className="space-y-12">
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">Your colour guide</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl leading-[1.05] outline-none sm:text-5xl md:text-6xl">
            {uncertain ? "Colours to explore" : seasonLabels[result.likelySeason as keyof typeof seasonLabels]}
          </h1>
          <p className="mt-4 text-lg leading-8 text-stone">{result.summary}</p>
          <p className="mt-3 text-sm leading-6 text-stone">
            {uncertain
              ? "The evidence from one photo wasn’t strong enough to name a single season, so these are palettes to try rather than a conclusion."
              : "A likely match based on your photo and answers, not a certainty."}
          </p>
        </header>

        <section aria-label="Your profile">
          <dl className="grid gap-px border border-sand bg-sand sm:grid-cols-3">
            {[
              ["Undertone", result.undertone.value === "uncertain" ? "Uncertain" : `Likely ${result.undertone.value}`, `${result.undertone.confidence} confidence`],
              ["Depth", result.depth === "uncertain" ? "Uncertain" : result.depth, ""],
              ["Contrast", result.contrast === "uncertain" ? "Uncertain" : result.contrast, ""],
            ].map(([term, value, extra]) => (
              <div key={term} className="bg-soft-white p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-stone">{term}</dt>
                <dd className="mt-1 font-display text-2xl capitalize leading-7">{value}</dd>
                {extra && <dd className="text-xs capitalize text-stone">{extra}</dd>}
              </div>
            ))}
          </dl>
          <p className="mt-4 max-w-2xl leading-7">{result.undertone.explanation}</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone">
            <span className="font-medium text-espresso">How sure are we? </span>
            {result.confidenceExplanation}
          </p>
          {result.alternativeSeason !== "none" && !uncertain && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone">
              A close second: {seasonLabels[result.alternativeSeason as keyof typeof seasonLabels]}.
            </p>
          )}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setSaveState("idle");
                patch({ stage: "quiz", index: 0, result: null });
              }}
              className={secondaryButton}
            >
              Refine my result
            </button>
          </div>
        </section>

        {result.explorePalettes.length > 0 && (
          <section aria-label="Palettes to explore">
            <h2 className="font-display text-3xl leading-tight">Palettes to explore</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-stone">
              These are exploratory suggestions, not equally confirmed results. Try colours from
              each in daylight and see which feel most like you.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {result.explorePalettes.map((season) => (
                <li key={season} className="border border-dashed border-espresso/40 px-4 py-2 text-sm">
                  {seasonLabels[season]}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="palette" aria-labelledby="palette-heading" className="space-y-8">
          <div>
            <h2 id="palette-heading" className="font-display text-3xl leading-tight">
              Your palette
            </h2>
            <p className="mt-1 text-sm text-stone">Tap a colour to select it. HEX values can be copied.</p>
          </div>
          <SwatchGroup title="Colours to wear" swatches={result.recommendedColors} selected={selectedHex} onSelect={setSelectedHex} />
          <SwatchGroup title="Your neutrals" note="Easy base colours that sit well with the rest." swatches={result.neutralColors} selected={selectedHex} onSelect={setSelectedHex} />
          <SwatchGroup title="Accent and statement colours" swatches={result.accentColors} selected={selectedHex} onSelect={setSelectedHex} />
          <SwatchGroup title="Colours to explore carefully" note="These may need more care. Try them away from the face first, or in softer versions." swatches={result.colorsToExploreCarefully} selected={selectedHex} onSelect={setSelectedHex} />
        </section>

        <section aria-labelledby="combos-heading">
          <h2 id="combos-heading" className="font-display text-3xl leading-tight">
            Colour combinations
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {result.colorCombinations.map((combo) => (
              <li key={combo.name} className="border border-sand bg-soft-white p-4">
                <div className="flex h-10 overflow-hidden border border-espresso/15" aria-hidden="true">
                  {combo.colors.map((hex) => (
                    <span key={hex} className="flex-1" style={{ backgroundColor: hex }} />
                  ))}
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone">{combo.occasion}</p>
                <p className="font-display text-xl leading-7">{combo.name}</p>
                <p className="mt-1 text-sm leading-6">{combo.idea}</p>
                <p className="mt-1 text-xs leading-5 text-stone">
                  {combo.colors.map((hex) => known(hex)?.name ?? hex.toUpperCase()).join(" + ")}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {result.stylingAdvice.length > 0 && (
          <section aria-labelledby="advice-heading">
            <h2 id="advice-heading" className="font-display text-3xl leading-tight">
              Wearing your colours
            </h2>
            <ul className="mt-3 max-w-2xl list-disc space-y-2 pl-5 leading-7 text-stone">
              {result.stylingAdvice.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        )}

        <section id="shop" aria-labelledby="shop-heading" className="border-t border-sand pt-8">
          <h2 id="shop-heading" className="font-display text-3xl leading-tight">
            Shop My Colors
          </h2>
          {matches.length > 0 ? (
            <p className="mt-2 text-sm text-stone">{matches.length} matching products.</p>
          ) : (
            <p className="mt-2 max-w-2xl leading-7 text-stone">
              No matching products are available yet: VEYORAQ doesn’t have a product catalogue
              connected, so there are no listings, prices or links here. Your colour results are
              complete without it. Below are outfit ideas built from your palette. They are ideas,
              not products for sale.
            </p>
          )}
          {selectedHex && (
            <p className="mt-2 text-sm text-stone">
              Selected colour: {known(selectedHex)?.name ?? selectedHex.toUpperCase()}. When products
              are connected, they will be filtered to it.
            </p>
          )}
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.colorCombinations.map((combo) => (
              <li key={combo.name} className="border border-dashed border-espresso/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone">Outfit idea, not a product</p>
                <p className="mt-1 font-display text-xl leading-6">{combo.name}</p>
                <p className="mt-1 text-sm leading-6">{combo.idea}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Actions" className="flex flex-col gap-3 border-t border-sand pt-8 sm:flex-row sm:flex-wrap">
          <a href="#palette" className={primaryButton}>
            View My Palette
          </a>
          <a href="#shop" className={secondaryButton}>
            Shop My Colors
          </a>
          <button
            type="button"
            disabled={saveState === "saving" || saveState === "saved"}
            onClick={() => void saveReport(result)}
            className={secondaryButton}
          >
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Results saved" : "Save My Results"}
          </button>
          <button type="button" onClick={startOver} className={secondaryButton}>
            Retake Analysis
          </button>
        </section>
        {saveState === "saved" && (
          <p role="status" className="-mt-8 text-sm leading-6 text-stone">
            {signedIn
              ? "Saved to your account. It holds your palette and report, not your photo."
              : "Saved on this device only. It holds your palette and report, not your photo."}
            {!signedIn && (
              <>
                {" "}
                <a href="/account" className="underline underline-offset-4">
                  Sign in
                </a>{" "}
                to keep your reports in your account.
              </>
            )}
          </p>
        )}
        {saveState === "error" && (
          <p role="alert" className="-mt-8 text-sm leading-6">
            We couldn’t save this on your device. Your browser may be blocking storage.
          </p>
        )}
        <p className="max-w-2xl text-xs leading-5 text-stone">
          Colour analysis here is an estimate for styling inspiration, not a medical,
          dermatological or scientific assessment.
        </p>
      </div>
    );
  }

  // Introduction
  if (shown === "intro" || shown === "results") {
    return (
      <div>
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">Colour Analysis</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl leading-[1.05] outline-none sm:text-5xl md:text-6xl">
            Discover the Colors That Feel Like <em>You</em>
          </h1>
          <p className="mt-4 text-base leading-7 text-stone md:text-lg md:leading-8">
            Your personal color guide helps you explore shades that may complement your natural
            coloring and build a wardrobe that feels more you.
          </p>
        </header>

        <ul className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            ["Your likely season", "Discover your likely color season."],
            ["Your palette", "Find your personalized color palette."],
            ["Shop with confidence", "Explore clothing in colors selected for you."],
          ].map(([title, text]) => (
            <li key={title} className="border border-sand bg-soft-white p-5">
              <p className="font-display text-2xl leading-8">{title}</p>
              <p className="mt-1 text-sm leading-6 text-stone">{text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 max-w-2xl">
          <button
            type="button"
            onClick={() => patch({ stage: "guidance" })}
            className={`${primaryButton} w-full sm:w-auto`}
          >
            Discover My Colors
          </button>
          <p className="mt-3 text-sm leading-6 text-stone">
            A few simple questions and a photo are all you need to begin.
          </p>
          <div className="mt-4">{estimateNote}</div>
        </div>

        {reports.status === "ready" && reports.looks.length > 0 && (
          <section aria-labelledby="saved-reports" className="mt-12 border-t border-sand pt-8">
            <h2 id="saved-reports" className="font-display text-3xl leading-tight">
              Your saved colour reports
            </h2>
            <p className="mt-1 text-sm text-stone">
              {signedIn ? "Kept in your account." : "Kept on this device only."} No photo is stored.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {reports.looks.map((report) => (
                <li key={report.id} className="border border-sand bg-soft-white p-4">
                  <div className="flex h-8 overflow-hidden border border-espresso/15" aria-hidden="true">
                    {report.analysis.recommendedColors.slice(0, 6).map((s) => (
                      <span key={s.hex} className="flex-1" style={{ backgroundColor: s.hex }} />
                    ))}
                  </div>
                  <p className="mt-2 font-display text-xl leading-6">
                    {report.analysis.likelySeason === "uncertain"
                      ? "Colours to explore"
                      : seasonLabels[report.analysis.likelySeason]}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => patch({ stage: "results", result: report.analysis })}
                      className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => void colourReportsStore.remove(report.id)}
                      className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  // Photo guidance
  if (shown === "guidance") {
    return (
      <div>
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">Step 1 of 3</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl leading-[1.05] outline-none sm:text-5xl md:text-6xl">
            Let’s Get Your Best Photo
          </h1>
          <p className="mt-4 text-base leading-7 text-stone md:text-lg md:leading-8">
            A clear, naturally lit photo helps us estimate your coloring more consistently.
          </p>
        </header>

        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ["Find soft daylight", ["Stand facing a large window during the day.", "Use bright, indirect natural daylight.", "Let light fall evenly across the face.", "Avoid direct sunlight and harsh shadows."]],
            ["Choose a simple background", ["Use a plain white, grey or beige wall.", "If possible, wear a neutral-colored top.", "Avoid brightly colored lighting and reflective backgrounds."]],
            ["Face the camera", ["Position the camera at eye level.", "Capture the entire face and the top of the shoulders.", "Keep hair away from the face when practical.", "Keep the face in focus."]],
            ["Keep colors natural", ["Turn off beauty filters and color effects.", "Avoid heavy foundation when convenient.", "Remove tinted glasses if comfortable.", "Avoid yellow indoor lighting and colored light sources."]],
          ].map(([title, items], i) => (
            <li key={title as string} className="border border-sand bg-soft-white p-5">
              <p className="flex items-center gap-3 font-display text-2xl leading-7">
                <span aria-hidden="true" className="text-olive">{i + 1}</span>
                {title as string}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-stone">
                {(items as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section aria-label="Do" className="border border-espresso/30 p-5">
            <p className="font-display text-2xl leading-7">Do</p>
            <ul className="mt-2 space-y-1 text-sm leading-6">
              {["Even, indirect daylight", "A front-facing, clear image", "Natural-looking skin color", "Neutral surroundings"].map((t) => (
                <li key={t}>
                  <span aria-hidden="true">✓ </span>
                  {t}
                </li>
              ))}
            </ul>
          </section>
          <section aria-label="Avoid" className="border border-dashed border-espresso/40 p-5">
            <p className="font-display text-2xl leading-7">Avoid</p>
            <ul className="mt-2 space-y-1 text-sm leading-6">
              {["Strong shadows", "Dark or blurry images", "Beauty filters", "Warm yellow bulbs or colored lighting"].map((t) => (
                <li key={t}>
                  <span aria-hidden="true">✕ </span>
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-6 text-stone">
          <span className="font-medium text-espresso">Tip: </span>
          Daylight varies throughout the day. Aim for soft, even light rather than a specific time.
        </p>
        <div className="mt-2 max-w-2xl">{estimateNote}</div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => patch({ stage: "photo" })} className={primaryButton}>
            Take or Upload My Photo
          </button>
          <button type="button" onClick={() => patch({ stage: "intro" })} className={secondaryButton}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // Photo upload and preview
  if (shown === "photo") {
    const resuming = stage === "quiz" && !photo;
    return (
      <div>
        {inputs}
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">Step 2 of 3</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl leading-[1.05] outline-none sm:text-5xl md:text-6xl">
            Your photo
          </h1>
        </header>

        {(restored || resuming) && resuming && (
          <p role="status" className="mt-4 max-w-2xl border border-espresso/40 bg-soft-white p-4 text-sm leading-6">
            Welcome back. Your answers are saved, but a photo can’t be kept when the page reloads, so
            please add it again to carry on.
          </p>
        )}

        <section aria-label="Photo" className="mt-6 grid gap-6 md:grid-cols-12 md:items-start md:gap-10">
          <div className="md:col-span-6 lg:col-span-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void choose(e.dataTransfer.files[0]);
              }}
              className={`relative w-full overflow-hidden border ${
                photo ? "aspect-[4/5] max-h-[62dvh] border-sand bg-sand md:max-h-none" : `aspect-[3/2] md:aspect-[4/5] ${dragging ? "border-dashed border-espresso bg-sand/60" : "border-dashed border-espresso/40 bg-soft-white"}`
              }`}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl(photo)} alt="The photo you chose" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                  <p className="font-display text-2xl leading-7">Add a clear photo of your face</p>
                  <p className="max-w-xs text-sm leading-6 text-stone">Take one now or choose one you’ve taken.</p>
                </div>
              )}
              {preparing && (
                <div role="status" className="absolute inset-0 flex items-end justify-center bg-espresso/30 p-4">
                  <p className="bg-ivory px-4 py-2 text-sm">Checking your photo…</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              {photo ? (
                <>
                  <button type="button" disabled={busy} onClick={() => cameraInput.current?.click()} className={`${secondaryButton} flex-1`}>
                    Retake
                  </button>
                  <button type="button" disabled={busy} onClick={() => libraryInput.current?.click()} className={`${secondaryButton} flex-1`}>
                    Replace
                  </button>
                  <button type="button" onClick={removePhoto} className={`${secondaryButton} flex-1`}>
                    Remove
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
            <p className="mt-3 text-xs leading-5 text-stone">JPEG, PNG or WebP, up to 15 MB. If your device doesn’t open the camera, choose Upload Photo.</p>
            {problem && (
              <p role="alert" className="mt-3 border border-espresso p-3 text-sm leading-6">
                {problem}
              </p>
            )}
          </div>

          <div className="md:col-span-6 lg:col-span-7">
            {photo && (warnings.length > 0 || faceMissing) && (
              <div role="status" className="mb-4 border border-espresso/40 bg-soft-white p-4">
                <p className="font-medium">A few things to know</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6">
                  {faceMissing && <li>We couldn’t spot a face in this photo. Make sure your face is in view.</li>}
                  {warnings.map((w) => (
                    <li key={w}>{warningText[w]}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm leading-6 text-stone">You can continue anyway, or retake it for a steadier estimate.</p>
              </div>
            )}
            <h2 className="font-display text-2xl leading-8">How your photo is used</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-stone">
              <li>It stays on your device until you press Analyze My Colors.</li>
              <li>Then it is sent securely to Google’s Gemini to estimate your colouring.</li>
              <li>VEYORAQ doesn’t store or keep it, and it isn’t saved with your results.</li>
              <li>If you save results, only the palette and report are kept, on this device. Delete them any time, or press Start Over.</li>
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!photo || busy}
                onClick={() => {
                  setConfirmed(true);
                  patch({ stage: "quiz" });
                }}
                className={primaryButton}
              >
                Continue to My Color Quiz
              </button>
              <button type="button" onClick={() => patch({ stage: "guidance" })} className={secondaryButton}>
                Back
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Quiz and review
  const current = colourSteps[index];
  const atReview = index === REVIEW;
  const progress = Math.round(((Math.min(index, colourSteps.length - 1) + 1) / colourSteps.length) * 100);

  return (
    <div>
      {inputs}
      <div className="mx-auto max-w-3xl">
        {run.phase === "error" && (
          <div role="alert" className="mb-6 border border-espresso p-4">
            <p className="font-display text-2xl leading-7">That didn’t work.</p>
            <p className="mt-1 text-sm leading-6">{run.message}</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              {run.retry && (
                <button type="button" onClick={() => void analyse()} className={secondaryButton}>
                  Retry
                </button>
              )}
              <button type="button" onClick={() => { setRun({ phase: "idle" }); patch({ stage: "photo" }); }} className={secondaryButton}>
                Choose Another Photo
              </button>
            </div>
          </div>
        )}

        <p className="flex items-center justify-between text-sm text-stone">
          <span>{atReview ? "Review your answers" : `Question ${index + 1} of ${colourSteps.length}`}</span>
          {!atReview && current?.optional && <span>Optional</span>}
        </p>
        <div
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={colourSteps.length}
          aria-valuenow={atReview ? colourSteps.length : index + 1}
          className="mt-2 h-1 w-full bg-sand"
        >
          <div className="h-full bg-espresso transition-[width] duration-300" style={{ width: `${atReview ? 100 : progress}%` }} />
        </div>
        <button type="button" onClick={startOver} className="mt-1 inline-flex min-h-11 items-center text-sm text-stone underline underline-offset-4">
          Start Over
        </button>

        <div key={index} className="quiz-step mt-4">
          {current && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl leading-tight outline-none md:text-4xl">
                {questions[current.id].title}
              </h1>
              <p className="mt-2 text-stone">{questions[current.id].hint}</p>
              {renderQuestion(current.id)}
            </>
          )}

          {atReview && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl leading-tight outline-none md:text-4xl">
                Ready to see your colors?
              </h1>
              <p className="mt-2 text-stone">Check your answers. Tap Edit to change any of them.</p>
              <ul className="mt-6 divide-y divide-sand border-y border-sand">
                {colourSteps.map((step, i) => (
                  <li key={step.id} className="flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-stone">{stepTitles[step.id]}</p>
                      <p className={`mt-1 [overflow-wrap:anywhere] ${isStepAnswered(step.id, answers) ? "" : "text-stone"}`}>
                        {summary(step.id, answers)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStepError("");
                        patch({ index: i });
                      }}
                      className="inline-flex min-h-11 shrink-0 items-center text-sm underline underline-offset-4"
                    >
                      Edit<span className="sr-only"> {stepTitles[step.id]}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-6 text-stone">
                Pressing Analyze sends your photo to Google’s Gemini to estimate your colouring.
                VEYORAQ doesn’t store it. The result is an estimate, not a measurement.
              </p>
              {stylingUnavailable && (
                <p role="alert" className="mt-3 border border-espresso p-3 text-sm leading-6">
                  Colour analysis can’t run on this site right now, because the AI service isn’t set
                  up here. Your answers are safe.
                </p>
              )}
              {run.phase === "analysing" && (
                <div className="mt-4 border border-sand bg-soft-white">
                  <StylingProgress />
                </div>
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
            onClick={() => {
              setStepError("");
              if (index === 0) patch({ stage: "photo" });
              else patch({ index: index - 1 });
            }}
            className={secondaryButton}
          >
            Back
          </button>
          {atReview ? (
            <button
              type="button"
              disabled={busy || stylingUnavailable}
              onClick={() => void analyse()}
              className={`${primaryButton} flex-1 md:flex-none`}
            >
              {run.phase === "analysing" ? "Analyzing…" : "Analyze My Colors"}
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
    </div>
  );
}
