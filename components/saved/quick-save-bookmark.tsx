"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { outfitKey } from "@/lib/saved/outfit-key";
import type { SavedAnswers } from "@/lib/saved/saved-outfits";
import { savedStore, useSavedOutfits } from "@/lib/saved/use-saved";
import type { Outfit } from "@/lib/stylist/schema";

type Note = { kind: "info" | "sign-in" | "error"; text: string } | null;

/*
  One-tap save for an outfit card, shown top-right over the image. It uses the same
  saved-looks store as "Save this look" (so there is one source of truth and the
  state is always the database's), and it is separate from the product heart/Wishlist.
*/
export function QuickSaveBookmark({
  outfit,
  answers,
}: {
  outfit: Outfit;
  answers: SavedAnswers | null;
}) {
  const state = useSavedOutfits();
  const key = useMemo(() => outfitKey(outfit), [outfit]);
  const [note, setNote] = useState<Note>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saved = state.items.some((item) => item.key === key);
  const busy = state.busyKeys.includes(key);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function show(next: Note, ms = 2500) {
    setNote(next);
    if (timer.current) clearTimeout(timer.current);
    if (next && ms > 0) timer.current = setTimeout(() => setNote(null), ms);
  }

  async function onToggle() {
    if (busy) return; // ignore repeat taps while a save/remove is in flight
    if (saved) {
      const result = await savedStore.removeByKey(key);
      show(
        result.ok
          ? { kind: "info", text: "Removed from Saved Styles" }
          : { kind: "error", text: result.message },
      );
      return;
    }
    const result = await savedStore.save(outfit, answers);
    if (result.ok) {
      show({ kind: "info", text: "Saved to Saved Styles" });
    } else if (result.reason === "signed-out") {
      show({ kind: "sign-in", text: "Sign in to save this look." }, 0);
    } else {
      show({ kind: "error", text: result.message });
    }
  }

  return (
    <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={saved}
        aria-busy={busy}
        aria-label={saved ? `Remove ${outfit.name} from Saved Styles` : `Save ${outfit.name} to Saved Styles`}
        className={`flex h-11 w-11 items-center justify-center border border-espresso/20 bg-ivory/90 text-espresso backdrop-blur transition-colors duration-200 hover:bg-ivory ${
          busy ? "opacity-60" : ""
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        >
          <path d="M6 3.5h12a.5.5 0 0 1 .5.5v16.5l-6.5-4.2-6.5 4.2V4a.5.5 0 0 1 .5-.5Z" />
        </svg>
      </button>

      {note && (
        <p
          role={note.kind === "error" ? "alert" : "status"}
          className="max-w-[14rem] border border-espresso/20 bg-ivory px-3 py-2 text-xs leading-5"
        >
          {note.text}
          {note.kind === "sign-in" && (
            <>
              {" "}
              <Link
                href="/account"
                target="_blank"
                rel="noopener"
                className="underline underline-offset-4"
              >
                Sign in (new tab)
              </Link>
              , then tap again. Your ideas stay here.
            </>
          )}
        </p>
      )}
    </div>
  );
}
