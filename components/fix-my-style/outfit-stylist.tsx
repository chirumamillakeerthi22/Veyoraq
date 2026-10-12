"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createDraftStore } from "@/lib/persist/draft";
import { blobToBase64, prepareImage, validateFile } from "@/lib/fix-my-style/image";
import { useAiStatus } from "@/lib/ai/use-ai-status";
import { looksStore, useLooks } from "@/lib/fix-my-style/use-looks";
import {
  outfitAnalysisSchema,
  type OutfitAnalysis,
  type StyleEvent,
  type StyledImage,
} from "@/lib/fix-my-style/schema";
import {
  Advice,
  Comparison,
  StylingProgress,
  photoUrl,
  primaryButton,
  releasePhoto,
  secondaryButton,
  type ImageState,
} from "./styled-result";

type Run =
  | { phase: "idle" }
  | { phase: "analysing" }
  | { phase: "error"; message: string; retryable: boolean }
  | { phase: "result"; analysis: OutfitAnalysis; image: ImageState };

/*
  What survives a refresh. The photo itself cannot be kept (it must not go into
  localStorage), so only the stage and the written advice are remembered, and the
  page asks for the photo again.
*/
type FixDraft = { stage: "empty" | "photo" | "result"; analysis: OutfitAnalysis | null };
const emptyFixDraft: FixDraft = { stage: "empty", analysis: null };

const fixDraft = createDraftStore<FixDraft>({
  key: "veyoraq:draft:fix-my-style",
  version: 1,
  initial: emptyFixDraft,
  validate: (data) => {
    if (!data || typeof data !== "object") return null;
    const raw = data as { stage?: unknown; analysis?: unknown };
    if (raw.stage === "empty") return emptyFixDraft;
    if (raw.stage === "photo") return { stage: "photo", analysis: null };
    if (raw.stage === "result") {
      const parsed = outfitAnalysisSchema.safeParse(raw.analysis);
      return parsed.success && parsed.data.isOutfit ? { stage: "result", analysis: parsed.data } : null;
    }
    return null;
  },
});

const ACCEPT = "image/jpeg,image/png,image/webp";
const OFFLINE = "You appear to be offline. Check your connection and try again.";

async function blobFromBase64(mimeType: string, data: string): Promise<Blob> {
  return (await fetch(`data:${mimeType};base64,${data}`)).blob();
}

function describeImage(image: StyledImage): ImageState | Promise<ImageState> {
  if (image.status === "generated") {
    return blobFromBase64(image.mimeType, image.data).then((blob) => ({ state: "ready", blob }));
  }
  return { state: "unavailable", kind: image.status, message: image.message };
}

