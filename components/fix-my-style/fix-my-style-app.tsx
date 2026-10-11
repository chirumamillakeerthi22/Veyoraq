"use client";

import { useState } from "react";
import { useWardrobe, wardrobeStore } from "@/lib/fix-my-style/use-wardrobe";
import { AddClothes } from "./add-clothes";
import { OutfitStudio } from "./outfit-studio";
import { Notice, primaryButton, secondaryButton } from "./ui";
import { WardrobeView } from "./wardrobe-view";

type View = "overview" | "add" | "wardrobe" | "outfit";

const tabs: { view: View; label: string }[] = [
  { view: "overview", label: "Overview" },
  { view: "add", label: "Add" },
  { view: "wardrobe", label: "Wardrobe" },
  { view: "outfit", label: "Style" },
];

function EntryCard({
  title,
  text,
  action,
  onClick,
}: {
  title: string;
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group flex h-full w-full flex-col items-start border border-sand bg-soft-white p-5 text-left transition-colors duration-200 hover:border-espresso/40"
      >
        <span className="font-display text-2xl leading-8">{title}</span>
        <span className="mt-1 text-sm leading-6 text-stone">{text}</span>
        <span className="mt-4 text-xs uppercase tracking-[0.18em] text-espresso">{action} →</span>
      </button>
    </li>
  );
}

export function FixMyStyleApp() {
  const wardrobe = useWardrobe();
  const [view, setView] = useState<View>("overview");
  const [selected, setSelected] = useState<string[]>([]);
  const [anchorId, setAnchorId] = useState<string | null>(null);

  const count = wardrobe.items.length;
  const go = (next: View) => {
    setView(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  function toggleSelect(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  return (
    <div>
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">FIX My Style</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.05] md:text-6xl">Fix My Style</h1>
        <p className="mt-4 text-base leading-7 text-stone md:text-lg md:leading-8">
          Make more of the clothes you already own. Discover fresh outfits, try new combinations,
          and find the finishing touches that complete your look.
        </p>
      </header>

      <div className="mt-6 space-y-3">
        <Notice>
          Your wardrobe is saved only on this device, in this browser. Clearing your browser data
          removes it, and it doesn&rsquo;t sync to other devices yet.
        </Notice>
        {wardrobe.status === "unavailable" && (
          <Notice tone="error">
            This browser isn&rsquo;t letting VEYORAQ store a wardrobe, which can happen in private
            browsing. You can still look around, but items can&rsquo;t be saved here.
          </Notice>
        )}
        {wardrobe.status === "error" && (
          <div className="space-y-3">
            <Notice tone="error">We couldn&rsquo;t read your wardrobe from this device.</Notice>
            <button
              type="button"
              onClick={() => void wardrobeStore.reload()}
              className={secondaryButton}
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <nav
        aria-label="FIX My Style sections"
        className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mx-5 mt-6 border-y border-sand bg-ivory px-5 sm:-mx-8 sm:px-8 md:top-16 lg:top-20 lg:-mx-12 lg:px-12"
      >
        <ul className="grid grid-cols-4">
          {tabs.map((tab) => (
            <li key={tab.view}>
              <button
                type="button"
                aria-current={view === tab.view ? "page" : undefined}
                onClick={() => go(tab.view)}
                className={`relative flex min-h-12 w-full items-center justify-center text-sm tracking-wide transition-colors duration-200 ${
                  view === tab.view ? "text-espresso" : "text-stone hover:text-espresso"
                }`}
              >
                {tab.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-0 h-px bg-gold transition-opacity duration-200 ${
                    view === tab.view ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8">
        {view === "overview" && (
          <div className="space-y-8">
            <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
              <EntryCard
                title="Add Clothes"
                text="Take a photo or upload an existing image."
                action="Add"
                onClick={() => go("add")}
              />
              <EntryCard
                title="My Wardrobe"
                text={
                  count > 0
                    ? `${count} item${count === 1 ? "" : "s"} saved. Browse and manage them.`
                    : "Browse and manage your saved clothing."
                }
                action="Open"
                onClick={() => go("wardrobe")}
              />
              <EntryCard
                title="Style an Outfit"
                text="Create outfits from the clothes in your wardrobe."
                action="Start"
                onClick={() => go("outfit")}
              />
            </ul>

            {wardrobe.status === "loading" && (
              <p role="status" className="text-sm text-stone">
                Opening your wardrobe…
              </p>
            )}

            {wardrobe.status === "ready" && count === 0 && (
              <div className="border border-sand bg-soft-white p-6 text-center sm:p-10">
                <p className="font-display text-3xl leading-tight">Start your wardrobe.</p>
                <p className="mx-auto mt-3 max-w-md leading-7 text-stone">
                  Add the pieces you already own, one photo at a time. Then we&rsquo;ll help you
                  find new ways to wear them. We start with what you have, and suggest new things
                  only when they genuinely help.
                </p>
                <button type="button" onClick={() => go("add")} className={`${primaryButton} mt-6`}>
                  Add clothes
                </button>
              </div>
            )}

            {wardrobe.outfits.length > 0 && (
              <p className="text-sm text-stone">
                You have {wardrobe.outfits.length} saved outfit
                {wardrobe.outfits.length === 1 ? "" : "s"}.{" "}
                <button type="button" onClick={() => go("outfit")} className="inline-flex min-h-11 items-center underline underline-offset-4">
                  View them
                </button>
              </p>
            )}
          </div>
        )}

        {view === "add" && <AddClothes onOpenWardrobe={() => go("wardrobe")} />}

        {view === "wardrobe" && (
          <WardrobeView
            wardrobe={wardrobe}
            selected={selected}
            onToggleSelect={toggleSelect}
            onAdd={() => go("add")}
            onStyleItem={(id) => {
              setAnchorId(id);
              go("outfit");
            }}
          />
        )}

        {view === "outfit" && (
          <OutfitStudio
            wardrobe={wardrobe}
            selected={selected}
            onSelectedChange={setSelected}
            anchorId={anchorId}
            onClearAnchor={() => setAnchorId(null)}
            onAdd={() => go("add")}
          />
        )}
      </div>
    </div>
  );
}
