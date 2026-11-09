"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "iconsax-react";
import { cn } from "@/lib/cn";

/**
 * Figma: Back Button (State = Default / Hover) — 44px circle, white with a
 * border; hover turns brand-subtle with a brand ring + icon. Goes back in
 * history, or to `fallback` when the page was opened directly.
 */
export function BackButton({
  fallback = "/dashboard",
  label = "Back",
  className,
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className={cn(
        "group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface-card text-ink shadow-xs",
        "transition-all duration-200 hover:border-brand hover:bg-brand-subtle hover:text-brand active:scale-95",
        "focus-visible:outline-none focus-visible:shadow-ring-brand",
        className
      )}
    >
      <ArrowLeft size={20} color="currentColor" className="transition-transform duration-200 group-hover:-translate-x-0.5" />
    </button>
  );
}
