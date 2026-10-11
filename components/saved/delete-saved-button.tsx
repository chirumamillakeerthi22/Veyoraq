"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSavedOutfit } from "@/lib/saved/saved-outfits";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const button =
  "inline-flex min-h-11 items-center justify-center border border-espresso/30 px-5 text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:cursor-not-allowed disabled:opacity-60";

export function DeleteSavedButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const result = await deleteSavedOutfit(createSupabaseBrowserClient(), id);
      if (!result.ok) {
        setError(result.message);
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn't remove that just now. Please try again.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={button}>
        Remove
      </button>
    );
  }

  return (
    <div>
      <p className="text-sm">Remove this look?</p>
      <div className="mt-2 flex gap-3">
        <button type="button" onClick={remove} disabled={busy} className={button}>
          {busy ? "Removing…" : "Yes, remove"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className={button}
        >
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
