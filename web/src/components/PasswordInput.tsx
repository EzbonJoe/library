"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  value,
  onChange,
  required,
  minLength,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        minLength={minLength}
        className="w-full rounded-lg border border-line bg-panel px-4 py-3 pr-11 text-base font-normal text-ink"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted"
      >
        {/* gz-tooltip's own nested span, not the button itself — .gz-tooltip
            sets position:relative in plain CSS, which (thanks to Tailwind
            v4's utilities living in a low-priority @layer) would silently
            beat the button's `absolute` utility class if applied directly
            to the same element, undoing its placement over the input. */}
        <span className="gz-tooltip">
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          <span className="gz-tooltip-bubble" aria-hidden="true">
            {visible ? "Hide password" : "Show password"}
          </span>
        </span>
      </button>
    </div>
  );
}
