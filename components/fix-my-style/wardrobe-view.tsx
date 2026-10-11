"use client";

import { useRef, useState } from "react";
import { prepareImage, validateFile } from "@/lib/fix-my-style/image";
import {
  categoryLabels,
  categoryValues,
  colourLabels,
  colourValues,
  limits,
  occasionLabels,
  occasionValues,
  seasonLabels,
  seasonValues,
} from "@/lib/fix-my-style/options";
import { wardrobeStore } from "@/lib/fix-my-style/use-wardrobe";
import type { WardrobeState } from "@/lib/fix-my-style/store";
import {
  countActiveFilters,
  emptyFilters,
  filterItems,
  type WardrobeFilters,
  type WardrobeItem,
} from "@/lib/fix-my-style/wardrobe";
import { GarmentForm, validateFields, type GarmentFields } from "./garment-form";
import {
  Chip,
  GarmentPhoto,
  Notice,
  primaryButton,
  releasePhoto,
  secondaryButton,
  Sheet,
  textButton,
} from "./ui";

function toFields(item: WardrobeItem): GarmentFields {
  return {
    name: item.name,
    category: item.category,
    colours: item.colours,
    pattern: item.pattern ?? "",
    material: item.material ?? "",
    style: item.style ?? "",
    seasons: item.seasons,
    occasions: item.occasions,
  };
}

function ItemSheet({
  item,
  selected,
  onToggleSelect,
  onStyle,
  onClose,
}: {
  item: WardrobeItem;
  selected: boolean;
  onToggleSelect: () => void;
  onStyle: () => void;
  onClose: () => void;
}) {
  const replaceInput = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<GarmentFields>(() => toFields(item));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function save(photo?: Blob) {
    const problem = validateFields(fields);
    if (problem) return setMessage({ tone: "error", text: problem });
    setBusy(true);
    const ok = await wardrobeStore.saveItem({
      ...item,
      name: fields.name.trim().slice(0, limits.nameLength),
      category: fields.category as WardrobeItem["category"],
      colours: fields.colours,
      pattern: fields.pattern || null,
      material: fields.material || null,
      style: fields.style || null,
      seasons: fields.seasons,
      occasions: fields.occasions,
      photo: photo ?? item.photo,
      updatedAt: Date.now(),
    });
    setBusy(false);
    setMessage(
      ok
        ? { tone: "info", text: "Saved." }
        : { tone: "error", text: "We couldn't save that change on this device. Please try again." },
    );
    return ok;
  }

  async function replacePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = validateFile(file);
    if (problem) return setMessage({ tone: "error", text: problem });
    setBusy(true);
    const prepared = await prepareImage(file);
    setBusy(false);
    if (!prepared.ok) return setMessage({ tone: "error", text: prepared.message });
    const previous = item.photo;
    if (await save(prepared.blob)) releasePhoto(previous);
  }

  async function remove() {
    setBusy(true);
    const photo = item.photo;
    const ok = await wardrobeStore.removeItem(item.id);
    setBusy(false);
    if (!ok) {
      setMessage({ tone: "error", text: "We couldn't remove this item. Please try again." });
      return;
    }
    releasePhoto(photo);
    onClose();
  }

  return (
    <div>
      <input
        ref={replaceInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={replacePhoto}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <div className="mx-auto aspect-[3/4] max-h-[40dvh] overflow-hidden border border-sand bg-sand">
        <GarmentPhoto blob={item.photo} alt={`${item.name}, ${categoryLabels[item.category]}`} />
      </div>
      {item.suggestedByAi && (
        <p className="mt-2 text-xs text-stone">Details started as an AI suggestion.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onStyle} className={primaryButton}>
          Style this item
        </button>
        <button type="button" onClick={onToggleSelect} className={secondaryButton}>
          {selected ? "Remove from outfit" : "Select for outfit"}
        </button>
      </div>

      <div className="mt-6">
        <GarmentForm fields={fields} disabled={busy} onChange={setFields} />
      </div>

      {message && (
        <div className="mt-4">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void save()} className={secondaryButton}>
          Save changes
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => replaceInput.current?.click()}
          className={secondaryButton}
        >
          Replace photo
        </button>
      </div>

      <div className="mt-6 border-t border-sand pt-4">
        {confirming ? (
          <div role="alertdialog" aria-label="Confirm delete">
            <p className="text-sm leading-6">
              Delete &ldquo;{item.name}&rdquo; and its photo from this device? Saved outfits that
              use it will be removed too. This can&rsquo;t be undone.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={remove} className={primaryButton}>
                {busy ? "Deleting…" : "Yes, delete it"}
              </button>
              <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={secondaryButton}>
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={textButton}>
            Delete this item
          </button>
        )}
      </div>
    </div>
  );
}

function FilterSheet({
  open,
  filters,
  onChange,
  onClose,
}: {
  open: boolean;
  filters: WardrobeFilters;
  onChange: (next: WardrobeFilters) => void;
  onClose: () => void;
}) {
  const set = <K extends keyof WardrobeFilters>(key: K, value: WardrobeFilters[K]) =>
    onChange({ ...filters, [key]: filters[key] === value ? null : value });

  return (
    <Sheet open={open} onClose={onClose} title="Filter your wardrobe">
      <div className="space-y-5">
        <fieldset>
          <legend className="text-sm text-stone">Category</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {categoryValues.map((value) => (
              <Chip
                key={value}
                name="f-category"
                value={value}
                label={categoryLabels[value]}
                checked={filters.category === value}
                onChange={() => set("category", value)}
              />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm text-stone">Colour</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {colourValues.map((value) => (
              <Chip
                key={value}
                name="f-colour"
                value={value}
                label={colourLabels[value]}
                checked={filters.colour === value}
                onChange={() => set("colour", value)}
              />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm text-stone">Season</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {seasonValues.map((value) => (
              <Chip
                key={value}
                name="f-season"
                value={value}
                label={seasonLabels[value]}
                checked={filters.season === value}
                onChange={() => set("season", value)}
              />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm text-stone">Occasion</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {occasionValues.map((value) => (
              <Chip
                key={value}
                name="f-occasion"
                value={value}
                label={occasionLabels[value]}
                checked={filters.occasion === value}
                onChange={() => set("occasion", value)}
              />
            ))}
          </div>
        </fieldset>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onClose} className={primaryButton}>
          Show items
        </button>
        <button type="button" onClick={() => onChange(emptyFilters)} className={secondaryButton}>
          Clear filters
        </button>
      </div>
    </Sheet>
  );
}

