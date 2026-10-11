"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut() {
    setBusy(true);
    setFailed(false);
    try {
      const { error } = await createSupabaseBrowserClient().auth.signOut();
      if (error) throw error;
      router.refresh();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="inline-flex min-h-12 items-center justify-center border border-espresso/30 px-7 text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {failed && (
        <p role="alert" className="mt-3 text-sm">
          We couldn&rsquo;t sign you out. Please try again.
        </p>
      )}
    </div>
  );
}
