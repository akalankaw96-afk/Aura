import React from "react";
import { Heart, ShieldTick, TickCircle, User, UserAdd } from "iconsax-react";
import { cn } from "@/lib/cn";

/**
 * Figma: Stepper (Step = 1 / 2 / 3 / 4 / Complete)
 * Same width as the form card (680px). The filled track grows with progress
 * and ends in a small "tip" dot in front of the current step.
 */
const STEPS = [
  { title: "Account", sub: "Mobile & password", Icon: UserAdd },
  { title: "Verify", sub: "OTP code", Icon: ShieldTick },
  { title: "Profile", sub: "About you", Icon: User },
  { title: "Photos", sub: "Add your best", Icon: Heart },
];

export interface StepperProps {
  /** 1–4, or 5 for Complete */
  step: number;
  className?: string;
}

export function Stepper({ step, className }: StepperProps) {
  const n = STEPS.length;
  const done = Math.min(step - 1, n);
  // track runs between first and last node centres
  const pct = step > n ? 100 : ((step - 1) / (n - 1)) * 100 + (step < n ? 100 / (n - 1) / 2 : 0);

  return (
    <nav aria-label="Registration progress" className={cn("w-full rounded-xl border border-line bg-surface-card px-4 pb-4 pt-5 shadow-sm sm:px-6", className)}>
      <div className="relative">
        {/* track */}
        <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1.5 -translate-y-1/2 rounded-full bg-surface-muted">
          <div className="relative h-full rounded-full bg-brand-gradient transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }}>
            {step <= n && (
              <span className="absolute -right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-[3px] border-brand bg-surface-card" />
            )}
          </div>
        </div>
        <ol className="relative grid grid-cols-4">
          {STEPS.map((s, i) => {
            const idx = i + 1;
            const isDone = idx <= done;
            const isCurrent = idx === step;
            return (
              <li key={s.title} className="flex flex-col items-center text-center" aria-current={isCurrent ? "step" : undefined}>
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isDone && "border-brand-strong bg-brand-gradient text-white",
                    isCurrent && "border-brand bg-brand-subtle text-brand ring-4 ring-brand-ring",
                    !isDone && !isCurrent && "border-line-strong bg-surface-card text-ink-tertiary"
                  )}
                >
                  {isDone ? <TickCircle size={20} color="currentColor" /> : <s.Icon size={18} color="currentColor" />}
                </span>
                <span className={cn("mt-2 text-label-md", isCurrent ? "text-brand-text" : isDone ? "text-ink" : "text-ink-secondary")}>{s.title}</span>
                <span className={cn("mt-0.5 hidden text-body-xs sm:block", isDone ? "text-success-fg" : "text-ink-tertiary")}>
                  {isDone ? "Done" : s.sub}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
