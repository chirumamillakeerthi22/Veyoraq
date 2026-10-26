"use client";

import { useEffect, useState } from "react";

type Tab = "outfits" | "colour" | "fit";

const hashTab: Record<string, Tab> = { "#color-analysis": "colour", "#fit-guidance": "fit" };

/*
  Switches between saved outfits, saved Color Analysis reports and saved Fit Guidance.
  They are separate collections. Only the active one renders, and #color-analysis or
  #fit-guidance opens its tab directly, so links from those tools land in the right place.
*/
export function SavedTabs({
  outfits,
  colour,
  fit,
}: {
  outfits: React.ReactNode;
  colour: React.ReactNode;
  fit: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("outfits");

  useEffect(() => {
    // Read the hash after mount so server and first client render agree.
    const fromHash = () => {
      const found = hashTab[window.location.hash];
      if (found) setTab(found);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "outfits", label: "Outfits" },
    { id: "colour", label: "Your Color Analysis" },
    { id: "fit", label: "Fit Guidance" },
  ];

  return (
    <div>
      <div role="tablist" aria-label="Saved items" className="grid max-w-xl grid-cols-3 border border-sand">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`saved-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`saved-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`min-h-11 px-2 text-sm transition-colors duration-200 ${
              tab === t.id ? "bg-burgundy text-ivory" : "hover:bg-espresso/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`saved-panel-${tab}`}
        aria-labelledby={`saved-tab-${tab}`}
        className="mt-8"
      >
        {tab === "outfits" ? outfits : tab === "colour" ? colour : fit}
      </div>
    </div>
  );
}