export function OutfitStylist() {
  const looks = useLooks();
  const ai = useAiStatus();
  const draft = useSyncExternalStore(
    fixDraft.subscribe,
    fixDraft.getSnapshot,
    fixDraft.getServerSnapshot,
  );
  // Known only after the site has been asked. "unknown" still lets the person try.
  const stylingUnavailable = ai.state === "ready" && !ai.text;
  const imagesOff = ai.state === "ready" && ai.text && !ai.images;
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [problem, setProblem] = useState("");
  const [dragging, setDragging] = useState(false);
  const [run, setRun] = useState<Run>({ phase: "idle" });
  const [saveState, setSaveState] = useState<
    { state: "idle" } | { state: "saving" } | { state: "saved"; id: string } | { state: "error"; message: string }
  >({ state: "idle" });
  const [openLook, setOpenLook] = useState<{ original: Blob; analysis: OutfitAnalysis; image: ImageState } | null>(
    null,
  );

  // Stop a request that is still running if the page is closed.
  useEffect(() => () => abortRef.current?.abort(), []);

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
    setOpenLook(null);
    setSaveState({ state: "idle" });
    fixDraft.set({ stage: "photo", analysis: null });
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
    setProblem("");
    setRun({ phase: "idle" });
    setSaveState({ state: "idle" });
    fixDraft.clear(); // Start Over, Remove Photo and Try Another Style all land here
  }

  async function styleOutfit(source: Blob | null = photo) {
    if (!source || run.phase === "analysing") return;
    setProblem("");
    setSaveState({ state: "idle" });
    setOpenLook(null);

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return setRun({ phase: "error", message: OFFLINE, retryable: true });
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort(), 100_000);
    setRun({ phase: "analysing" });

    let analysis: OutfitAnalysis | null = null;
    try {
      const response = await fetch("/api/fix-my-style/style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: await blobToBase64(source) }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        return setRun({
          phase: "error",
          message: data?.error?.message ?? "We couldn't style that photo just now. Please try again.",
          retryable: response.status !== 400 && response.status !== 413 && response.status !== 415,
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const handle = async (line: string) => {
        if (!line.trim()) return;
        let event: StyleEvent;
        try {
          event = JSON.parse(line) as StyleEvent;
        } catch {
          return;
        }
        if (event.type === "analysis") {
          const parsed = outfitAnalysisSchema.safeParse(event.data);
          if (!parsed.success) return;
          analysis = parsed.data;
          if (!parsed.data.isOutfit) {
            setRun({
              phase: "error",
              message: "We couldn't see an outfit to style in that photo. Try a clearer photo of the clothes.",
              retryable: false,
            });
            return;
          }
          setRun({ phase: "result", analysis: parsed.data, image: { state: "pending" } });
          fixDraft.set({ stage: "result", analysis: parsed.data });
        } else if (event.type === "image" && analysis?.isOutfit) {
          const image = await describeImage(event.data);
          setRun({ phase: "result", analysis, image });
        } else if (event.type === "error") {
          setRun({ phase: "error", message: event.message, retryable: true });
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

      setRun((current) =>
        current.phase === "analysing"
          ? { phase: "error", message: "We didn't get a result. Please try again.", retryable: true }
          : current,
      );
    } catch (error) {
      if (controller.signal.aborted && abortRef.current !== controller) return;
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      setRun({
        phase: "error",
        message: timedOut
          ? "That took too long. Please try again."
          : "We couldn't reach the styling service. Check your connection and try again.",
        retryable: true,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function saveLook(look: { original: Blob; analysis: OutfitAnalysis; image: ImageState }) {
    setSaveState({ state: "saving" });
    const id = `look-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const ok = await looksStore.save({
      id,
      savedAt: Date.now(),
      original: look.original,
      styled: look.image.state === "ready" ? look.image.blob : null,
      assessment: look.analysis.assessment,
      improvements: look.analysis.improvements,
      items: look.analysis.items.map((item) => ({ name: item.name, category: item.category })),
      additions: look.analysis.additions.map(({ name, why, tip }) => ({ name, why, tip })),
    });
    setSaveState(
      ok
        ? { state: "saved", id }
        : {
            state: "error",
            message: "We couldn't save this look on your device. Your browser may be blocking storage or be out of space.",
          },
    );
  }

  const busy = run.phase === "analysing" || preparing;
  const canStyle = !busy && !stylingUnavailable;
  const showing =
    openLook ?? (run.phase === "result" && photo ? { original: photo, analysis: run.analysis, image: run.image } : null);

  return (
    <div>
      <input ref={cameraInput} type="file" accept={ACCEPT} capture="environment" onChange={onPick} tabIndex={-1} aria-hidden="true" className="sr-only" />
      <input ref={libraryInput} type="file" accept={ACCEPT} onChange={onPick} tabIndex={-1} aria-hidden="true" className="sr-only" />

      <header className="max-w-2xl">
        <h1 className="font-display text-4xl uppercase leading-[1.05] tracking-[0.06em] sm:text-5xl md:text-6xl">Fix My Style</h1>
        <p className="mt-3 text-base leading-7 text-stone md:mt-4 md:text-lg md:leading-8">
          Your clothes, a fresh perspective. Discover better combinations and new ways to wear what
          you already own.
        </p>
      </header>

      <section aria-label="Your photo" className="mt-5 grid md:mt-8 gap-6 md:grid-cols-12 md:items-start md:gap-10">
        <div className="md:col-span-6 lg:col-span-5">
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
              photo ? "aspect-[4/5] max-h-[62dvh]" : "aspect-[3/2] md:aspect-[4/5]"
            } ${
              photo ? "border-sand bg-sand" : dragging ? "border-dashed border-espresso bg-sand/60" : "border-dashed border-espresso/40 bg-soft-white"
            }`}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl(photo)} alt="The photo you chose" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-12 w-12 text-gold" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                  <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9a1.500 1.500 0 0 1-1.500 1.500h-13A1.500 1.500 0 0 1 4 17.500z" />
                </svg>
                <p className="font-display text-2xl leading-7">Add a photo of your outfit</p>
                <p className="max-w-xs text-sm leading-6 text-stone">
                  Upload a photo of your outfit or the clothes you want to style.
                </p>
              </div>
            )}
            {(preparing || run.phase === "analysing") && photo && (
              <div role="status" className="absolute inset-0 flex items-end justify-center bg-espresso/30 p-4">
                <p className="bg-ivory px-4 py-2 text-sm">
                  {preparing ? "Preparing your photo…" : "Looking at your outfit…"}
                </p>
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
          {!photo && (
            <p className="mt-3 text-sm leading-6 text-stone">
              JPEG, PNG or WebP, up to 15 MB. If your device doesn&rsquo;t open the camera, choose
              Upload Photo and pick one you&rsquo;ve taken. Your photo is only sent when you press
              Style This Outfit.
            </p>
          )}
          {problem && (
            <p role="alert" className="mt-3 border border-espresso p-3 text-sm leading-6">
              {problem}
            </p>
          )}
        </div>

        <div className="md:col-span-6 lg:col-span-7">
          {/* Before a photo is chosen, the right-hand side tells the story in three lines. */}
          {run.phase === "idle" && !showing && (
            <ol className="space-y-5">
              {[
                ["Add your outfit", "Take a photo or upload one."],
                ["Style This Outfit", "We keep your clothes and improve how they come together."],
                ["Complete your look", "See what to adjust and what could finish it."],
              ].map(([title, text], index) => (
                <li key={title} className="flex gap-4">
                  <span aria-hidden="true" className="font-display text-4xl leading-none text-olive">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-display text-2xl leading-7">{title}</span>
                    <span className="block leading-7 text-stone">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}

          {photo && run.phase !== "result" && !openLook && (
            <div className="md:sticky md:top-24">
              <button
                type="button"
                disabled={!canStyle}
                onClick={() => void styleOutfit()}
                className={`${primaryButton} w-full text-base`}
              >
                {run.phase === "analysing" ? "Styling…" : "Style This Outfit"}
              </button>
              {stylingUnavailable && (
                <p role="alert" className="mt-3 border border-espresso p-3 text-sm leading-6">
                  Outfit styling isn&rsquo;t available on this site right now, because the AI
                  service isn&rsquo;t set up here. Your photo hasn&rsquo;t been sent anywhere.
                </p>
              )}
              {imagesOff && run.phase === "idle" && (
                <p className="mt-3 text-sm leading-6 text-stone">
                  You&rsquo;ll get written styling advice. AI picture generation isn&rsquo;t
                  switched on for this site yet.
                </p>
              )}
              {run.phase === "analysing" && <StylingProgress compact />}
              {run.phase === "error" && (
                <div role="alert" className="mt-4 border border-espresso p-4">
                  <p className="font-display text-2xl leading-7">That didn&rsquo;t work.</p>
                  <p className="mt-1 text-sm leading-6">{run.message}</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    {run.retryable && (
                      <button type="button" onClick={() => void styleOutfit()} className={secondaryButton}>
                        Retry
                      </button>
                    )}
                    <button type="button" onClick={removePhoto} className={secondaryButton}>
                      Choose Another Photo
                    </button>
                  </div>
                </div>
              )}
              <p className="mt-4 text-xs leading-5 text-stone">
                The photo is sent securely to Google&rsquo;s Gemini to describe and restyle your outfit.
                VEYORAQ doesn&rsquo;t store it.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* After a refresh the photo is gone (it is never stored in the browser's text
          storage), so say so plainly and keep any written advice that was saved. */}
      {!photo && !openLook && draft.stage !== "empty" && (
        <section aria-label="Resume" className="mt-10 border-t border-sand pt-8">
          <div role="status" className="max-w-2xl border border-espresso/40 bg-soft-white p-4 text-sm leading-6">
            <p className="font-medium">Welcome back.</p>
            <p className="mt-1">
              {draft.stage === "result"
                ? "Your photo can't be kept when the page reloads, so it needs to be added again to see the side-by-side. Your written advice is below."
                : "You had chosen a photo before the page reloaded. Photos can't be kept across a reload, so please choose it again above."}
            </p>
            <button
              type="button"
              onClick={() => fixDraft.clear()}
              className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4"
            >
              Start over
            </button>
          </div>
          {draft.stage === "result" && draft.analysis && (
            <div className="mt-8">
              <Advice analysis={draft.analysis} />
            </div>
          )}
        </section>
      )}

      {showing && (
        <section aria-label="Your styled look" className="mt-12 space-y-10 border-t border-sand pt-10" aria-live="polite">
          <Comparison
            original={showing.original}
            image={showing.image}
            onRetry={() => void styleOutfit(showing.original)}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" disabled={busy} onClick={() => void styleOutfit(showing.original)} className={primaryButton}>
              Style Again
            </button>
            <button type="button" onClick={removePhoto} className={secondaryButton}>
              Try Another Style
            </button>
            <button
              type="button"
              disabled={saveState.state === "saving" || saveState.state === "saved"}
              onClick={() => void saveLook(showing)}
              className={secondaryButton}
            >
              {saveState.state === "saving" ? "Saving…" : saveState.state === "saved" ? "Look Saved" : "Save Look"}
            </button>
          </div>
          {saveState.state === "saved" && (
            <p role="status" className="-mt-6 text-sm leading-6 text-stone">
              Saved on this device only. It won&rsquo;t appear on other devices or in your account yet.
            </p>
          )}
          {saveState.state === "error" && (
            <p role="alert" className="-mt-6 text-sm leading-6">
              {saveState.message}
            </p>
          )}

          <Advice analysis={showing.analysis} />
        </section>
      )}

      {looks.status === "ready" && looks.looks.length > 0 && (
        <section aria-labelledby="saved-looks" className="mt-14 border-t border-sand pt-8">
          <h2 id="saved-looks" className="font-display text-3xl leading-tight">
            Your saved looks
          </h2>
          <p className="mt-1 text-sm text-stone">Kept on this device only.</p>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {looks.looks.map((look) => (
              <li key={look.id}>
                <div className="aspect-[4/5] overflow-hidden border border-sand bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(look.styled ?? look.original)}
                    alt={look.styled ? "Saved styled look" : "Saved original outfit"}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setRun({ phase: "idle" });
                      setSaveState({ state: "saved", id: look.id });
                      setOpenLook({
                        original: look.original,
                        analysis: {
                          isOutfit: true,
                          items: look.items.map((item) => ({ ...item, colours: [], details: "Saved look" })),
                          assessment: look.assessment,
                          improvements: look.improvements,
                          additions: look.additions.map((addition) => ({ ...addition, category: "accessory" })),
                        },
                        image: look.styled
                          ? { state: "ready", blob: look.styled }
                          : { state: "unavailable", kind: "skipped", message: "No styled image was saved with this look." },
                      });
                      window.scrollTo({ top: 0 });
                    }}
                    className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => void looksStore.remove(look.id)}
                    className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {looks.status === "unavailable" && (
        <p className="mt-10 text-sm leading-6 text-stone">
          This browser isn&rsquo;t letting VEYORAQ store looks (private browsing can do this), so
          &ldquo;Save Look&rdquo; won&rsquo;t work here.
        </p>
      )}
    </div>
  );
}
