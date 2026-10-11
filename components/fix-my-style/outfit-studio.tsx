"use client";

import { useState } from "react";
import {
  categoryLabels,
  colourLabels,
  colourValues,
  formalityLabels,
  formalityValues,
  limits,
  occasionLabels,
  occasionValues,
  seasonLabels,
  seasonValues,
  styleLabels,
  styleValues,
  type Formality,
  type GarmentColour,
  type Occasion,
  type Season,
  type StyleName,
} from "@/lib/fix-my-style/options";
import {
  outfitRequestSchema,
  type CleanOutfit,
  type CleanOutput,
  type OutfitRequest,
} from "@/lib/fix-my-style/schema";
import type { WardrobeState } from "@/lib/fix-my-style/store";
import { wardrobeStore } from "@/lib/fix-my-style/use-wardrobe";
import { outfitId, toSummary, type SavedOutfit, type WardrobeItem } from "@/lib/fix-my-style/wardrobe";
import { AdditionList, OutfitCard } from "./outfit-card";
import {
  Chip,
  fieldClass,
  GarmentPhoto,
  labelClass,
  Notice,
  primaryButton,
  secondaryButton,
  Sheet,
  textButton,
} from "./ui";

type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "done"; data: CleanOutput };

const OFFLINE =
  "You appear to be offline. Check your connection and try again. Your wardrobe is still safe on this device.";

