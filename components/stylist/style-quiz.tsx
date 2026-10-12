"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { QuizActions } from "@/components/quiz-actions";
import { OptionCard } from "@/components/stylist/option-card";
import { OutfitResults } from "@/components/stylist/outfit-results";
import { ShopYourStyle, type StylingGuidance } from "@/components/shop/shop-your-style";
import {
  budgetOptions,
  colourLabels,
  considerationLabels,
  considerationValues,
  fitLabels,
  fitValues,
  limits,
  occasionLabels,
  styleLabels,
} from "@/lib/stylist/options";
import {
  emptyDraft,
  firstMissingStep,
  isAnswered,
  stepProblem,
  steps,
  toggleLimited,
  toStylistInput,
  validateDraft,
  type QuizAnswers,
  type StepId,
} from "@/lib/stylist/quiz";
import { useAiStatus } from "@/lib/ai/use-ai-status";
import { audienceStore, type Audience } from "@/lib/audience";
import { useAudience } from "@/lib/use-audience";
import { createDraftStore } from "@/lib/persist/draft";
import { toSavedAnswers } from "@/lib/saved/saved-outfits";
import type { Outfit } from "@/lib/stylist/schema";

type View =
  | { kind: "quiz" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  // audience is who these outfits were created for, kept with them so a saved look
  // records it and so they are not shown after the audience is switched.
  | { kind: "results"; outfits: Outfit[]; styleDirection: string; audience: Audience };

const REQUEST_TIMEOUT_MS = 60_000;
const GENERIC_ERROR = "Something went wrong. Please try again.";
const REVIEW = steps.length; // the step index after the last question

// The person's answers and place in the quiz survive a refresh. Photos are not involved.
const quizDraft = createDraftStore({
  key: "veyoraq:draft:style-quiz",
  version: 1,
  initial: emptyDraft,
  validate: validateDraft,
});

const primaryButton =
  "inline-flex min-h-12 items-center justify-center bg-espresso px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ivory transition-colors duration-200 hover:bg-stone disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center border border-espresso/30 px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-espresso transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:cursor-not-allowed disabled:opacity-50";

// Colour-led looks: a soft tint behind each style, so cards never depend on photos.
const styleCards: { value: keyof typeof styleLabels; label: string; hint: string; tint: string }[] = [
  { value: "minimal", label: "Minimal and elegant", hint: "Clean lines, quiet colour", tint: "bg-[#f1ece4]" },
  { value: "relaxed", label: "Casual and comfortable", hint: "Easy pieces for every day", tint: "bg-[#ece8dc]" },
  { value: "trendy", label: "Modern and trendy", hint: "Current shapes and ideas", tint: "bg-[#e7e9ee]" },
  { value: "classic", label: "Classic and timeless", hint: "Pieces that never date", tint: "bg-[#efe6dc]" },
  { value: "streetwear", label: "Streetwear", hint: "Layered, loose, confident", tint: "bg-[#e4e4e2]" },
  { value: "boho", label: "Boho and relaxed", hint: "Soft textures, free spirit", tint: "bg-[#efe3d4]" },
  { value: "bold", label: "Bold and experimental", hint: "Colour, print, statement", tint: "bg-[#f0e2e0]" },
  { value: "indo-western", label: "Ethnic and fusion", hint: "Traditional with a twist", tint: "bg-[#f0e8d2]" },
];

const colourCards: { value: keyof typeof colourLabels; label: string; swatches: string[] }[] = [
  { value: "neutrals", label: "Neutrals", swatches: ["#f4efe6", "#d8cbb8", "#8b8178", "#3a3a3c"] },
  { value: "warm-tones", label: "Warm tones", swatches: ["#c8693f", "#d9a05b", "#a8472f", "#e7c27d"] },
  { value: "cool-tones", label: "Cool tones", swatches: ["#4b6b8a", "#7a9a9a", "#5b5f8f", "#a7bfd4"] },
  { value: "pastels", label: "Pastels", swatches: ["#f2d4dc", "#d6e4d8", "#d8d9f0", "#f6efc9"] },
  { value: "brights", label: "Bold colours", swatches: ["#d62f4a", "#1f7a5a", "#2a56c6", "#f2a900"] },
  { value: "mixed", label: "A mix of colours", swatches: ["#d8cbb8", "#c8693f", "#4b6b8a", "#f2d4dc"] },
];

const occasionCards: { value: keyof typeof occasionLabels; label: string }[] = [
  { value: "everyday", label: "Everyday" },
  { value: "college", label: "College or university" },
  { value: "work", label: "Office or work" },
  { value: "date-night", label: "Dates and dinners" },
  { value: "party", label: "Parties and events" },
  { value: "travel", label: "Travel" },
  { value: "wedding", label: "Weddings and celebrations" },
  { value: "special", label: "Special occasions" },
];

const questions: Record<StepId, { title: string; hint: string }> = {
  styles: { title: "What kind of looks feel most like you?", hint: `Pick up to ${limits.styles}. Mix them if you like.` },
  colours: { title: "Which colours do you enjoy wearing?", hint: `Pick up to ${limits.colours}, or skip.` },
  occasions: { title: "Where do you want these outfits to work?", hint: `Pick up to ${limits.occasions}.` },
  fit: { title: "What kind of fit feels comfortable to you?", hint: "Optional. There is no right answer." },
  budget: { title: "What budget feels comfortable for a new item?", hint: "Choosing one doesn’t mean you need to buy anything." },
  extras: { title: "Anything else your stylist should know?", hint: "Optional. Tap what applies, or tell us in your own words." },
};

function Swatches({ colours }: { colours: string[] }) {
  return (
    <span aria-hidden="true" className="mb-2 flex gap-1">
      {colours.map((colour) => (
        <span key={colour} className="h-6 w-6 border border-espresso/15" style={{ backgroundColor: colour }} />
      ))}
    </span>
  );
}

function summaryOf(step: StepId, answers: QuizAnswers): string {
  switch (step) {
    case "styles":
      return answers.styles.map((value) => styleCards.find((card) => card.value === value)?.label ?? styleLabels[value]).join(", ");
    case "colours":
      return answers.colours.length > 0
        ? answers.colours.map((value) => colourCards.find((card) => card.value === value)?.label ?? colourLabels[value]).join(", ")
        : "Skipped";
    case "occasions":
      return answers.occasions.map((value) => occasionCards.find((card) => card.value === value)?.label ?? occasionLabels[value]).join(", ");
    case "fit":
      return answers.fit ? fitLabels[answers.fit] : "Skipped";
    case "budget":
      return budgetOptions.find((option) => option.id === answers.budgetId)?.label ?? "Not chosen";
    case "extras": {
      const parts = [
        ...answers.considerations.map((value) => considerationLabels[value]),
        ...(answers.notes.trim() ? [`“${answers.notes.trim()}”`] : []),
      ];
      return parts.length > 0 ? parts.join(", ") : "Skipped";
    }
  }
}

const stepTitles: Record<StepId, string> = {
  styles: "Your looks",
  colours: "Colours",
  occasions: "Occasions",
  fit: "Fit",
  budget: "Budget",
  extras: "Anything else",
};

const RESULTS_UNAVAILABLE =
  "Personalised looks can't be created on this site right now, because the AI styling service isn't set up here. Your answers are safe: you can keep going through the quiz and change them.";

export function StyleQuiz() {
  const ai = useAiStatus();
  const resultsUnavailable = ai.state === "ready" && !ai.text;
  const imageGenerationConfigured = ai.state === "ready" && ai.images;
  const draft = useSyncExternalStore(
    quizDraft.subscribe,
    quizDraft.getSnapshot,
    quizDraft.getServerSnapshot,
  );
  const { answers, index } = draft;
  const setAnswers = (next: QuizAnswers | ((current: QuizAnswers) => QuizAnswers)) =>
    quizDraft.set((current) => ({
      ...current,
      answers: typeof next === "function" ? next(current.answers) : next,
    }));
  const setIndex = (next: number | ((current: number) => number)) =>
    quizDraft.set((current) => ({
      ...current,
      index: typeof next === "function" ? next(current.index) : next,
    }));
  const restored = useSyncExternalStore(
    () => () => {},
    () => quizDraft.wasRestored(),
    () => false,
  );
  const [dismissedRestore, setDismissedRestore] = useState(false);
  const [rawView, setView] = useState<View>({ kind: "quiz" });
  const audience = useAudience();
  // Results made for the other audience are not shown after the audience is switched
  // (the answers are kept, so asking again is one tap).
  const view: View =
    rawView.kind === "results" && rawView.audience !== audience ? { kind: "quiz" } : rawView;
  const [problem, setProblem] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Move focus to the new question or result so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (view.kind === "quiz") headingRef.current?.focus();
    else statusRef.current?.focus();
  }, [index, view.kind]);

  const set = (patch: Partial<QuizAnswers>) => {
    setProblem("");
    setAnswers((current) => ({ ...current, ...patch }));
  };

  const atReview = index === REVIEW;
  const current = steps[index];

  // Skipping clears this question's answer, so "skipped" always means "no answer".
  function skip() {
    if (current) {
      if (current.id === "colours") set({ colours: [] });
      if (current.id === "fit") set({ fit: null });
      if (current.id === "extras") set({ considerations: [], notes: "" });
    }
    setProblem("");
    setIndex((value) => Math.min(REVIEW, value + 1));
  }

  function next() {
    if (current) {
      const message = stepProblem(current.id, answers);
      if (message) return setProblem(message);
    }
    setProblem("");
    setIndex((value) => Math.min(REVIEW, value + 1));
  }

  async function generate() {
    const missing = firstMissingStep(answers);
    if (missing) {
      setIndex(steps.findIndex((step) => step.id === missing));
      return setProblem(stepProblem(missing, answers) ?? "");
    }
    const base = toStylistInput(answers);
    if (!base) return;
    // The "Styling for" choice is read at the moment of asking, so it is always current.
    const input = { ...base, audience: audienceStore.getSnapshot().audience };

    if (resultsUnavailable) {
      return setView({ kind: "error", message: RESULTS_UNAVAILABLE });
    }

    setView({ kind: "loading" });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return setView({ kind: "error", message: "You appear to be offline. Check your connection and try again." });
      }
      const response = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = (data as { error?: { message?: string } } | null)?.error?.message ?? GENERIC_ERROR;
        return setView({ kind: "error", message });
      }
      const body = data as { outfits?: Outfit[]; styleDirection?: string } | null;
      if (!Array.isArray(body?.outfits) || body.outfits.length === 0) {
        return setView({ kind: "error", message: GENERIC_ERROR });
      }
      setView({
        kind: "results",
        outfits: body.outfits,
        styleDirection: body.styleDirection ?? "",
        audience: input.audience,
      });
    } catch {
      setView({ kind: "error", message: "We couldn't reach the styling service. Check your connection and try again." });
    } finally {
      clearTimeout(timer);
    }
  }

  if (view.kind === "loading") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="max-w-xl py-10 outline-none">
        <p className="font-display text-3xl">Putting your looks together…</p>
        <p className="mt-3 text-stone">This usually takes a few seconds.</p>
      </div>
    );
  }

  if (view.kind === "error") {
    return (
      <div ref={statusRef} tabIndex={-1} className="max-w-xl py-10 outline-none">
        <p role="alert" className="font-display text-3xl">
          We couldn&rsquo;t create your looks.
        </p>
        <p className="mt-3 text-lg leading-8 text-stone">{view.message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={generate} className={primaryButton}>
            Try again
          </button>
          <button type="button" onClick={() => setView({ kind: "quiz" })} className={secondaryButton}>
            Back to my answers
          </button>
        </div>
      </div>
    );
  }

  if (view.kind === "results") {
    const guidance: StylingGuidance[] = [];
    const seen = new Set<string>();
    for (const outfit of view.outfits) {
      for (const piece of outfit.pieces) {
        const key = `${piece.category}-${piece.colour}`.toLowerCase();
        if (seen.has(key) || guidance.length >= 4) continue;
        seen.add(key);
        guidance.push({ label: `${piece.colour} ${piece.category}`, detail: piece.description });
      }
    }
    const input = toStylistInput(answers);
    return (
      <div ref={statusRef} tabIndex={-1} className="space-y-10 outline-none">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-stone">Your looks</p>
          <h2 className="mt-2 font-display text-4xl leading-tight">
            Here&rsquo;s what we&rsquo;d <em>suggest.</em>
          </h2>
          {view.styleDirection && <p className="mt-3 text-lg leading-8 text-stone">{view.styleDirection}</p>}
        </div>

        <OutfitResults
          outfits={view.outfits}
          answers={input ? toSavedAnswers({ ...input, audience: view.audience }) : null}
          imageGenerationConfigured={imageGenerationConfigured}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={generate} className={primaryButton}>
            Show me new ideas
          </button>
          <button
            type="button"
            onClick={() => {
              setView({ kind: "quiz" });
              setIndex(REVIEW);
            }}
            className={secondaryButton}
          >
            Adjust my answers
          </button>
        </div>

        <ShopYourStyle guidance={guidance} />
      </div>
    );
  }

  const progress = Math.round(((Math.min(index, steps.length - 1) + 1) / steps.length) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      {resultsUnavailable && (
        <p role="status" className="mb-6 border border-espresso/40 bg-soft-white p-4 text-sm leading-6">
          The quiz works, but personalised looks can&rsquo;t be created on this site right now
          because the AI styling service isn&rsquo;t set up here. You can still answer the
          questions.
        </p>
      )}
      {restored && !dismissedRestore && (index > 0 || answers.styles.length > 0) && (
        <p role="status" className="mb-6 flex flex-wrap items-center justify-between gap-2 border border-sand bg-soft-white p-4 text-sm leading-6">
          <span>Welcome back. We kept your answers so you can carry on.</span>
          <button
            type="button"
            onClick={() => setDismissedRestore(true)}
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            OK
          </button>
        </p>
      )}
      <div>
        <p className="flex items-center justify-between text-sm text-stone">
          <span>{atReview ? "Review your answers" : `Question ${index + 1} of ${steps.length}`}</span>
          {!atReview && current?.optional && <span>Optional</span>}
        </p>
        <div
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={atReview ? steps.length : index + 1}
          className="mt-2 h-1 w-full bg-sand"
        >
          <div className="h-full bg-espresso transition-[width] duration-300" style={{ width: `${atReview ? 100 : progress}%` }} />
        </div>
        {(index > 0 || answers.styles.length > 0 || answers.occasions.length > 0 || answers.budgetId !== null) && (
          <button
            type="button"
            onClick={() => {
              quizDraft.clear();
              setProblem("");
              setView({ kind: "quiz" });
            }}
            className="mt-1 inline-flex min-h-11 items-center text-sm text-stone underline underline-offset-4"
          >
            Start over
          </button>
        )}
      </div>

      <div key={index} className="quiz-step mt-6">
        {current && (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl leading-tight outline-none md:text-4xl">
              {questions[current.id].title}
            </h2>
            <p className="mt-2 text-stone">{questions[current.id].hint}</p>

            {current.id === "styles" && (
              <fieldset className="mt-6">
                <legend className="sr-only">Styles</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {styleCards.map((card) => {
                    const checked = answers.styles.includes(card.value);
                    return (
                      <OptionCard
                        key={card.value}
                        type="checkbox"
                        name="styles"
                        value={card.value}
                        label={card.label}
                        hint={card.hint}
                        tint={card.tint}
                        checked={checked}
                        disabled={!checked && answers.styles.length >= limits.styles}
                        onChange={() => set({ styles: toggleLimited(answers.styles, card.value, limits.styles) })}
                      />
                    );
                  })}
                </div>
              </fieldset>
            )}

            {current.id === "colours" && (
              <fieldset className="mt-6">
                <legend className="sr-only">Colours</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {colourCards.map((card) => {
                    const checked = answers.colours.includes(card.value);
                    return (
                      <OptionCard
                        key={card.value}
                        type="checkbox"
                        name="colours"
                        value={card.value}
                        label={card.label}
                        visual={<Swatches colours={card.swatches} />}
                        checked={checked}
                        disabled={!checked && answers.colours.length >= limits.colours}
                        onChange={() => set({ colours: toggleLimited(answers.colours, card.value, limits.colours) })}
                      />
                    );
                  })}
                </div>
              </fieldset>
            )}

            {current.id === "occasions" && (
              <fieldset className="mt-6">
                <legend className="sr-only">Occasions</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {occasionCards.map((card) => {
                    const checked = answers.occasions.includes(card.value);
                    return (
                      <OptionCard
                        key={card.value}
                        type="checkbox"
                        name="occasions"
                        value={card.value}
                        label={card.label}
                        checked={checked}
                        disabled={!checked && answers.occasions.length >= limits.occasions}
                        onChange={() => set({ occasions: toggleLimited(answers.occasions, card.value, limits.occasions) })}
                      />
                    );
                  })}
                </div>
              </fieldset>
            )}

            {current.id === "fit" && (
              <fieldset className="mt-6">
                <legend className="sr-only">Fit</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {fitValues.map((value) => (
                    <OptionCard
                      key={value}
                      type="radio"
                      name="fit"
                      value={value}
                      label={fitLabels[value]}
                      checked={answers.fit === value}
                      // Choosing the same card again clears it, since the question is optional.
                      onChange={() => set({ fit: answers.fit === value ? null : value })}
                    />
                  ))}
                </div>
              </fieldset>
            )}

            {current.id === "budget" && (
              <fieldset className="mt-6">
                <legend className="sr-only">Budget</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {budgetOptions.map((option) => (
                    <OptionCard
                      key={option.id}
                      type="radio"
                      name="budget"
                      value={option.id}
                      label={option.label}
                      hint={option.hint}
                      checked={answers.budgetId === option.id}
                      onChange={() => set({ budgetId: option.id })}
                    />
                  ))}
                </div>
              </fieldset>
            )}

            {current.id === "extras" && (
              <div className="mt-6 space-y-5">
                <fieldset>
                  <legend className="sr-only">Preferences</legend>
                  <div className="flex flex-wrap gap-2">
                    {considerationValues.map((value) => {
                      const checked = answers.considerations.includes(value);
                      return (
                        <label key={value} className="cursor-pointer has-[:disabled]:opacity-50">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={checked}
                            disabled={!checked && answers.considerations.length >= limits.considerations}
                            onChange={() =>
                              set({ considerations: toggleLimited(answers.considerations, value, limits.considerations) })
                            }
                          />
                          <span className="flex min-h-11 items-center border border-sand bg-soft-white px-4 text-sm transition-colors duration-200 hover:border-espresso/50 peer-checked:border-espresso peer-checked:bg-espresso peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso">
                            {considerationLabels[value]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="quiz-notes" className="text-sm text-stone">
                    In your own words (optional)
                  </label>
                  <textarea
                    id="quiz-notes"
                    rows={3}
                    maxLength={limits.notes}
                    value={answers.notes}
                    onChange={(event) => set({ notes: event.target.value })}
                    aria-describedby="quiz-notes-hint"
                    className="mt-1 block w-full border border-sand bg-soft-white p-3 text-base leading-7"
                  />
                  <p id="quiz-notes-hint" className="mt-1 text-xs leading-5 text-stone">
                    Please don&rsquo;t include personal details: this text may be reviewed by Google.{" "}
                    {answers.notes.length} / {limits.notes}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {atReview && (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl leading-tight outline-none md:text-4xl">
              Ready when you are.
            </h2>
            <p className="mt-2 text-stone">Check your answers. Tap Edit to change any of them.</p>
            <ul className="mt-6 divide-y divide-sand border-y border-sand">
              {steps.map((step, stepIndex) => (
                <li key={step.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-stone">{stepTitles[step.id]}</p>
                    <p className={`mt-1 [overflow-wrap:anywhere] ${isAnswered(step.id, answers) ? "" : "text-stone"}`}>
                      {summaryOf(step.id, answers)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProblem("");
                      setIndex(stepIndex);
                    }}
                    className="inline-flex min-h-11 shrink-0 items-center text-sm underline underline-offset-4"
                  >
                    Edit
                    <span className="sr-only"> {stepTitles[step.id]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {problem && (
        <p role="alert" className="mt-4 border border-espresso p-3 text-sm">
          {problem}
        </p>
      )}

      {/* Large controls near the thumb. On phones the bar sits just above the bottom navigation. */}
      <QuizActions>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => {
              setProblem("");
              setIndex((value) => Math.max(0, value - 1));
            }}
            className={secondaryButton}
          >
            Back
          </button>
          {atReview ? (
            <button type="button" onClick={generate} className={`${primaryButton} flex-1 md:flex-none`}>
              Discover My Looks
            </button>
          ) : (
            <>
              <button type="button" onClick={next} className={`${primaryButton} flex-1 md:flex-none`}>
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
  );
}
