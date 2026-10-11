"use client";

import { useId, useState } from "react";

type PasswordFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  describedBy?: string;
  disabled?: boolean;
};

// A password input with a show/hide button, so typos are easy to spot and fix.
export function PasswordField({
  label = "Password",
  value,
  onChange,
  autoComplete,
  describedBy,
  disabled,
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="text-sm text-stone">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className="block min-h-12 w-full border border-sand bg-soft-white py-2 pl-3 pr-20 text-base"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 min-w-16 px-3 text-sm underline underline-offset-4"
        >
          {visible ? "Hide" : "Show"}
          <span className="sr-only"> password</span>
        </button>
      </div>
    </div>
  );
}
