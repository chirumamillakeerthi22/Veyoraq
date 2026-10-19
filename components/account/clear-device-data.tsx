"use client";

import { useState } from "react";
import { clearDeviceData } from "@/lib/device-data";

const button =
  "inline-flex min-h-11 items-center justify-center border border-espresso/30 px-5 text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:opacity-60";

// A real privacy control: removes what VEYORAQ keeps in this browser, after a confirmation.
export function ClearDeviceData() {
  const [stage, setStage] = useState<"idle" | "confirm" | "working" | "done" | "failed">("idle");

  async function clear() {
    setStage("working");
    const ok = await clearDeviceData();
    setStage(ok ? "done" : "failed");
  }

  return (
    <div>
      {stage === "idle" && (
        <button type="button" onClick={() => setStage("confirm")} className={button}>
          Clear data on this device
        </button>
      )}
      {(stage === "confirm" || stage === "working") && (
        <div role="alertdialog" aria-label="Confirm clearing data" className="border border-espresso p-4">
          <p className="text-sm leading-6">
            This removes your audience choice, unfinished quiz answers, and looks saved on this
            device (including FIX My Style, Hair Studio and Color Analysis looks kept only here).
            Your account and anything saved to it are not affected.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={() => void clear()} disabled={stage === "working"} className={button}>
              {stage === "working" ? "Clearing…" : "Yes, clear it"}
            </button>
            <button type="button" onClick={() => setStage("idle")} disabled={stage === "working"} className={button}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {stage === "done" && (
        <p role="status" className="text-sm leading-6">
          Cleared. Reload the page to see the defaults.{" "}
          <button type="button" onClick={() => window.location.reload()} className="underline underline-offset-4">
            Reload now
          </button>
        </p>
      )}
      {stage === "failed" && (
        <p role="alert" className="text-sm leading-6">
          We couldn’t clear everything (your browser may be blocking storage, or another tab has
          it open). Close other VEYORAQ tabs and try again.
        </p>
      )}
    </div>
  );
}
