"use client";

import { useEffect, useState } from "react";

type Tab = "outfits" | "colour";

/*
  Switches between saved outfits and saved Color Analysis reports. Both are kept
  mounted-by-choice (only the active one renders), and #color-analysis opens the
  second tab directly, so links from the Color Analysis page land in the right place.
*/
export function SavedTabs({
  outfits,
  colour,
}: {
  outfits: React.ReactNode;
  colour: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("outfits");

  useEffect(() => {
    // Read the hash after mount so server and first client render agree.
    const fromHash = () => {
      if (window.location.hash === "#color-analysis") setTab("colour");
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "outfits", label: "Outfits" },
    { id: "colour", label: "Your Color Analysis" },
  ];

  return (
    <div>
      <div role="tablist" aria-label="Saved items" className="grid max-w-md grid-cols-2 border border-sand">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`saved-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`saved-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`min-h-11 px-3 text-sm transition-colors duration-200 ${
              tab === t.id ? "bg-espresso text-ivory" : "hover:bg-espresso/5"
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
        {tab === "outfits" ? outfits : colour}
      </div>
    </div>
  );
}
