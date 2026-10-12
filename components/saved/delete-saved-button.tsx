"use client";

import { useState } from "react";
import { savedStore, useSavedOutfits } from "@/lib/saved/use-saved";

const button =
  "inline-flex min-h-11 items-center justify-center border border-espresso/30 px-5 text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:cursor-not-allowed disabled:opacity-60";

const compactButton =
  "inline-flex min-h-11 items-center justify-center border border-espresso/30 px-3 text-[0.6875rem] font-medium uppercase tracking-[0.1em] transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:cursor-not-allowed disabled:opacity-60";

// Removes one saved look. The list and every Save button update from the shared store.
export function DeleteSavedButton({
  id,
  itemKey,
  compact = false,
}: {
  id: string;
  itemKey: string;
  // The two-column grid is narrow, so the compact form uses smaller buttons that wrap.
  compact?: boolean;
}) {
  const state = useSavedOutfits();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const busy = state.busyKeys.includes(itemKey);

  async function remove() {
    setError("");
    const result = await savedStore.removeById(id);
    if (!result.ok) {
      setError(result.message);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <div>
        <button type="button" onClick={() => setConfirming(true)} className={compact ? compactButton : button}>
          Remove
        </button>
        {error && (
          <p role="alert" className="mt-3 text-sm">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm">Remove this look?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={remove} disabled={busy} className={compact ? compactButton : button}>
          {busy ? "Removing…" : "Yes, remove"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className={compact ? compactButton : button}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
