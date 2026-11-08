"use client";

import React, { useId } from "react";
import { cn } from "@/lib/cn";
import { Field, controlShell } from "./Field";

/** Figma: Input (Type = Text, State = Default / Hover / Focus / Error / Disabled) */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, helper, error, icon, trailing, containerClassName, className, disabled, id, ...rest }, ref) => {
    const auto = useId();
    const inputId = id ?? auto;
    return (
      <Field label={label} hint={hint} htmlFor={inputId} helper={helper} error={error} className={containerClassName}>
        <div className={controlShell({ error: !!error, disabled })}>
          {icon && <span className="flex shrink-0 text-ink-tertiary">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              "h-full w-full min-w-0 bg-transparent text-body-md text-ink outline-none disabled:cursor-not-allowed",
              className
            )}
            {...rest}
          />
          {trailing}
        </div>
      </Field>
    );
  }
);
Input.displayName = "Input";

// Select (Figma: Input Type = Select + Dropdown Menu) lives in ./Select.tsx
export { Select } from "./Select";
export type { SelectProps, SelectOption } from "./Select";