export function WardrobeView({
  wardrobe,
  selected,
  onToggleSelect,
  onAdd,
  onStyleItem,
}: {
  wardrobe: WardrobeState;
  selected: string[];
  onToggleSelect: (id: string) => void;
  onAdd: () => void;
  onStyleItem: (id: string) => void;
}) {
  const [filters, setFilters] = useState<WardrobeFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = filterItems(wardrobe.items, filters);
  const active = countActiveFilters(filters);
  const openItem = wardrobe.items.find((item) => item.id === openId) ?? null;

  if (wardrobe.items.length === 0) {
    return (
      <div className="border border-sand bg-soft-white p-6 text-center sm:p-10">
        <p className="font-display text-3xl leading-tight">Your wardrobe is empty.</p>
        <p className="mx-auto mt-3 max-w-md leading-7 text-stone">
          Add the clothes you already own, one photo at a time, and VEYORAQ will help you find fresh
          ways to wear them.
        </p>
        <button type="button" onClick={onAdd} className={`${primaryButton} mt-6`}>
          Add clothes
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone" role="status">
          {visible.length === wardrobe.items.length
            ? `${wardrobe.items.length} item${wardrobe.items.length === 1 ? "" : "s"}`
            : `${visible.length} of ${wardrobe.items.length} items`}
        </p>
        <button type="button" onClick={() => setFiltersOpen(true)} className={secondaryButton}>
          Filter{active > 0 ? ` (${active})` : ""}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 border border-sand bg-soft-white p-6 text-center">
          <p className="font-display text-2xl">Nothing matches those filters.</p>
          <button type="button" onClick={() => setFilters(emptyFilters)} className={`${secondaryButton} mt-4`}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {visible.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <li key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenId(item.id)}
                  className="block w-full text-left"
                >
                  <span
                    className={`block aspect-[3/4] overflow-hidden border bg-sand ${
                      isSelected ? "border-espresso" : "border-sand"
                    }`}
                  >
                    <GarmentPhoto blob={item.photo} alt="" />
                  </span>
                  <span className="mt-2 block text-sm font-medium leading-5 [overflow-wrap:anywhere]">
                    {item.name}
                  </span>
                  <span className="block text-xs text-stone">{categoryLabels[item.category]}</span>
                  <span className="sr-only">. Open details.</span>
                </button>
                <label className="absolute right-1 top-1 flex h-11 w-11 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 items-center justify-center border border-espresso/40 bg-ivory/90 text-ivory peer-checked:border-espresso peer-checked:bg-espresso peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.500" />
                    </svg>
                  </span>
                  <span className="sr-only">Select {item.name} for an outfit</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <FilterSheet
        open={filtersOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
      />

      <Sheet open={openItem !== null} onClose={() => setOpenId(null)} title={openItem?.name ?? "Item"}>
        {openItem && (
          <ItemSheet
            key={openItem.id}
            item={openItem}
            selected={selected.includes(openItem.id)}
            onToggleSelect={() => onToggleSelect(openItem.id)}
            onStyle={() => {
              setOpenId(null);
              onStyleItem(openItem.id);
            }}
            onClose={() => setOpenId(null)}
          />
        )}
      </Sheet>
    </div>
  );
}
