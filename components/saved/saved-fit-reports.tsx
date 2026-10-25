"use client";

import Link from "next/link";
import { useState } from "react";
import { FitReportView } from "@/components/fit-guidance/fit-report-view";
import { Sheet } from "@/components/sheet";
import { audienceLabels } from "@/lib/audience";
import { fitReportsStore, useFitReports, type SavedFitReport } from "@/lib/fit-guidance/use-fit-reports";

const link = "inline-flex min-h-11 items-center text-sm underline underline-offset-4";

/*
  Saved Fit Guidance reports. A separate collection from saved outfits, saved Color
  Analysis reports and the product Wishlist. They live on this device only.
*/
export function SavedFitReports() {
  const state = useFitReports();
  const [open, setOpen] = useState<SavedFitReport | null>(null);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <p role="status" className="text-stone">
        Loading your saved fit guidance…
      </p>
    );
  }

  if (state.status === "error" || state.status === "unavailable") {
    return (
      <p role="alert" className="border border-espresso p-4 leading-7">
        {state.status === "unavailable"
          ? "Saved fit guidance can’t be read here. Your browser may be blocking storage."
          : "We couldn’t load your saved fit guidance. Please refresh and try again."}
      </p>
    );
  }

  if (state.looks.length === 0) {
    return (
      <div className="max-w-xl border border-dashed border-espresso/40 p-6">
        <p className="font-display text-2xl leading-8">No saved fit guidance yet.</p>
        <p className="mt-2 leading-7 text-stone">
          After you get your fit guidance, choose Save this fit guidance and it will appear here.
        </p>
        <Link
          href="/fit-guidance"
          className="mt-4 inline-flex min-h-11 items-center border border-espresso px-5 text-xs font-medium uppercase tracking-[0.14em]"
        >
          Find your best fit
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-stone">
        Kept on this device only, not in your account. They include any measurements you chose to
        enter, and never a photo.
      </p>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.looks.map((entry) => (
          <li key={entry.id} className="border border-sand bg-soft-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-stone">
              {audienceLabels[entry.report.audience]}
            </p>
            <p className="mt-1 font-display text-2xl leading-7">
              {entry.report.shape === "unsure" ? "Cuts and fits to explore" : entry.report.shapeLabel}
            </p>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone">{entry.report.intro}</p>
            <p className="mt-2 text-xs text-stone">
              Saved {new Date(entry.savedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-5">
              <button type="button" onClick={() => setOpen(entry)} className={link}>
                Open
              </button>
              <button type="button" onClick={() => void fitReportsStore.remove(entry.id)} className={link}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Sheet open={open !== null} onClose={() => setOpen(null)} title="Your fit guidance">
        {open && (
          <div className="p-5">
            <FitReportView report={open.report} headingId="saved-fit" />
          </div>
        )}
      </Sheet>
    </div>
  );
}
