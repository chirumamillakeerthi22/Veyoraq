"use client";

import { useEffect, useRef, useState } from "react";
import { Choice } from "@/components/stylist/choice";
import { OutfitResults } from "@/components/stylist/outfit-results";
import {
  budgetTierLabels,
  budgetTierValues,
  colourLabels,
  colourValues,
  currencyValues,
  limits,
  occasionLabels,
  occasionValues,
  styleLabels,
  styleValues,
} from "@/lib/stylist/options";
import type { Outfit, StylistInput } from "@/lib/stylist/schema";

type Answers = {
  occasion: StylistInput["occasion"] | "";
  styles: StylistInput["styles"];
  colours: StylistInput["colours"];
  budgetTier: StylistInput["budgetTier"] | "";
  currency: StylistInput["currency"];
  notes: string;
};

type View =
  | { kind: "form" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "results"; outfits: Outfit[] };

const REQUEST_TIMEOUT_MS = 60_000;
const GENERIC_ERROR = "Something went wrong. Please try again.";

const initialAnswers: Answers = {
  occasion: "",
  styles: [],
  colours: [],
  budgetTier: "",
  currency: "INR",
  notes: "",
};

function findProblems(answers: Answers): string[] {
  const problems: string[] = [];
  if (!answers.occasion) problems.push("Choose an occasion.");
  if (answers.styles.length === 0) problems.push("Choose at least one style.");
  if (!answers.budgetTier) problems.push("Choose a budget.");
  return problems;
}

function toggle<T extends string>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter((item) => item !== value);
  return list.length >= max ? list : [...list, value];
}

const legendClass = "font-display text-2xl";
const hintClass = "mt-1 text-sm text-stone";
const buttonBase =
  "inline-flex min-h-12 items-center justify-center px-7 text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200";
const primaryButton = `${buttonBase} bg-espresso text-ivory hover:bg-stone disabled:cursor-not-allowed disabled:opacity-50`;
const secondaryButton = `${buttonBase} border border-espresso/30 text-espresso hover:border-espresso hover:bg-espresso/5`;

