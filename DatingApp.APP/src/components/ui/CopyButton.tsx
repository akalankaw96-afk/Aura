"use client";

import React, { useState } from "react";
import { Copy, CopySuccess } from "iconsax-react";
import { cn } from "@/lib/cn";
import { useToast } from "./Toast";

/**
 * Copy to clipboard with a toast ("Account number copied") and a 1.8 s "Copied" state on the button.
 * `copied` is the key of the last copied value, so one hook can drive many buttons.
 */
export function useCopy() {
  const toast = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      toast.error("Couldn’t copy", `Select the ${label.toLowerCase()} and copy it yourself.`);
      return;
    }
    setCopied(key);
    toast.success(`${label} copied`);
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
  };
  return { copied, copy };
}

function tone(onBrand: boolean, done: boolean) {
  if (onBrand) {
    return done ? "bg-white text-success-fg" : "bg-[rgba(255,255,255,0.18)] text-white ring-1 ring-inset ring-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.28)]";
  }
  return done ? "bg-success-bg text-success-fg" : "bg-brand-subtle text-brand-text hover:bg-brand hover:text-ink-on-brand";
}

/** Small "Copy" pill. `onBrand` for the dark wine cards (payment, support). */
export function CopyButton({ done, onClick, label, onBrand = false }: Readonly<{ done: boolean; onClick: () => void; label: string; onBrand?: boolean }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-label-sm transition-[background-color,color,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:shadow-ring-brand",
        tone(onBrand, done),
      )}
    >
      {done ? <CopySuccess size={16} color="currentColor" /> : <Copy size={16} color="currentColor" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}
