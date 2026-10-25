"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { FitJournal } from "@/components/fit-guidance/fit-journal";
import { FitPersonalColours, FitShop } from "@/components/fit-guidance/fit-colours-and-shop";
import { FitReportView } from "@/components/fit-guidance/fit-report-view";
import {
  photoUrl,
  primaryButton,
  releasePhoto,
  secondaryButton,
} from "@/components/fix-my-style/styled-result";
import { QuizActions } from "@/components/quiz-actions";
import { OptionCard } from "@/components/stylist/option-card";
import { useAiStatus } from "@/lib/ai/use-ai-status";
import { audienceLabels } from "@/lib/audience";
import { fitDraft } from "@/lib/fit-guidance/draft";
import {
  checkMeasurements,
  convertText,
  suggestPattern,
  type RawMeasurements,
} from "@/lib/fit-guidance/measurements";
import {
  categoriesByAudience,
  categoryLabels,
  comfortLabels,
  comfortValues,
  fitPrefLabels,
  fitPrefValues,
  focusLabels,
  focusValues,
  measureFields,
  occasionLabels,
  occasionValues,
  shapeHints,
  shapeLabels,
  shapesByAudience,
  sizeFields,
  sizeSuggestions,
  SIZE_PATTERN,
  unitValues,
  type Category,
  type Method,
  type Shape,
  type Unit,
} from "@/lib/fit-guidance/options";
import { buildReport, type FitQuiz, type ShapeSource } from "@/lib/fit-guidance/report";
import { photoAnalysisSchema, type FitDraft, type FitStage } from "@/lib/fit-guidance/schema";
import { fitReportsStore, useFitReports } from "@/lib/fit-guidance/use-fit-reports";
import { blobToBase64, prepareImage, validateFile } from "@/lib/fix-my-style/image";
import { useAudience } from "@/lib/use-audience";

const ACCEPT = "image/jpeg,image/png,image/webp";
const OFFLINE = "You appear to be offline. Check your connection and try again.";

type Question = {
  id: keyof FitQuiz;
  title: string;
  hint: string;
};

const questions: Question[] = [
  { id: "fitPref", title: "What kind of fit do you usually prefer?", hint: "Optional. There is no right answer." },
  { id: "categories", title: "Which clothes would you like advice on?", hint: "Choose any that apply, or skip to see them all." },
  { id: "occasions", title: "What are you dressing for?", hint: "Optional. Choose any that apply." },
  { id: "focus", title: "Is there anything you’d like your outfits to do?", hint: "Optional. These are preferences, not rules." },
  { id: "comfort", title: "Any comfort, coverage or movement preferences?", hint: "Optional. We’ll respect these in the suggestions." },
];

const methodTitles: Record<Exclude<Method, "known" | "tips">, string> = {
  measurements: "Measurements",
  sizes: "Existing clothing sizes",
  photo: "Full-body photo",
};

/* ---------- small icons for the option cards ---------- */

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-8 w-8 text-gold"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const icons = {
  known: (
    <Icon>
      <circle cx="12" cy="6" r="2.2" />
      <path d="M8 21c.4-4 1.5-6.500 4-6.500s3.600 2.500 4 6.500M7.500 11.500c1.500 1.200 7.500 1.200 9 0" />
    </Icon>
  ),
  help: (
    <Icon>
      <path d="M4 15.500 15.500 4l4.500 4.500L8.500 20H4zM11.500 8l4.500 4.500M8 11.500l2 2M10.500 9l1.500 1.500" />
    </Icon>
  ),
  tips: (
    <Icon>
      <path d="M12 4l1.700 4.800L18.500 10.500l-4.800 1.700L12 17l-1.700-4.800L5.500 10.500l4.800-1.700z" />
    </Icon>
  ),
  measurements: (
    <Icon>
      <path d="M3 9h18v6H3zM7 9v3M11 9v2M15 9v3M19 9v2" />
    </Icon>
  ),
  sizes: (
    <Icon>
      <path d="M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3c-.5 1.500-2 2.200-4 2.200S8.500 5.500 8 4z" />
    </Icon>
  ),
  photo: (
    <Icon>
      <path d="M4 8h3l1.500-2h7L17 8h3v11H4zM12 17a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7z" />
    </Icon>
  ),
};

