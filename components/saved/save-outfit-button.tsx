"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { outfitKey } from "@/lib/saved/outfit-key";
import type { SavedAnswers } from "@/lib/saved/saved-outfits";
import { savedStore, useSavedOutfits } from "@/lib/saved/use-saved";
import type { Outfit } from "@/lib/stylist/schema";

const button =
  "inline-flex min-h-11 items-center justify-center border border-espresso/30 px-5 text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:cursor-not-allowed disabled:opacity-60";

type Note = { kind: "sign-in" | "error"; text: string } | null;

/*
  Save / Saved for one look. Whether it is saved is read from the shared saved-looks
  store (which mirrors the database), never remembered locally, so it is always
  right: removing the look on the Saved Styles page flips this back at once.
*/
export function SaveOutfitButton({
  outfit,
  answers,
}: {
  outfit: Outfit;
  answers: SavedAnswers | null;
}) {
  const state = useSavedOutfits();
  const key = useMemo(() => outfitKey(outfit), [outfit]);
  const [note, setNote] = useState<Note>(null);

  const saved = state.items.some((item) => item.key === key);
  const busy = state.busyKeys.includes(key);

  async function onSave() {
    setNote(null);
    const result = await savedStore.save(outfit, answers);
    if (result.ok) return;
    setNote(
      result.reason === "signed-out"
        ? { kind: "sign-in", text: "" }
        : { kind: "error", text: result.message },
    );
  }

  async function onRemove() {
    setNote(null);
    const result = await savedStore.removeByKey(key);
    if (!result.ok) setNote({ kind: "error", text: result.message });
  }

  if (saved) {
    return (
      <div>
        <p role="status" className="flex flex-wrap items-center gap-x-4 text-sm">
          <span>{busy ? "Updating…" : "Saved to your account."}</span>
          <Link href="/saved" className="min-h-11 content-center underline underline-offset-4">
            View saved looks
          </Link>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="min-h-11 text-left underline underline-offset-4 disabled:opacity-60"
          >
            Remove
          </button>
        </p>
        {note?.kind === "error" && (
          <p role="alert" className="text-sm leading-6">
            {note.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={onSave} disabled={busy} className={button}>
        {busy ? "Saving…" : "Save this look"}
      </button>

      {note?.kind === "sign-in" && (
        <p role="status" className="mt-3 text-sm leading-6 text-stone">
          Sign in to save this look.{" "}
          <Link
            href="/account"
            target="_blank"
            rel="noopener"
            className="text-espresso underline underline-offset-4"
          >
            Sign in (opens in a new tab)
          </Link>
          , then come back here and press Save again. Your ideas stay on this page.
        </p>
      )}
      {note?.kind === "error" && (
        <p role="alert" className="mt-3 text-sm leading-6">
          {note.text}
        </p>
      )}
    </div>
  );
}
