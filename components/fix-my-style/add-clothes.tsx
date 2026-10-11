"use client";

import { useRef, useState } from "react";
import {
  blobToBase64,
  prepareImage,
  validateFile,
  type CropRect,
} from "@/lib/fix-my-style/image";
import { limits } from "@/lib/fix-my-style/options";
import { garmentAnalysisSchema } from "@/lib/fix-my-style/schema";
import { useWardrobe, wardrobeStore } from "@/lib/fix-my-style/use-wardrobe";
import { newItemId, type WardrobeItem } from "@/lib/fix-my-style/wardrobe";
import { CropSheet } from "./crop-sheet";
import {
  emptyFields,
  GarmentForm,
  validateFields,
  type GarmentFields,
} from "./garment-form";
import {
  GarmentPhoto,
  Notice,
  primaryButton,
  releasePhoto,
  secondaryButton,
  textButton,
} from "./ui";

type Analysis =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "done"; note: string }
  | { state: "error"; message: string };

type Draft = {
  id: string;
  blob: Blob;
  fields: GarmentFields;
  suggestedByAi: boolean;
  analysis: Analysis;
};

const ACCEPT = "image/jpeg,image/png,image/webp";
const OFFLINE =
  "You appear to be offline. Check your connection and try again. You can still fill in the details yourself.";

