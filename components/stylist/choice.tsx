type ChoiceProps = {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
};

// A native radio button or checkbox drawn as a selectable tile. The real input stays
// in the page (visually hidden), so keyboard and screen-reader behaviour is built in.
export function Choice({
  type,
  name,
  value,
  label,
  hint,
  checked,
  disabled = false,
  onChange,
}: ChoiceProps) {
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
      <span className="flex min-h-12 flex-col justify-center border border-sand bg-soft-white px-4 py-2 text-sm transition-colors duration-200 hover:border-espresso/50 peer-checked:border-espresso peer-checked:bg-espresso peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso">
        <span className="font-medium">{label}</span>
        {hint && (
          <span className="text-xs opacity-75">{hint}</span>
        )}
      </span>
    </label>
  );
}
