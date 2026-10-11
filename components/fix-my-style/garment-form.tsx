"use client";

import { useId } from "react";
import {
  categoryLabels,
  categoryValues,
  colourLabels,
  colourValues,
  limits,
  materialLabels,
  materialValues,
  occasionLabels,
  occasionValues,
  patternLabels,
  patternValues,
  seasonLabels,
  seasonValues,
  styleLabels,
  styleValues,
  type Category,
  type GarmentColour,
  type Material,
  type Occasion,
  type Pattern,
  type Season,
  type StyleName,
} from "@/lib/fix-my-style/options";
import { Chip, fieldClass, labelClass } from "./ui";

// What the person edits for one garment.
export type GarmentFields = {
  name: string;
  category: Category | "";
  colours: GarmentColour[];
  pattern: Pattern | "";
  material: Material | "";
  style: StyleName | "";
  seasons: Season[];
  occasions: Occasion[];
};

export const emptyFields: GarmentFields = {
  name: "",
  category: "",
  colours: [],
  pattern: "",
  material: "",
  style: "",
  seasons: [],
  occasions: [],
};

export function validateFields(fields: GarmentFields): string | null {
  if (!fields.name.trim()) return "Give this item a name, for example “Cream knit cardigan”.";
  if (!fields.category) return "Choose a category.";
  return null;
}

function toggle<T extends string>(list: T[], value: T, max = Infinity): T[] {
  if (list.includes(value)) return list.filter((entry) => entry !== value);
  return list.length >= max ? list : [...list, value];
}

export function GarmentForm({
  fields,
  onChange,
  disabled = false,
}: {
  fields: GarmentFields;
  onChange: (next: GarmentFields) => void;
  disabled?: boolean;
}) {
  const uid = useId();
  const set = <K extends keyof GarmentFields>(key: K, value: GarmentFields[K]) =>
    onChange({ ...fields, [key]: value });

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${uid}-name`} className={labelClass}>
          Name
        </label>
        <input
          id={`${uid}-name`}
          type="text"
          value={fields.name}
          maxLength={limits.nameLength}
          autoComplete="off"
          enterKeyHint="done"
          disabled={disabled}
          onChange={(event) => set("name", event.target.value)}
          className={fieldClass}
        />
      </div>

      <fieldset disabled={disabled}>
        <legend className={labelClass}>Category</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {categoryValues.map((value) => (
            <Chip
              key={value}
              type="radio"
              name={`${uid}-category`}
              value={value}
              label={categoryLabels[value]}
              checked={fields.category === value}
              onChange={() => set("category", value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className={labelClass}>Colours (up to {limits.colourPerItem})</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {colourValues.map((value) => {
            const checked = fields.colours.includes(value);
            return (
              <Chip
                key={value}
                name={`${uid}-colours`}
                value={value}
                label={colourLabels[value]}
                checked={checked}
                disabled={!checked && fields.colours.length >= limits.colourPerItem}
                onChange={() =>
                  set("colours", toggle(fields.colours, value, limits.colourPerItem))
                }
              />
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-pattern`} className={labelClass}>
            Pattern
          </label>
          <select
            id={`${uid}-pattern`}
            value={fields.pattern}
            disabled={disabled}
            onChange={(event) => set("pattern", event.target.value as Pattern | "")}
            className={fieldClass}
          >
            <option value="">Not set</option>
            {patternValues.map((value) => (
              <option key={value} value={value}>
                {patternLabels[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-material`} className={labelClass}>
            Material
          </label>
          <select
            id={`${uid}-material`}
            value={fields.material}
            disabled={disabled}
            onChange={(event) => set("material", event.target.value as Material | "")}
            className={fieldClass}
          >
            <option value="">Not set</option>
            {materialValues.map((value) => (
              <option key={value} value={value}>
                {materialLabels[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-style`} className={labelClass}>
            Style
          </label>
          <select
            id={`${uid}-style`}
            value={fields.style}
            disabled={disabled}
            onChange={(event) => set("style", event.target.value as StyleName | "")}
            className={fieldClass}
          >
            <option value="">Not set</option>
            {styleValues.map((value) => (
              <option key={value} value={value}>
                {styleLabels[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset disabled={disabled}>
        <legend className={labelClass}>Seasons (leave empty for all year)</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {seasonValues.map((value) => (
            <Chip
              key={value}
              name={`${uid}-seasons`}
              value={value}
              label={seasonLabels[value]}
              checked={fields.seasons.includes(value)}
              onChange={() => set("seasons", toggle(fields.seasons, value))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className={labelClass}>Occasions</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {occasionValues.map((value) => (
            <Chip
              key={value}
              name={`${uid}-occasions`}
              value={value}
              label={occasionLabels[value]}
              checked={fields.occasions.includes(value)}
              onChange={() => set("occasions", toggle(fields.occasions, value))}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
