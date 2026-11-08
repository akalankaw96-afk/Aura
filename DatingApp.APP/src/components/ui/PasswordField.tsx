"use client";

import React, { useId, useState } from "react";
import { Eye, EyeSlash, Key } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Field, controlShell } from "./Field";

/**
 * Figma: Password Field (State = Default / Focus / Error)
 * Key icon, show/hide toggle, optional 4-segment strength meter.
 */
export type Strength = 0 | 1 | 2 | 3 | 4;

/** 0 empty, 1 too short, 2 weak, 3 good, 4 strong */
export function passwordStrength(pw: string): Strength {
  if (!pw) return 0;
  if (pw.length < 6) return 1;
  let score = 1;
  if (/\d/.test(pw)) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (pw.length >= 10 || /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score) as Strength;
}

export const isPasswordAcceptable = (pw: string) => pw.length >= 6 && /\d/.test(pw);

const strengthMeta: Record<Strength, { label: string; color: string; text: string }> = {
  0: { label: "", color: "bg-line", text: "" },
  1: { label: "Too short", color: "bg-error-line", text: "text-error-fg" },
  2: { label: "Weak", color: "bg-warning-fg", text: "text-warning-fg" },
  3: { label: "Good", color: "bg-success-fg", text: "text-success-fg" },
  4: { label: "Strong", color: "bg-success-fg", text: "text-success-fg" },
};

export interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "size"> {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  showStrength?: boolean;
}

export function PasswordField({
  label = "Password",
  value,
  onChange,
  helper,
  error,
  showStrength,
  placeholder = "Enter a password",
  disabled,
  ...rest
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const s = passwordStrength(value);
  const meta = strengthMeta[s];
  const filled = s === 0 ? 0 : s === 1 ? 1 : s;

  return (
    <Field label={label} htmlFor={id} helper={helper} error={error}>
      <div className={controlShell({ error: !!error, disabled })}>
        <Key size={20} color="currentColor" className={cn("shrink-0", value ? "text-brand" : "text-ink-tertiary")} />
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          aria-invalid={!!error}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full min-w-0 bg-transparent text-body-lg text-ink outline-none"
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="flex shrink-0 text-brand"
        >
          {visible ? <EyeSlash size={20} color="currentColor" /> : <Eye size={20} color="currentColor" />}
        </button>
      </div>
      {showStrength && (
        <div className="flex items-center gap-2" aria-live="polite">
          <div className="grid flex-1 grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-colors",
                  i <= filled ? (s === 1 ? (i === 1 ? meta.color : "bg-line") : meta.color) : "bg-line"
                )}
              />
            ))}
          </div>
          <span className={cn("w-16 text-right text-body-xs font-semibold", meta.text)}>{meta.label}</span>
        </div>
      )}
    </Field>
  );
}
