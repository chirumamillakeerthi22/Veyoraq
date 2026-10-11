"use client";

import Link from "next/link";
import { useState } from "react";
import {
  friendlySaveError,
  saveOutfit,
  type SavedAnswers,
} from "@/lib/saved/saved-outfits";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Outfit } from "@/lib/stylist/schema";

type Status = "idle" | "saving" | "saved" | "needs-sign-in" | "error";

const button =
  "inline-flex min-h-11 items-center justify-center border border-espresso/30 px-5 text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:cursor-not-allowed disabled:opacity-60";

export function SaveOutfitButton({
  outfit,
  answers,
}: {
  outfit: Outfit;
  answers: SavedAnswers | null;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function save() {
    setStatus("saving");
    setMessage("");

    let client;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      setStatus("error");
      setMessage("Saving isn't available yet. Please check back soon.");
      return;
    }

    // Check the login first, so a signed-out visitor gets a clear next step.
    const { data } = await client.auth.getUser();
    if (!data.user) {
      setStatus("needs-sign-in");
      return;
    }

    const result = await saveOutfit(client, outfit, answers);
    if (result.ok) {
      setStatus("saved");
    } else {
      setStatus("error");
      setMessage(result.message || friendlySaveError(null));
    }
  }

  if (status === "saved") {
    return (
      <p role="status" className="flex flex-wrap items-center gap-x-4 text-sm">
        <span>Saved to your account.</span>
        <Link href="/saved" className="min-h-11 content-center underline underline-offset-4">
          View saved looks
        </Link>
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={save}
        disabled={status === "saving"}
        className={button}
      >
        {status === "saving" ? "Saving…" : "Save this look"}
      </button>

      {status === "needs-sign-in" && (
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
      {status === "error" && (
        <p role="alert" className="mt-3 text-sm leading-6">
          {message}
        </p>
      )}
    </div>
  );
}