export function StylistFlow() {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [view, setView] = useState<View>({ kind: "form" });
  const [problems, setProblems] = useState<string[]>([]);
  const statusRef = useRef<HTMLDivElement>(null);
  const problemsRef = useRef<HTMLDivElement>(null);

  // Move focus to the new content so keyboard and screen-reader users notice the change.
  useEffect(() => {
    if (view.kind !== "form") statusRef.current?.focus();
  }, [view.kind]);

  useEffect(() => {
    if (problems.length > 0) problemsRef.current?.focus();
  }, [problems]);

  async function generate() {
    const found = findProblems(answers);
    setProblems(found);
    if (found.length > 0) return;

    setView({ kind: "loading" });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, notes: answers.notes.trim() }),
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data as { error?: { message?: string } } | null)?.error?.message ??
          GENERIC_ERROR;
        setView({ kind: "error", message });
        return;
      }

      const outfits = (data as { outfits?: Outfit[] } | null)?.outfits;
      if (!Array.isArray(outfits) || outfits.length === 0) {
        setView({ kind: "error", message: GENERIC_ERROR });
        return;
      }
      setView({ kind: "results", outfits });
    } catch {
      setView({
        kind: "error",
        message:
          "We couldn't reach the styling service. Check your connection and try again.",
      });
    } finally {
      clearTimeout(timer);
    }
  }

  if (view.kind === "loading") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="max-w-xl py-10 outline-none"
      >
        <p className="font-display text-3xl">Creating your outfit ideas…</p>
        <p className="mt-3 text-stone">This usually takes a few seconds.</p>
      </div>
    );
  }

  if (view.kind === "error") {
    return (
      <div ref={statusRef} tabIndex={-1} className="max-w-xl py-10 outline-none">
        <p role="alert" className="font-display text-3xl">
          We couldn&rsquo;t create your ideas.
        </p>
        <p className="mt-3 text-lg leading-8 text-stone">{view.message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={generate} className={primaryButton}>
            Try again
          </button>
          <button
            type="button"
            onClick={() => setView({ kind: "form" })}
            className={secondaryButton}
          >
            Change my answers
          </button>
        </div>
      </div>
    );
  }

  if (view.kind === "results") {
    return (
      <div>
        <div ref={statusRef} tabIndex={-1} className="max-w-2xl outline-none">
          <h2 className="font-display text-4xl leading-tight md:text-5xl">
            Your outfit ideas
          </h2>
          <p className="mt-3 leading-7 text-stone">
            These are style concepts, not products. We don&rsquo;t check
            prices, brands or availability yet, so there is nothing to buy
            here.
          </p>
        </div>
        <div className="mt-10">
          <OutfitResults outfits={view.outfits} />
        </div>
        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={generate} className={primaryButton}>
            Show me different ideas
          </button>
          <button
            type="button"
            onClick={() => setView({ kind: "form" })}
            className={secondaryButton}
          >
            Change my answers
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void generate();
      }}
      className="max-w-3xl space-y-12"
    >
      {problems.length > 0 && (
        <div
          ref={problemsRef}
          tabIndex={-1}
          role="alert"
          className="border border-espresso bg-soft-white p-4 outline-none"
        >
          <p className="font-medium">Please finish these before continuing:</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      <fieldset>
        <legend className={legendClass}>What are you dressing for?</legend>
        <p className={hintClass}>Choose one.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {occasionValues.map((value) => (
            <Choice
              key={value}
              type="radio"
              name="occasion"
              value={value}
              label={occasionLabels[value]}
              checked={answers.occasion === value}
              onChange={() => setAnswers({ ...answers, occasion: value })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Which styles feel like you?</legend>
        <p className={hintClass}>Choose up to {limits.styles}.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {styleValues.map((value) => {
            const checked = answers.styles.includes(value);
            return (
              <Choice
                key={value}
                type="checkbox"
                name="styles"
                value={value}
                label={styleLabels[value]}
                checked={checked}
                disabled={!checked && answers.styles.length >= limits.styles}
                onChange={() =>
                  setAnswers({
                    ...answers,
                    styles: toggle(answers.styles, value, limits.styles),
                  })
                }
              />
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>Any colours you love?</legend>
        <p className={hintClass}>
          Optional. Choose up to {limits.colours}.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {colourValues.map((value) => {
            const checked = answers.colours.includes(value);
            return (
              <Choice
                key={value}
                type="checkbox"
                name="colours"
                value={value}
                label={colourLabels[value]}
                checked={checked}
                disabled={!checked && answers.colours.length >= limits.colours}
                onChange={() =>
                  setAnswers({
                    ...answers,
                    colours: toggle(answers.colours, value, limits.colours),
                  })
                }
              />
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>What&rsquo;s your budget?</legend>
        <p className={hintClass}>
          This guides how simple or elevated the pieces are. We don&rsquo;t
          check real prices yet.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {budgetTierValues.map((value) => (
            <Choice
              key={value}
              type="radio"
              name="budgetTier"
              value={value}
              label={budgetTierLabels[value].label}
              hint={budgetTierLabels[value].hint}
              checked={answers.budgetTier === value}
              onChange={() => setAnswers({ ...answers, budgetTier: value })}
            />
          ))}
        </div>
        <div className="mt-5">
          <label htmlFor="currency" className="text-sm text-stone">
            Currency
          </label>
          <select
            id="currency"
            value={answers.currency}
            onChange={(event) =>
              setAnswers({
                ...answers,
                currency: event.target.value as Answers["currency"],
              })
            }
            className="mt-1 block min-h-12 w-full border border-sand bg-soft-white px-3 text-sm sm:w-48"
          >
            {currencyValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <div>
        <label htmlFor="notes" className={legendClass}>
          Anything else we should know?
        </label>
        <p id="notes-hint" className={hintClass}>
          Optional. For example fabrics you prefer, or things you&rsquo;d rather
          avoid.
        </p>
        <textarea
          id="notes"
          rows={4}
          maxLength={limits.notes}
          value={answers.notes}
          onChange={(event) =>
            setAnswers({ ...answers, notes: event.target.value })
          }
          aria-describedby="notes-hint notes-count"
          className="mt-4 block w-full border border-sand bg-soft-white p-3 text-base leading-7"
        />
        <p id="notes-count" className="mt-1 text-right text-xs text-stone">
          {answers.notes.length} / {limits.notes}
        </p>
      </div>

      <button type="submit" className={`${primaryButton} w-full sm:w-auto`}>
        Create my outfit ideas
      </button>
    </form>
  );
}
