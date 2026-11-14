import React from "react";
import { cn } from "@/lib/cn";

export type PinNoteTone = "rose" | "gold";

/**
 * Figma: Note — white paper card (radius xl, shadow lg) with a push-pin on top and a tinted panel inside.
 * Used by Home "How it works" and the How-to-use tour. The panel is always light (paper),
 * so content inside should use fixed light-paper colours (gray-900 / gray-600), not theme text tokens.
 */
export function PinNote({
  tone = "rose",
  className,
  panelClassName,
  style,
  children,
}: {
  tone?: PinNoteTone;
  className?: string;
  panelClassName?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const rose = tone === "rose";
  return (
    <div className={className} style={style}>
      <div className="relative rounded-xl border border-line bg-surface-card px-3 pb-3 pt-9 shadow-lg">
        {/* Pin */}
        <span aria-hidden className="absolute left-1/2 top-[-8px] h-[40px] w-9 -translate-x-1/2">
          <span className="absolute left-3 top-[30px] h-2 w-[18px] rounded-full bg-rose-950 opacity-25 blur-[2px]" />
          <span
            className="absolute left-[3px] top-0 h-[30px] w-[30px] rounded-full shadow-sm"
            style={{
              background: rose
                ? "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, var(--rose-600) 35%, var(--rose-800) 100%)"
                : "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, var(--gold-500) 35%, var(--gold-700) 100%)",
            }}
          />
        </span>
        <div
          className={cn(
            "flex flex-col gap-2.5 rounded-md p-5",
            rose
              ? "bg-[linear-gradient(180deg,var(--rose-100),var(--rose-50))] dark:bg-[image:var(--gradient-note-rose)] dark:ring-1 dark:ring-inset dark:ring-rose-900"
              : "bg-[linear-gradient(180deg,var(--gold-100),var(--gold-50))] dark:bg-[image:var(--gradient-note-gold)] dark:ring-1 dark:ring-inset dark:ring-gold-900",
            panelClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