export function AddClothes({ onOpenWardrobe }: { onOpenWardrobe: () => void }) {
  useWardrobe();
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const queue = useRef<File[]>([]);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [waiting, setWaiting] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function loadNext() {
    const file = queue.current.shift();
    setWaiting(queue.current.length);
    if (!file) return;

    setPreparing(true);
    const prepared = await prepareImage(file);
    setPreparing(false);

    if (!prepared.ok) {
      setProblems((current) => [...current, `${file.name || "A photo"}: ${prepared.message}`]);
      await loadNext();
      return;
    }
    setDraft({
      id: newItemId(),
      blob: prepared.blob,
      fields: emptyFields,
      suggestedByAi: false,
      analysis: { state: "idle" },
    });
  }

  function acceptFiles(files: File[]) {
    setAdded(null);
    const messages: string[] = [];
    const usable: File[] = [];
    for (const file of files) {
      const problem = validateFile(file);
      if (problem) messages.push(`${file.name || "A photo"}: ${problem}`);
      else usable.push(file);
    }
    setProblems(messages);
    if (usable.length === 0) return;
    queue.current.push(...usable);
    setWaiting(queue.current.length);
    if (!draft && !preparing) void loadNext();
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) acceptFiles(files);
  }

  async function onReplace(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !draft) return;
    const problem = validateFile(file);
    if (problem) return setProblems([`${file.name || "A photo"}: ${problem}`]);
    setProblems([]);
    setPreparing(true);
    const prepared = await prepareImage(file);
    setPreparing(false);
    if (!prepared.ok) return setProblems([prepared.message]);
    const previous = draft.blob;
    setDraft({ ...draft, blob: prepared.blob, suggestedByAi: false, analysis: { state: "idle" } });
    releasePhoto(previous);
  }

  async function onCrop(rect: CropRect) {
    if (!draft) return;
    setCropping(true);
    const prepared = await prepareImage(draft.blob, rect);
    setCropping(false);
    if (!prepared.ok) return setProblems([prepared.message]);
    const previous = draft.blob;
    setProblems([]);
    setDraft({ ...draft, blob: prepared.blob, analysis: { state: "idle" } });
    setCropOpen(false);
    releasePhoto(previous);
  }

  function discard() {
    if (draft) releasePhoto(draft.blob);
    setDraft(null);
    setFormError("");
    void loadNext();
  }

  async function suggest() {
    if (!draft) return;
    const current = draft;
    setDraft({ ...current, analysis: { state: "loading" } });

    const fail = (message: string) =>
      setDraft((latest) =>
        latest && latest.id === current.id
          ? { ...latest, analysis: { state: "error", message } }
          : latest,
      );

    if (typeof navigator !== "undefined" && navigator.onLine === false) return fail(OFFLINE);

    try {
      const response = await fetch("/api/fix-my-style/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: await blobToBase64(current.blob) }),
        signal: AbortSignal.timeout(45_000),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data as { error?: { message?: string } } | null)?.error?.message ??
          "We couldn't read that photo. You can fill in the details yourself.";
        return fail(message);
      }
      const parsed = garmentAnalysisSchema.safeParse(data);
      if (!parsed.success) {
        return fail("We couldn't read that photo. You can fill in the details yourself.");
      }
      const suggestion = parsed.data;
      setDraft((latest) =>
        latest && latest.id === current.id
          ? {
              ...latest,
              suggestedByAi: true,
              fields: {
                // Anything already typed is kept; the suggestion fills the rest.
                name: latest.fields.name.trim() ? latest.fields.name : suggestion.name,
                category: suggestion.category,
                colours: suggestion.colours,
                pattern: suggestion.pattern,
                material: suggestion.material,
                style: suggestion.style,
                seasons: suggestion.seasons,
                occasions: suggestion.occasions,
              },
              analysis: { state: "done", note: suggestion.note },
            }
          : latest,
      );
    } catch {
      fail("We couldn't reach the suggestion service. Check your connection and try again.");
    }
  }

  async function save() {
    if (!draft || saving) return;
    const problem = validateFields(draft.fields);
    if (problem) return setFormError(problem);
    setFormError("");
    setSaving(true);

    const now = Date.now();
    const { fields } = draft;
    const item: WardrobeItem = {
      id: draft.id,
      name: fields.name.trim().slice(0, limits.nameLength),
      category: fields.category as WardrobeItem["category"],
      colours: fields.colours,
      pattern: fields.pattern || null,
      material: fields.material || null,
      style: fields.style || null,
      seasons: fields.seasons,
      occasions: fields.occasions,
      photo: draft.blob,
      suggestedByAi: draft.suggestedByAi,
      createdAt: now,
      updatedAt: now,
    };

    const ok = await wardrobeStore.saveItem(item);
    setSaving(false);
    if (!ok) {
      setFormError(
        "We couldn't save this item on your device. Your browser may be out of space or blocking storage. Try again.",
      );
      return;
    }
    setAdded(item.name);
    setDraft(null);
    void loadNext();
  }

  const busy = preparing || saving;

  return (
    <div className="space-y-6">
      {/* The three inputs are hidden; the buttons below open them. Nothing is
          requested from the device until a button is pressed. */}
      <input
        ref={cameraInput}
        type="file"
        accept={ACCEPT}
        capture="environment"
        onChange={onPick}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <input
        ref={libraryInput}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={onPick}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <input
        ref={replaceInput}
        type="file"
        accept={ACCEPT}
        onChange={onReplace}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      {added && (
        <div className="border border-sand bg-soft-white p-4" role="status">
          <p className="font-display text-2xl">Added to your wardrobe.</p>
          <p className="mt-1 text-sm leading-6 text-stone">&ldquo;{added}&rdquo; is saved on this device.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onOpenWardrobe} className={secondaryButton}>
              View my wardrobe
            </button>
          </div>
        </div>
      )}

      {!draft && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            acceptFiles(Array.from(event.dataTransfer.files));
          }}
          className={`border border-dashed p-5 sm:p-8 ${
            dragging ? "border-espresso bg-sand/60" : "border-espresso/30 bg-soft-white"
          }`}
        >
          <h2 className="font-display text-3xl leading-tight">Add a piece you own.</h2>
          <p className="mt-2 max-w-xl leading-7 text-stone">
            Photograph one item at a time on a plain background for the best result. The photo is
            kept on this device. Nothing is uploaded until you ask for suggestions.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => cameraInput.current?.click()}
              className={`${primaryButton} w-full sm:w-auto`}
            >
              Take photo
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => libraryInput.current?.click()}
              className={`${secondaryButton} w-full sm:w-auto`}
            >
              Upload photos
            </button>
          </div>
          <p className="mt-3 hidden text-sm text-stone md:block">Or drag photos here.</p>
          <p className="mt-3 text-sm leading-6 text-stone">
            JPEG, PNG or WebP, up to 15 MB each. If your device doesn&rsquo;t open the camera,
            choose Upload photos and pick one you&rsquo;ve taken.
          </p>
          {preparing && (
            <p role="status" className="mt-4 text-sm text-stone">
              Preparing your photo…
            </p>
          )}
        </div>
      )}

      {problems.length > 0 && (
        <Notice tone="error">
          {problems.map((message) => (
            <span key={message} className="block">
              {message}
            </span>
          ))}
        </Notice>
      )}

      {draft && (
        <section aria-label="New item" className="grid gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="aspect-[3/4] max-h-[60dvh] w-full overflow-hidden border border-sand bg-sand lg:max-h-none">
              <GarmentPhoto blob={draft.blob} alt="The photo you chose, before saving" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setCropOpen(true)} className={secondaryButton}>
                Select one item
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => replaceInput.current?.click()}
                className={secondaryButton}
              >
                Replace photo
              </button>
              <button type="button" onClick={discard} className={textButton}>
                Remove
              </button>
            </div>
            {waiting > 0 && (
              <p className="mt-3 text-sm text-stone">
                {waiting} more photo{waiting === 1 ? "" : "s"} waiting. You&rsquo;ll add them one at
                a time.
              </p>
            )}
          </div>

          <div className="lg:col-span-7">
            <div className="border border-sand bg-soft-white p-4">
              <p className="font-display text-xl">Let AI suggest the details?</p>
              <p className="mt-1 text-sm leading-6 text-stone">
                This sends the photo to Google&rsquo;s Gemini to suggest a name, colours and more. It
                isn&rsquo;t stored by VEYORAQ. Suggestions can be wrong, so please check them. You
                can skip this and fill things in yourself.
              </p>
              <button
                type="button"
                disabled={draft.analysis.state === "loading" || busy}
                onClick={suggest}
                className={`${secondaryButton} mt-3 w-full sm:w-auto`}
              >
                {draft.analysis.state === "loading"
                  ? "Looking at your photo…"
                  : draft.analysis.state === "error"
                    ? "Try again"
                    : draft.analysis.state === "done"
                      ? "Suggest again"
                      : "Suggest details"}
              </button>
              {draft.analysis.state === "loading" && (
                <p role="status" className="mt-3 text-sm text-stone">
                  This usually takes a few seconds.
                </p>
              )}
              {draft.analysis.state === "error" && (
                <p role="alert" className="mt-3 text-sm leading-6">
                  {draft.analysis.message}
                </p>
              )}
              {draft.analysis.state === "done" && (
                <p role="status" className="mt-3 text-sm leading-6 text-stone">
                  Suggested by AI. Please check and correct anything that looks wrong.
                  {draft.analysis.note ? ` Note: ${draft.analysis.note}` : ""}
                </p>
              )}
            </div>

            <div className="mt-6">
              <GarmentForm
                fields={draft.fields}
                disabled={saving}
                onChange={(fields) => setDraft({ ...draft, fields })}
              />
            </div>

            {formError && (
              <p role="alert" className="mt-4 text-sm leading-6">
                {formError}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className={`${primaryButton} w-full sm:w-auto`}
              >
                {saving ? "Saving…" : "Save to my wardrobe"}
              </button>
              <button type="button" disabled={saving} onClick={discard} className={`${secondaryButton} w-full sm:w-auto`}>
                Discard
              </button>
            </div>
          </div>

          <CropSheet
            blob={draft.blob}
            open={cropOpen}
            busy={cropping}
            onApply={onCrop}
            onClose={() => setCropOpen(false)}
          />
        </section>
      )}
    </div>
  );
}