export function OutfitStudio({
  wardrobe,
  selected,
  onSelectedChange,
  anchorId,
  onClearAnchor,
  onAdd,
}: {
  wardrobe: WardrobeState;
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  anchorId: string | null;
  onClearAnchor: () => void;
  onAdd: () => void;
}) {
  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [season, setSeason] = useState<Season | "">("");
  const [aesthetic, setAesthetic] = useState<StyleName | "">("");
  const [formality, setFormality] = useState<Formality | "">("");
  const [colours, setColours] = useState<GarmentColour[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [result, setResult] = useState<Result>({ state: "idle" });
  const [busyOutfit, setBusyOutfit] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<OutfitRequest | null>(null);

  const items = new Map(wardrobe.items.map((item) => [item.id, item]));
  const anchor = anchorId ? (items.get(anchorId) ?? null) : null;
  const chosen = selected.filter((id) => items.has(id));

  if (wardrobe.items.length === 0) {
    return (
      <div className="border border-sand bg-soft-white p-6 text-center sm:p-10">
        <p className="font-display text-3xl leading-tight">Add a few clothes first.</p>
        <p className="mx-auto mt-3 max-w-md leading-7 text-stone">
          Outfits are built from the pieces you own. Add at least one item to your wardrobe and
          we&rsquo;ll start from there. Nothing is invented for you.
        </p>
        <button type="button" onClick={onAdd} className={`${primaryButton} mt-6`}>
          Add clothes
        </button>
      </div>
    );
  }

  function buildRequest(): OutfitRequest {
    // Chosen items go first so they always make it into the request.
    const ordered = [
      ...wardrobe.items.filter((item) => chosen.includes(item.id) || item.id === anchor?.id),
      ...wardrobe.items.filter((item) => !chosen.includes(item.id) && item.id !== anchor?.id),
    ].slice(0, limits.itemsPerRequest);

    const must = chosen.filter((id) => id !== anchor?.id).slice(0, limits.mustInclude - 1);
    return {
      mode: anchor ? "item" : "outfits",
      anchorId: anchor ? anchor.id : null,
      items: ordered.map(toSummary),
      preferences: {
        occasion: occasion || null,
        season: season || null,
        aesthetic: aesthetic || null,
        formality: formality || null,
        colours,
        mustInclude: must,
      },
    };
  }

  async function run(request: OutfitRequest) {
    setLastRequest(request);
    const checked = outfitRequestSchema.safeParse(request);
    if (!checked.success) {
      return setResult({
        state: "error",
        message: "Something about those choices isn't valid. Please adjust them and try again.",
      });
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return setResult({ state: "error", message: OFFLINE });
    }

    setResult({ state: "loading" });
    try {
      const response = await fetch("/api/fix-my-style/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checked.data),
        signal: AbortSignal.timeout(60_000),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data as { error?: { message?: string } } | null)?.error?.message ??
          "We couldn't create outfit ideas just now. Please try again.";
        return setResult({ state: "error", message });
      }
      const output = data as CleanOutput | null;
      if (!output || !Array.isArray(output.outfits) || output.outfits.length === 0) {
        return setResult({
          state: "error",
          message: "We couldn't find a good combination. Try different choices.",
        });
      }
      setResult({ state: "done", data: output });
    } catch {
      setResult({
        state: "error",
        message: "We couldn't reach the styling service. Check your connection and try again.",
      });
    }
  }

  async function toggleSave(outfit: CleanOutfit) {
    const id = outfitId(outfit);
    setBusyOutfit(id);
    await wardrobeStore.toggleOutfit(outfit);
    setBusyOutfit(null);
  }

  const savedIds = new Set(wardrobe.outfits.map((outfit) => outfit.id));
  const data = result.state === "done" ? result.data : null;
  const owned = data?.outfits.filter((outfit) => outfit.kind === "owned") ?? [];
  const needs = data?.outfits.filter((outfit) => outfit.kind === "needs_additions") ?? [];

  const toggleColour = (value: GarmentColour) =>
    setColours((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : current.length >= 3
          ? current
          : [...current, value],
    );

  return (
    <div className="space-y-8">
      <section aria-label="Choose what to style" className="space-y-5">
        {anchor && (
          <div className="flex items-center gap-3 border border-espresso bg-soft-white p-3">
            <div className="h-16 w-12 shrink-0 overflow-hidden bg-sand">
              <GarmentPhoto blob={anchor.photo} alt="" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-stone">Styling this item</p>
              <p className="text-sm font-medium [overflow-wrap:anywhere]">{anchor.name}</p>
            </div>
            <button type="button" onClick={onClearAnchor} className={textButton}>
              Clear
            </button>
          </div>
        )}

        <div>
          <p className={labelClass}>Items to include</p>
          {chosen.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {chosen.map((id) => {
                const item = items.get(id)!;
                return (
                  <li key={id} className="h-16 w-12 overflow-hidden border border-espresso bg-sand">
                    <GarmentPhoto blob={item.photo} alt={item.name} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1 text-sm leading-6 text-stone">
              None chosen, so we&rsquo;ll use your whole wardrobe ({wardrobe.items.length} item
              {wardrobe.items.length === 1 ? "" : "s"}).
            </p>
          )}
          <button type="button" onClick={() => setPickerOpen(true)} className={`${secondaryButton} mt-3`}>
            {chosen.length > 0 ? "Change items" : "Choose items"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="studio-occasion" className={labelClass}>
              Occasion
            </label>
            <select
              id="studio-occasion"
              value={occasion}
              onChange={(event) => setOccasion(event.target.value as Occasion | "")}
              className={fieldClass}
            >
              <option value="">Any</option>
              {occasionValues.map((value) => (
                <option key={value} value={value}>
                  {occasionLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="studio-season" className={labelClass}>
              Season or weather
            </label>
            <select
              id="studio-season"
              value={season}
              onChange={(event) => setSeason(event.target.value as Season | "")}
              className={fieldClass}
            >
              <option value="">Any</option>
              {seasonValues.map((value) => (
                <option key={value} value={value}>
                  {seasonLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="studio-aesthetic" className={labelClass}>
              Aesthetic
            </label>
            <select
              id="studio-aesthetic"
              value={aesthetic}
              onChange={(event) => setAesthetic(event.target.value as StyleName | "")}
              className={fieldClass}
            >
              <option value="">Any</option>
              {styleValues.map((value) => (
                <option key={value} value={value}>
                  {styleLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="studio-formality" className={labelClass}>
              Formality
            </label>
            <select
              id="studio-formality"
              value={formality}
              onChange={(event) => setFormality(event.target.value as Formality | "")}
              className={fieldClass}
            >
              <option value="">Any</option>
              {formalityValues.map((value) => (
                <option key={value} value={value}>
                  {formalityLabels[value]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Colour preferences (up to 3, optional)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {colourValues.map((value) => {
              const checked = colours.includes(value);
              return (
                <Chip
                  key={value}
                  name="studio-colours"
                  value={value}
                  label={colourLabels[value]}
                  checked={checked}
                  disabled={!checked && colours.length >= 3}
                  onChange={() => toggleColour(value)}
                />
              );
            })}
          </div>
        </fieldset>

        <div>
          <button
            type="button"
            disabled={result.state === "loading"}
            onClick={() => void run(buildRequest())}
            className={`${primaryButton} w-full sm:w-auto`}
          >
            {result.state === "loading"
              ? "Creating…"
              : anchor
                ? "Style this item"
                : "Create my outfits"}
          </button>
          <p className="mt-2 text-sm leading-6 text-stone">
            Only written descriptions of your clothes are sent to create ideas, never your photos.
          </p>
        </div>
      </section>

      <section aria-label="Results" aria-live="polite">
        {result.state === "loading" && (
          <p role="status" className="border border-sand bg-soft-white p-5">
            <span className="font-display text-2xl">Putting outfits together…</span>
            <span className="mt-1 block text-sm text-stone">This usually takes a few seconds.</span>
          </p>
        )}

        {result.state === "error" && (
          <div className="space-y-3">
            <Notice tone="error">{result.message}</Notice>
            {lastRequest && (
              <button type="button" onClick={() => void run(lastRequest)} className={secondaryButton}>
                Try again
              </button>
            )}
          </div>
        )}

        {data && (
          <div className="space-y-8">
            {data.limitations && <Notice>{data.limitations}</Notice>}

            {owned.length > 0 && (
              <div>
                <h2 className="font-display text-3xl">From your wardrobe</h2>
                <p className="mt-1 text-sm text-stone">Outfits made only from pieces you own.</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {owned.map((outfit) => (
                    <OutfitCard
                      key={outfitId(outfit)}
                      outfit={outfit}
                      items={items}
                      saved={savedIds.has(outfitId(outfit))}
                      busy={busyOutfit === outfitId(outfit)}
                      onToggleSave={() => void toggleSave(outfit)}
                    />
                  ))}
                </div>
              </div>
            )}

            {needs.length > 0 && (
              <div>
                <h2 className="font-display text-3xl">With something new</h2>
                <p className="mt-1 text-sm text-stone">
                  These need a piece you don&rsquo;t have yet. They are ideas, not products for
                  sale.
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {needs.map((outfit) => (
                    <OutfitCard
                      key={outfitId(outfit)}
                      outfit={outfit}
                      items={items}
                      saved={savedIds.has(outfitId(outfit))}
                      busy={busyOutfit === outfitId(outfit)}
                      onToggleSave={() => void toggleSave(outfit)}
                    />
                  ))}
                </div>
              </div>
            )}

            {data.recommendations.length > 0 && (
              <div>
                <h2 className="font-display text-3xl">Complete your look</h2>
                <p className="mt-1 text-sm text-stone">
                  General ideas for pieces that would help. These aren&rsquo;t specific products and
                  there are no prices or links.
                </p>
                <div className="mt-4 max-w-2xl">
                  <AdditionList additions={data.recommendations} items={items} heading="Worth considering" />
                </div>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => lastRequest && void run(lastRequest)}
                className={secondaryButton}
              >
                Regenerate
              </button>
            </div>
          </div>
        )}
      </section>

      {wardrobe.outfits.length > 0 && (
        <section aria-labelledby="saved-outfits">
          <h2 id="saved-outfits" className="font-display text-3xl">
            Saved outfits
          </h2>
          <p className="mt-1 text-sm text-stone">Kept on this device.</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {wardrobe.outfits.map((outfit: SavedOutfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                items={items}
                saved
                busy={busyOutfit === outfit.id}
                onToggleSave={() => {
                  setBusyOutfit(outfit.id);
                  void wardrobeStore.removeOutfit(outfit.id).finally(() => setBusyOutfit(null));
                }}
              />
            ))}
          </div>
        </section>
      )}

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Choose items">
        <p className="text-sm leading-6 text-stone">
          Pick the pieces you want to wear. We&rsquo;ll build outfits around them and use the rest of
          your wardrobe to complete each look. Up to {limits.mustInclude} items.
        </p>
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {wardrobe.items.map((item: WardrobeItem) => {
            const checked = chosen.includes(item.id);
            const full = !checked && chosen.length >= limits.mustInclude;
            return (
              <li key={item.id}>
                <label
                  className={`block cursor-pointer ${full ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={full}
                    onChange={() =>
                      onSelectedChange(
                        checked ? chosen.filter((id) => id !== item.id) : [...chosen, item.id],
                      )
                    }
                    className="peer sr-only"
                  />
                  <span className="block aspect-[3/4] overflow-hidden border-2 border-transparent bg-sand peer-checked:border-espresso peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso">
                    <GarmentPhoto blob={item.photo} alt="" />
                  </span>
                  <span className="mt-1 block text-xs leading-4 [overflow-wrap:anywhere]">
                    {item.name}
                  </span>
                  <span className="block text-xs text-stone">{categoryLabels[item.category]}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => setPickerOpen(false)} className={primaryButton}>
            Done
          </button>
          <button type="button" onClick={() => onSelectedChange([])} className={secondaryButton}>
            Clear selection
          </button>
        </div>
      </Sheet>
    </div>
  );
}
