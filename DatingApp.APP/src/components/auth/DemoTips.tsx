"use client";

import React, { useState } from "react";
import { Lamp, CloseCircle } from "iconsax-react";
import { cn } from "@/lib/cn";

/**
 * Small floating "Demo tips" panel. Because there is no API, this tells
 * testers which values trigger each error / success state, and can offer
 * shortcut actions (e.g. "Simulate admin approval").
 * Remove it (or hide with NEXT_PUBLIC_HIDE_DEMO=1) when the API is connected.
 */
export interface DemoTip {
  label: string;
  value?: string;
}
export interface DemoAction {
  label: string;
  onClick: () => void;
}

export function DemoTips({ tips, actions }: { tips: DemoTip[]; actions?: DemoAction[] }) {
  const [open, setOpen] = useState(false);
  if (process.env.NEXT_PUBLIC_HIDE_DEMO === "1") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 ">
      {open ? (
        <div className="w-[300px] animate-fade-up rounded-lg border border-line bg-surface-card p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-body-sm font-bold text-ink">Demo tips (no API)</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close tips" className="text-ink-tertiary hover:text-ink">
              <CloseCircle size={20} color="currentColor" />
            </button>
          </div>
          <ul className="space-y-1.5 text-body-xs text-ink-secondary">
            {tips.map((t) => (
              <li key={t.label} className="flex justify-between gap-3">
                <span>{t.label}</span>
                {t.value && <code className="shrink-0 rounded bg-surface-muted px-1.5 font-semibold text-ink">{t.value}</code>}
              </li>
            ))}
          </ul>
          {actions && actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
              {actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={a.onClick}
                  className="rounded-full bg-brand-subtle px-3 py-1.5 text-body-xs font-bold text-brand hover:bg-brand hover:text-white"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          aria-label="Demo tips"
          onClick={() => setOpen(true)}
          className={cn("flex h-10 items-center gap-2 rounded-full border border-line bg-surface-card px-4 text-body-sm font-bold text-ink shadow-lg hover:border-brand hover:text-brand")}
        >
          <Lamp size={18} color="currentColor" className="text-brand" />
          <span className="hidden sm:inline">Demo tips</span>
        </button>
      )}
    </div>
  );
}
