import React from "react";
import { cn } from "@/lib/cn";

/** Filled round status icons used by Toast and Alert (Figma: vuesax/bold status icons). */
export type StatusType = "success" | "error" | "warning" | "info";

const fill: Record<StatusType, string> = {
  success: "fill-success-fg",
  error: "fill-error-fg",
  warning: "fill-warning-fg",
  info: "fill-info-fg",
};

export function StatusIcon({ type, size = 20, className }: { type: StatusType; size?: number; className?: string }) {
  const mark = "stroke-white";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn("shrink-0", className)} aria-hidden>
      {type === "warning" ? (
        <>
          <path className={fill[type]} d="M12 2.8c.7 0 1.3.4 1.7 1l8.4 14.6c.8 1.3-.2 3-1.7 3H3.6c-1.5 0-2.5-1.7-1.7-3L10.3 3.8c.4-.6 1-1 1.7-1z" />
          <path className={mark} d="M12 9v4.5M12 16.8v.2" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle className={fill[type]} cx="12" cy="12" r="10" />
          {type === "success" && <path className={mark} d="M7.5 12.2l3 3 6-6.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          {type === "error" && <path className={mark} d="M9 9l6 6M15 9l-6 6" strokeWidth="2" strokeLinecap="round" />}
          {type === "info" && <path className={mark} d="M12 11v5.5M12 7.6v.2" strokeWidth="2.2" strokeLinecap="round" />}
        </>
      )}
    </svg>
  );
}
