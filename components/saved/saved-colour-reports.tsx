"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/auth/use-auth";
import { colourDraft } from "@/lib/color-analysis/draft";
import { seasonLabels } from "@/lib/color-analysis/schema";
import { colourReportsStore, useColourReports, type SavedColourReport } from "@/lib/color-analysis/use-colour-reports";

const link = "inline-flex min-h-11 items-center text-sm underline underline-offset-4";

function title(report: SavedColourReport): string {
  const season = report.analysis.likelySeason;
  return season === "uncertain" ? "Colours to explore" : seasonLabels[season];
}

/*
  The person's saved Color Analysis reports. Separate from saved outfits and the
  product Wishlist. Opening one shows the stored result; the AI is not run again.
*/
export function SavedColourReports() {
  const router = useRouter();
  const auth = useAuthState();
  const reports = useColourReports();
  const signedIn = auth.status === "signed-in";

  function open(report: SavedColourReport) {
    colourDraft.set((current) => ({ ...current, stage: "results", result: report.analysis }));
    router.push("/color-analysis");
  }

  if (reports.status === "idle" || reports.status === "loading") {
    return (
      <p role="status" className="text-stone">
        Loading your colour analyses…
      </p>
    );
  }

  if (reports.status === "error" || reports.status === "unavailable") {
    return (
      <p role="alert" className="border border-espresso p-4 leading-7">
        {reports.status === "unavailable"
          ? "Saved colour analyses can’t be read here. Your browser may be blocking storage."
          : "We couldn’t load your saved colour analyses. Please refresh and try again."}
      </p>
    );
  }

  if (reports.looks.length === 0) {
    return (
      <div className="max-w-xl border border-dashed border-espresso/40 p-6">
        <p className="font-display text-2xl leading-8">No saved Color Analysis yet.</p>
        <p className="mt-2 leading-7 text-stone">
          After you run a Color Analysis, choose Save My Color Analysis and it will appear here.
        </p>
        <Link
          href="/color-analysis"
          className="mt-4 inline-flex min-h-11 items-center border border-espresso px-5 text-xs font-medium uppercase tracking-[0.14em]"
        >
          Start Color Analysis
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-stone">
        {signedIn
          ? "Kept in your account."
          : "Kept on this device only. Sign in to keep them in your account."}{" "}
        No photo is stored.
      </p>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.looks.map((report) => {
          const a = report.analysis;
          return (
            <li key={report.id} className="border border-sand bg-soft-white p-4">
              <div className="flex h-10 overflow-hidden border border-espresso/15" aria-hidden="true">
                {[...a.recommendedColors, ...a.neutralColors, ...a.accentColors].slice(0, 8).map((s) => (
                  <span key={`${s.name}-${s.hex}`} className="flex-1" style={{ backgroundColor: s.hex }} />
                ))}
              </div>
              <p className="mt-3 font-display text-2xl leading-7">{title(report)}</p>
              <p className="mt-1 line-clamp-3 text-sm leading-6 text-stone">{a.summary}</p>
              <p className="mt-2 text-xs text-stone">
                Saved {new Date(report.savedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5">
                <button type="button" onClick={() => open(report)} className={link}>
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => void colourReportsStore.remove(report.id)}
                  className={link}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
