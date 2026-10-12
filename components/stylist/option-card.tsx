"use client";

type OptionCardProps = {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  // Optional visual: a swatch row, or a tint behind the card.
  visual?: React.ReactNode;
  tint?: string;
};

/*
  A large, fully tappable answer card. The real radio button or checkbox stays in
  the page (visually hidden), so keyboards and screen readers work natively, and
  the whole card is the label.
*/
export function OptionCard({
  type,
  name,
  value,
  label,
  hint,
  checked,
  disabled = false,
  onChange,
  visual,
  tint,
}: OptionCardProps) {
  return (
    <label className="block cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={`relative flex min-h-24 h-full flex-col justify-end gap-1 border p-4 transition-colors duration-200 hover:border-espresso/50 peer-checked:border-espresso peer-checked:bg-espresso peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso ${
          tint ?? "bg-soft-white"
        } border-sand`}
      >
        {visual}
        <span className="font-display text-xl leading-6">{label}</span>
        {hint && <span className="text-xs leading-5 opacity-75">{hint}</span>}
        {/* A clear selected mark that does not depend on colour alone. */}
        <span
          aria-hidden="true"
          className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center border text-xs ${
            checked ? "border-ivory bg-ivory text-espresso" : "border-espresso/30 text-transparent"
          }`}
        >
          ✓
        </span>
      </span>
    </label>
  );
}