function ChoiceCard({
  icon,
  title,
  text,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex h-full w-full flex-col items-start gap-3 border border-sand bg-soft-white p-5 text-left transition-colors duration-200 hover:border-espresso/50 disabled:opacity-60"
    >
      {icon}
      <span className="font-display text-2xl leading-7">{title}</span>
      <span className="text-sm leading-6 text-stone">{text}</span>
      <span aria-hidden="true" className="mt-auto pt-2 text-sm text-espresso transition-transform duration-300 group-hover:translate-x-0.5">
        Choose →
      </span>
    </button>
  );
}

/* ---------- the tool ---------- */

export function FitGuidanceTool() {
  const audience = useAudience();
  const ai = useAiStatus();
  const draft = useSyncExternalStore(fitDraft.subscribe, fitDraft.getSnapshot, fitDraft.getServerSnapshot);
  const restored = useSyncExternalStore(
    () => () => {},
    () => fitDraft.wasRestored(),
    () => false,
  );
  const savedReports = useFitReports();
  const { stage, method, quiz, index } = draft;

  const patch = (next: Partial<FitDraft>) => fitDraft.set((current) => ({ ...current, ...next }));
  const setQuiz = (next: Partial<FitQuiz>) =>
    fitDraft.set((current) => ({ ...current, quiz: { ...current.quiz, ...next } }));

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // The photo lives only in memory on this page. It is never stored in the browser.
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [photoProblem, setPhotoProblem] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [photoNotice, setPhotoNotice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [stage, index]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const shapes = shapesByAudience[audience];
  // A shape given for the other audience is not carried over to this one.
  const shape: Shape = draft.shape && shapes.includes(draft.shape) ? draft.shape : "unsure";
  const check = useMemo(
    () => checkMeasurements(draft.measurements, draft.unit, audience),
    [draft.measurements, draft.unit, audience],
  );
  const suggestion = method === "measurements" ? suggestPattern(check.values, audience) : null;
  const photoAvailable = !(ai.state === "ready" && !ai.text);

  const source: ShapeSource =
    shape === "unsure"
      ? "none"
      : method === "measurements" && suggestion?.shape === shape
        ? "measurements"
        : method === "photo" && draft.photoShape === shape
          ? "photo"
          : "chosen";

  const report = useMemo(
    () =>
      buildReport({
        audience,
        shape,
        source,
        measurements:
          method === "measurements" && check.missing.length === 0 && Object.keys(check.errors).length === 0
            ? check.values
            : null,
        unit: draft.unit,
        sizes: method === "sizes" ? draft.sizes : {},
        quiz,
        photoObservations: method === "photo" ? draft.photoObservations : [],
      }),
    [audience, shape, source, method, check, draft.unit, draft.sizes, quiz, draft.photoObservations],
  );

  /* ----- photo ----- */

  async function choose(file: File | undefined) {
    if (!file) return;
    setPhotoProblem("");
    const invalid = validateFile(file);
    if (invalid) return setPhotoProblem(invalid);
    setPreparing(true);
    const prepared = await prepareImage(file);
    setPreparing(false);
    if (!prepared.ok) return setPhotoProblem(prepared.message);
    if (photo) releasePhoto(photo);
    setPhoto(prepared.blob);
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
    setPhotoProblem("");
  }

  /* ----- moving through the flow ----- */

  function go(next: FitStage, extra: Partial<FitDraft> = {}) {
    setErrors({});
    patch({ stage: next, ...extra });
  }

  function startOver() {
    removePhoto();
    fitDraft.clear();
    setErrors({});
    setPhotoNotice("");
    setSaveState("idle");
  }

  function unitChange(next: Unit) {
    if (next === draft.unit) return;
    const measurements = { ...draft.measurements };
    for (const key of Object.keys(measurements) as (keyof RawMeasurements)[]) {
      measurements[key] = convertText(measurements[key], draft.unit, next);
    }
    setErrors({});
    patch({ unit: next, measurements });
  }

  function continueMeasurements() {
    const failures: Record<string, string> = { ...check.errors };
    for (const key of check.missing) {
      const field = measureFields[audience].find((item) => item.key === key);
      failures[key] = `Please enter your ${field?.label.toLowerCase() ?? "measurement"}, or go back and choose another way.`;
    }
    if (Object.keys(failures).length > 0) return setErrors(failures);
    const pattern = suggestPattern(check.values, audience);
    go("quiz", { method: "measurements", shape: pattern.shape ?? "unsure", index: 0, audience });
  }

  function continueSizes() {
    const failures: Record<string, string> = {};
    for (const field of sizeFields[audience]) {
      const value = draft.sizes[field.key]?.trim();
      if (value && !SIZE_PATTERN.test(value)) {
        failures[field.key] = "Use up to 12 letters, numbers or / . - characters, for example M or 32.";
      }
    }
    if (Object.keys(failures).length > 0) return setErrors(failures);
    go("quiz", { method: "sizes", index: 0, audience });
  }

  function backFromQuiz() {
    if (index > 0) return patch({ index: index - 1 });
    const previous: Record<string, FitStage> = {
      known: "known",
      measurements: "measurements",
      sizes: "sizes",
      photo: "photo",
    };
    go(method ? (previous[method] ?? "intro") : "intro");
  }

  function answered(id: keyof FitQuiz): boolean {
    const value = quiz[id];
    return Array.isArray(value) ? value.length > 0 : value !== null;
  }

  function skipQuestion(id: keyof FitQuiz) {
    setQuiz({ [id]: id === "fitPref" ? null : [] } as Partial<FitQuiz>);
    next();
  }

  function next() {
    if (index < questions.length - 1) return patch({ index: index + 1 });
    void finish();
  }

  // The last question: look at the photo (only if one was chosen), then show results.
  async function finish() {
    if (method === "photo" && photo && photoAvailable) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setPhotoNotice(`${OFFLINE} Showing general guidance instead.`);
        return go("results");
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timer = setTimeout(() => controller.abort(), 60_000);
      setAnalysing(true);
      setPhotoNotice("");
      try {
        const response = await fetch("/api/fit-guidance/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: await blobToBase64(photo), audience }),
          signal: controller.signal,
        });
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message = (data as { error?: { message?: string } } | null)?.error?.message;
          setPhotoNotice(`${message ?? "We couldn’t use your photo."} Showing general guidance instead.`);
          return go("results", { photoShape: null, photoObservations: [] });
        }
        const parsed = photoAnalysisSchema.safeParse(data);
        if (!parsed.success) {
          setPhotoNotice("We couldn’t read the photo result. Showing general guidance instead.");
          return go("results", { photoShape: null, photoObservations: [] });
        }
        const found = parsed.data.shape;
        go("results", {
          photoShape: found,
          photoObservations: parsed.data.observations,
          shape: shapes.includes(found) ? found : "unsure",
          audience,
        });
      } catch {
        setPhotoNotice(
          `${controller.signal.aborted ? "That took too long." : "We couldn’t reach the photo service."} Showing general guidance instead.`,
        );
        go("results", { photoShape: null, photoObservations: [] });
      } finally {
        clearTimeout(timer);
        setAnalysing(false);
      }
      return;
    }
    go("results", { audience });
  }

  async function saveReport() {
    setSaveState("saving");
    const id = `fit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const ok = await fitReportsStore.save({ id, savedAt: Date.now(), report });
    setSaveState(ok ? "saved" : "error");
  }

  /* ----- shared bits ----- */

  const backButton = (to: FitStage) => (
    <button type="button" onClick={() => go(to)} className={secondaryButton}>
      Back
    </button>
  );

  const heading = (title: React.ReactNode, small = false) => (
    <h1
      ref={headingRef}
      tabIndex={-1}
      className={`font-display leading-[1.05] outline-none ${small ? "text-3xl md:text-4xl" : "text-4xl sm:text-5xl md:text-6xl"}`}
    >
      {title}
    </h1>
  );

  const inputs = (
    <>
      <input ref={cameraInput} type="file" accept={ACCEPT} capture="environment" onChange={onPick} tabIndex={-1} aria-hidden="true" className="sr-only" />
      <input ref={libraryInput} type="file" accept={ACCEPT} onChange={onPick} tabIndex={-1} aria-hidden="true" className="sr-only" />
    </>
  );

  const welcomeBack =
    restored && stage !== "intro" && stage !== "results" ? (
      <p role="status" className="mb-6 max-w-2xl border border-espresso/40 bg-soft-white p-4 text-sm leading-6">
        Welcome back. Your answers are kept in this browser for about a week. A photo can’t be kept,
        so add it again if you want to use one. You can start over any time.
      </p>
    ) : null;

  /* ---------- screens ---------- */

  // A: Introduction
  if (stage === "intro") {
    return (
      <div>
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">Fit Guidance</p>
          <div className="mt-3">{heading("Find Your Best Fit")}</div>
          <p className="mt-4 text-base leading-7 text-stone md:text-lg md:leading-8">
            Discover clothing cuts, proportions, and styles you may enjoy wearing. Share what you
            know about your body shape, or let us guide you through a few simple steps.
          </p>
          <p className="mt-3 text-sm leading-6 text-stone">
            Styling for <span className="font-medium text-espresso">{audienceLabels[audience]}</span>.
            You can change this in{" "}
            <Link href="/account/settings#styling-preferences" className="underline underline-offset-4">
              My Account
            </Link>
            . Nothing here is required, and you never have to share a photo or measurements.
          </p>
        </header>

        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          <li>
            <ChoiceCard
              icon={icons.known}
              title="I Know My Body Type"
              text="Pick the description that feels closest and get guidance straight away."
              onClick={() => go("known", { method: "known", shape: null, photoShape: null, photoObservations: [] })}
            />
          </li>
          <li>
            <ChoiceCard
              icon={icons.help}
              title="Help Me Find My Body Type"
              text="Use measurements, your usual sizes, or a full-body photo to get a tentative suggestion."
              onClick={() => go("method")}
            />
          </li>
          <li>
            <ChoiceCard
              icon={icons.tips}
              title="Explore Fit Tips Without Measurements"
              text="Skip the body-shape step and answer a few questions about how you like to dress."
              onClick={() => go("quiz", { method: "tips", shape: null, photoShape: null, photoObservations: [], index: 0 })}
            />
          </li>
        </ul>

        {savedReports.status === "ready" && savedReports.looks.length > 0 && (
          <p className="mt-8 text-sm text-stone">
            You have {savedReports.looks.length} saved fit guidance{" "}
            {savedReports.looks.length === 1 ? "report" : "reports"} on this device.{" "}
            <Link href="/saved#fit-guidance" className="underline underline-offset-4">
              View saved
            </Link>
          </p>
        )}
      </div>
    );
  }

  // B: I know my body type
  if (stage === "known") {
    return (
      <div className="mx-auto max-w-3xl">
        {welcomeBack}
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Step 1</p>
        <div className="mt-2">{heading("Which description feels closest?", true)}</div>
        <p className="mt-2 text-stone">
          These are optional style descriptors for talking about proportions in clothes, not medical
          categories. Nobody has to fit one, and “not sure” is a good answer.
        </p>
        <fieldset className="mt-6">
          <legend className="sr-only">Body-shape description</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {shapes.map((value) => (
              <OptionCard
                key={value}
                type="radio"
                name="shape"
                value={value}
                label={shapeLabels[audience][value]}
                hint={shapeHints[audience][value]}
                checked={shape === value && draft.shape !== null}
                onChange={() => patch({ shape: value, audience })}
              />
            ))}
          </div>
        </fieldset>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={draft.shape === null}
            onClick={() => go("quiz", { method: "known", index: 0, audience })}
            className={primaryButton}
          >
            Continue
          </button>
          {backButton("intro")}
        </div>
      </div>
    );
  }

  // C: Help me find it: choose a method
  if (stage === "method") {
    return (
      <div>
        {welcomeBack}
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">Step 1</p>
          <div className="mt-2">{heading("How would you like to find it?", true)}</div>
          <p className="mt-2 text-stone">
            Choose whichever you are comfortable with. All of them are optional, and none gives a
            definitive answer.
          </p>
        </header>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          <li>
            <ChoiceCard
              icon={icons.measurements}
              title="Measurements"
              text="Enter two to four measurements in centimetres or inches."
              onClick={() => go("measurements", { method: "measurements", shape: null, photoShape: null, photoObservations: [] })}
            />
          </li>
          <li>
            <ChoiceCard
              icon={icons.sizes}
              title="Existing clothing sizes"
              text="Tell us the sizes you usually wear. Used as supporting context only."
              onClick={() => go("sizes", { method: "sizes", shape: null, photoShape: null, photoObservations: [] })}
            />
          </li>
          <li>
            <ChoiceCard
              icon={icons.photo}
              title="Full-body photo"
              text="Optional. Get cautious, general observations about proportions."
              onClick={() => go("photo", { method: "photo", shape: null, photoShape: null, photoObservations: [] })}
            />
          </li>
        </ul>
        <div className="mt-8">{backButton("intro")}</div>
      </div>
    );
  }

  // C1: Measurements
  if (stage === "measurements") {
    return (
      <div className="mx-auto max-w-3xl">
        {welcomeBack}
        <p className="text-xs uppercase tracking-[0.22em] text-stone">{methodTitles.measurements}</p>
        <div className="mt-2">{heading("Your measurements", true)}</div>
        <p className="mt-2 text-stone">
          Share only what you are comfortable with. We ask for as few as we need. They give a
          tentative pattern for general clothing guidance, not a medical or scientific
          classification, and they stay in this browser.
        </p>

        <fieldset className="mt-6">
          <legend className="text-sm text-stone">Units</legend>
          <div role="radiogroup" aria-label="Units" className="mt-2 grid max-w-xs grid-cols-2 border border-sand">
            {unitValues.map((unit) => (
              <button
                key={unit}
                type="button"
                role="radio"
                aria-checked={draft.unit === unit}
                onClick={() => unitChange(unit)}
                className={`min-h-11 text-sm transition-colors duration-200 ${
                  draft.unit === unit ? "bg-espresso text-ivory" : "hover:bg-espresso/5"
                }`}
              >
                {unit === "cm" ? "Centimetres (cm)" : "Inches (in)"}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {measureFields[audience].map((field) => (
            <div key={field.key}>
              <label htmlFor={`measure-${field.key}`} className="text-sm font-medium">
                {field.label}
              </label>
              <p id={`measure-${field.key}-how`} className="mt-1 text-xs leading-5 text-stone">
                {field.how}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id={`measure-${field.key}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft.measurements[field.key]}
                  maxLength={8}
                  aria-describedby={`measure-${field.key}-how${errors[field.key] ? ` measure-${field.key}-error` : ""}`}
                  aria-invalid={errors[field.key] ? true : undefined}
                  onChange={(event) =>
                    patch({ measurements: { ...draft.measurements, [field.key]: event.target.value } })
                  }
                  className="min-h-11 w-full border border-sand bg-soft-white px-3 text-base"
                />
                <span className="text-sm text-stone">{draft.unit}</span>
              </div>
              {errors[field.key] && (
                <p id={`measure-${field.key}-error`} role="alert" className="mt-1 text-sm">
                  {errors[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-stone">
          Shoulder width is optional. We use it for jacket and shirt fit tips, not to work out your
          pattern.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={continueMeasurements} className={primaryButton}>
            Continue
          </button>
          {backButton("method")}
        </div>
      </div>
    );
  }

  // C2: Existing clothing sizes
  if (stage === "sizes") {
    return (
      <div className="mx-auto max-w-3xl">
        {welcomeBack}
        <p className="text-xs uppercase tracking-[0.22em] text-stone">{methodTitles.sizes}</p>
        <div className="mt-2">{heading("The sizes you usually wear", true)}</div>
        <p className="mt-2 text-stone">
          Sizes vary between brands and regions, so we use these only as supporting context. We do
          not work out measurements or a body type from a size. Fill in whichever you like.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {sizeFields[audience].map((field) => (
            <div key={field.key}>
              <label htmlFor={`size-${field.key}`} className="text-sm font-medium">
                {field.label}
              </label>
              <input
                id={`size-${field.key}`}
                type="text"
                list="size-suggestions"
                autoComplete="off"
                maxLength={12}
                value={draft.sizes[field.key] ?? ""}
                aria-invalid={errors[field.key] ? true : undefined}
                aria-describedby={errors[field.key] ? `size-${field.key}-error` : undefined}
                onChange={(event) => patch({ sizes: { ...draft.sizes, [field.key]: event.target.value } })}
                className="mt-2 min-h-11 w-full border border-sand bg-soft-white px-3 text-base"
              />
              {errors[field.key] && (
                <p id={`size-${field.key}-error`} role="alert" className="mt-1 text-sm">
                  {errors[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>
        <datalist id="size-suggestions">
          {sizeSuggestions.map((size) => (
            <option key={size} value={size} />
          ))}
        </datalist>

        <fieldset className="mt-8">
          <legend className="font-display text-2xl leading-8">Is there a description you relate to?</legend>
          <p className="mt-1 text-sm text-stone">Optional. Skip this if you are not sure.</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {shapes
              .filter((value) => value !== "unsure")
              .map((value) => (
                <OptionCard
                  key={value}
                  type="radio"
                  name="sizes-shape"
                  value={value}
                  label={shapeLabels[audience][value]}
                  hint={shapeHints[audience][value]}
                  checked={draft.shape === value}
                  onChange={() => patch({ shape: draft.shape === value ? null : value })}
                />
              ))}
          </div>
        </fieldset>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={continueSizes} className={primaryButton}>
            Continue
          </button>
          {backButton("method")}
        </div>
      </div>
    );
  }

  // C3: Full-body photo
  if (stage === "photo") {
    return (
      <div>
        {inputs}
        {welcomeBack}
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">{methodTitles.photo}</p>
          <div className="mt-2">{heading("Add a full-body photo", true)}</div>
          <p className="mt-2 text-stone">
            Optional. A photo can’t give reliable measurements, but it can support a few cautious,
            general observations about proportions.
          </p>
        </header>

        <section aria-label="Photo" className="mt-6 grid gap-6 md:grid-cols-12 md:items-start md:gap-10">
          <div className="md:col-span-5">
            <div
              className={`relative w-full overflow-hidden border ${
                photo ? "aspect-[3/4] max-h-[55dvh] border-sand bg-sand md:max-h-none" : "aspect-[3/2] border-dashed border-espresso/40 bg-soft-white md:aspect-[3/4]"
              }`}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl(photo)} alt="The photo you chose" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <p className="font-display text-xl leading-7">Take or choose a full-body photo</p>
                </div>
              )}
              {preparing && (
                <div role="status" className="absolute inset-0 flex items-end justify-center bg-espresso/30 p-4">
                  <p className="bg-ivory px-4 py-2 text-sm">Preparing your photo…</p>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              {photo ? (
                <>
                  <button type="button" disabled={preparing} onClick={() => cameraInput.current?.click()} className={`${secondaryButton} flex-1`}>
                    Retake
                  </button>
                  <button type="button" disabled={preparing} onClick={() => libraryInput.current?.click()} className={`${secondaryButton} flex-1`}>
                    Replace
                  </button>
                  <button type="button" onClick={removePhoto} className={`${secondaryButton} flex-1`}>
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <button type="button" disabled={preparing} onClick={() => cameraInput.current?.click()} className={`${primaryButton} flex-1`}>
                    Take a Photo
                  </button>
                  <button type="button" disabled={preparing} onClick={() => libraryInput.current?.click()} className={`${secondaryButton} flex-1`}>
                    Upload a Photo
                  </button>
                </>
              )}
            </div>
            <p className="mt-2 text-xs leading-5 text-stone">JPEG, PNG or WebP, up to 15 MB.</p>
            {photoProblem && (
              <p role="alert" className="mt-3 border border-espresso p-3 text-sm leading-6">
                {photoProblem}
              </p>
            )}
          </div>

          <div className="md:col-span-7">
            <h2 className="font-display text-2xl leading-8">For the best result</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-stone">
              <li>Stand in even, natural light.</li>
              <li>Use a simple background.</li>
              <li>Wear comfortable clothing that makes your general proportions visible.</li>
              <li>Keep the camera about level, with your whole body in the frame.</li>
              <li>Avoid filters and strong perspective distortion.</li>
            </ul>

            <div className="mt-5 border border-sand bg-soft-white p-4">
              <h2 className="font-display text-xl leading-7">How your photo is used</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-stone">
                <li>Choosing a photo does not upload it. It stays on your device.</li>
                <li>
                  {photoAvailable
                    ? "It is sent only when you finish the questions and press “See my fit guidance”: securely to our server and on to Google’s Gemini, to note general proportions."
                    : "Photo analysis isn’t available on this site right now, so a photo would not be sent anywhere. You can continue without one."}
                </li>
                <li>VEYORAQ doesn’t store or log it, and it is never saved in your browser or with your results.</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!photo || preparing}
                onClick={() => go("quiz", { method: "photo", index: 0, audience })}
                className={primaryButton}
              >
                Continue with this photo
              </button>
              <button type="button" onClick={() => go("quiz", { method: "photo", shape: null, index: 0, audience })} className={secondaryButton}>
                Continue without a photo
              </button>
              {backButton("method")}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // E: Results
  if (stage === "results") {
    return (
      <div className="space-y-12">
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">Your fit guidance</p>
          <div className="mt-3">
            {heading(shape === "unsure" ? "Cuts and fits to explore" : `${shapeLabels[audience][shape]} fit guidance`)}
          </div>
          <p className="mt-4 text-lg leading-8 text-stone">
            Suggestions for {audienceLabels[audience].toLowerCase()}&rsquo;s clothing, based on what you
            chose. Wear whatever you enjoy: this is a starting point.
          </p>
          {photoNotice && (
            <p role="status" className="mt-4 border border-espresso/40 bg-soft-white p-4 text-sm leading-6">
              {photoNotice}
            </p>
          )}
        </header>

        <section aria-labelledby="change-shape" className="max-w-3xl">
          <h2 id="change-shape" className="text-xs uppercase tracking-[0.18em] text-stone">
            Try another description
          </h2>
          <div role="radiogroup" aria-labelledby="change-shape" className="mt-2 flex flex-wrap gap-2">
            {shapes.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={shape === value}
                onClick={() => patch({ shape: value, audience })}
                className={`min-h-11 border px-4 text-sm transition-colors duration-200 ${
                  shape === value ? "border-espresso bg-espresso text-ivory" : "border-sand bg-soft-white hover:border-espresso/50"
                }`}
              >
                {shapeLabels[audience][value]}
              </button>
            ))}
          </div>
        </section>

        <FitReportView report={report} />

        <FitPersonalColours />

        <FitShop categories={quiz.categories as Category[]} />

        <section aria-label="Actions" className="border-t border-sand pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={saveState === "saving" || saveState === "saved"}
              onClick={() => void saveReport()}
              className={primaryButton}
            >
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Fit guidance saved" : "Save this fit guidance"}
            </button>
            <button type="button" onClick={() => go("quiz", { index: 0 })} className={secondaryButton}>
              Change my answers
            </button>
            <button type="button" onClick={startOver} className={secondaryButton}>
              Start over
            </button>
          </div>
          {saveState === "saved" && (
            <p role="status" className="mt-3 text-sm leading-6 text-stone">
              Saved on this device only. It is not saved to an account.{" "}
              <Link href="/saved#fit-guidance" className="underline underline-offset-4">
                View in Saved
              </Link>
            </p>
          )}
          {saveState === "error" && (
            <p role="alert" className="mt-3 text-sm leading-6">
              We couldn’t save this on your device. Your browser may be blocking storage.
            </p>
          )}
        </section>

        <FitJournal />
      </div>
    );
  }

  // D: The questions
  const question = questions[index] ?? questions[0];
  const progress = Math.round(((index + 1) / questions.length) * 100);
  const last = index === questions.length - 1;
  const cols = "grid-cols-1 sm:grid-cols-2";

  function renderQuestion() {
    switch (question.id) {
      case "fitPref":
        return (
          <fieldset className="mt-6">
            <legend className="sr-only">{question.title}</legend>
            <div className={`grid gap-3 ${cols}`}>
              {fitPrefValues.map((value) => (
                <OptionCard
                  key={value}
                  type="radio"
                  name="fitPref"
                  value={value}
                  label={fitPrefLabels[value]}
                  checked={quiz.fitPref === value}
                  onChange={() => setQuiz({ fitPref: quiz.fitPref === value ? null : value })}
                />
              ))}
            </div>
          </fieldset>
        );
      case "categories":
        return (
          <fieldset className="mt-6">
            <legend className="sr-only">{question.title}</legend>
            <div className={`grid gap-3 ${cols}`}>
              {categoriesByAudience[audience].map((value) => (
                <OptionCard
                  key={value}
                  type="checkbox"
                  name="categories"
                  value={value}
                  label={categoryLabels[audience][value]}
                  checked={quiz.categories.includes(value)}
                  onChange={() =>
                    setQuiz({
                      categories: quiz.categories.includes(value)
                        ? quiz.categories.filter((item) => item !== value)
                        : [...quiz.categories, value],
                    })
                  }
                />
              ))}
            </div>
          </fieldset>
        );
      case "occasions":
        return (
          <fieldset className="mt-6">
            <legend className="sr-only">{question.title}</legend>
            <div className={`grid gap-3 ${cols}`}>
              {occasionValues.map((value) => (
                <OptionCard
                  key={value}
                  type="checkbox"
                  name="occasions"
                  value={value}
                  label={occasionLabels[value]}
                  checked={quiz.occasions.includes(value)}
                  onChange={() =>
                    setQuiz({
                      occasions: quiz.occasions.includes(value)
                        ? quiz.occasions.filter((item) => item !== value)
                        : [...quiz.occasions, value],
                    })
                  }
                />
              ))}
            </div>
          </fieldset>
        );
      case "focus":
        return (
          <fieldset className="mt-6">
            <legend className="sr-only">{question.title}</legend>
            <div className={`grid gap-3 ${cols}`}>
              {focusValues.map((value) => (
                <OptionCard
                  key={value}
                  type="checkbox"
                  name="focus"
                  value={value}
                  label={focusLabels[value]}
                  checked={quiz.focus.includes(value)}
                  onChange={() =>
                    setQuiz({
                      focus: quiz.focus.includes(value)
                        ? quiz.focus.filter((item) => item !== value)
                        : [...quiz.focus, value],
                    })
                  }
                />
              ))}
            </div>
          </fieldset>
        );
      case "comfort":
        return (
          <fieldset className="mt-6">
            <legend className="sr-only">{question.title}</legend>
            <div className={`grid gap-3 ${cols}`}>
              {comfortValues.map((value) => (
                <OptionCard
                  key={value}
                  type="checkbox"
                  name="comfort"
                  value={value}
                  label={comfortLabels[value]}
                  checked={quiz.comfort.includes(value)}
                  onChange={() =>
                    setQuiz({
                      comfort: quiz.comfort.includes(value)
                        ? quiz.comfort.filter((item) => item !== value)
                        : [...quiz.comfort, value],
                    })
                  }
                />
              ))}
            </div>
          </fieldset>
        );
    }
  }

  return (
    <div>
      <div className="mx-auto max-w-3xl">
        {welcomeBack}
        <p className="flex items-center justify-between text-sm text-stone">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span>Optional</span>
        </p>
        <div
          role="progressbar"
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={index + 1}
          className="mt-2 h-1 w-full bg-sand"
        >
          <div className="h-full bg-espresso transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <button type="button" onClick={startOver} className="mt-1 inline-flex min-h-11 items-center text-sm text-stone underline underline-offset-4">
          Start over
        </button>

        {method === "photo" && !photo && (
          <p role="status" className="mt-2 border border-espresso/40 bg-soft-white p-3 text-sm leading-6">
            No photo is added, so we’ll use general guidance.{" "}
            <button type="button" onClick={() => go("photo")} className="underline underline-offset-4">
              Add a photo
            </button>
          </p>
        )}

        <div key={index} className="quiz-step mt-4">
          {heading(question.title, true)}
          <p className="mt-2 text-stone">{question.hint}</p>
          {renderQuestion()}
        </div>

        {analysing && (
          <p role="status" className="mt-4 border border-sand bg-soft-white p-4 text-sm leading-6">
            Looking at your photo… this can take up to a minute.
          </p>
        )}

        <QuizActions>
          <button type="button" onClick={backFromQuiz} disabled={analysing} className={secondaryButton}>
            Back
          </button>
          <button type="button" onClick={next} disabled={analysing} className={`${primaryButton} flex-1 md:flex-none`}>
            {analysing ? "Working…" : last ? "See my fit guidance" : "Continue"}
          </button>
          {!answered(question.id) && !analysing ? (
            <button type="button" onClick={() => skipQuestion(question.id)} className="inline-flex min-h-12 items-center px-2 text-sm underline underline-offset-4">
              Skip
            </button>
          ) : null}
        </QuizActions>
      </div>
    </div>
  );
}
