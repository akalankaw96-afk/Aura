"use client";

import React from "react";
import { Crown1, Eye, Heart, Lock1, Messages2, SearchNormal1, Sms, Star1 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { useAccess } from "@/lib/verification";
import { FREE_LIMITS, USAGE_LABEL, useUsage, type UsageKind } from "@/lib/usage";

/**
 * Plan & usage card — approved members on the Free plan.
 * Shows the monthly search and profile-view allowances as meters,
 * what Gold unlocks, and an Upgrade button. Hidden for Gold / Platinum.
 */
const METERS: { kind: UsageKind; Icon: typeof Heart }[] = [
  { kind: "profileViews", Icon: Eye },
  { kind: "searches", Icon: SearchNormal1 },
];

/** Days until the monthly reset (1st of next month) — the countdown under the title */
function resetInfo() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const days = Math.ceil((next.getTime() - now.getTime()) / 86_400_000);
  return { days, label: next.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) };
}
const GOLD = [
  { Icon: Eye, label: "Unlimited profile views" },
  { Icon: Messages2, label: "Unlimited chat connections" },
  { Icon: Heart, label: "Unlimited interests" },
  { Icon: SearchNormal1, label: "Unlimited & advanced search" },
  { Icon: Sms, label: "Contact & WhatsApp sharing" },
  { Icon: Star1, label: "Horoscope matching" },
];

export function PlanUsageCard() {
  const { locked, isPaid } = useAccess();
  const { left } = useUsage();
  if (locked || isPaid) return null;

  const outMeter = METERS.find(({ kind }) => left(kind) === 0);
  const outLabel = outMeter ? USAGE_LABEL[outMeter.kind] : null;
  const anyOut = Boolean(outMeter);
  const reset = resetInfo();

  return (
    <section aria-label="Your plan and usage" className="kyc-in flex flex-col gap-5 rounded-xl border border-premium-line bg-surface-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-7 items-center rounded-full bg-surface-muted px-3 text-label-sm text-ink-secondary">Free plan</span>
        <h2 className="flex-1 text-h5 text-ink">This month’s usage</h2>
        <span className="text-label-sm text-ink-tertiary max-sm:w-full">
          Resets in {reset.days} day{reset.days === 1 ? "" : "s"} · {reset.label}
        </span>
      </div>

      {anyOut && outLabel && (
        <div className="flex animate-fade-up items-start gap-3 rounded-md bg-premium-bg px-4 py-3 text-body-sm text-premium-fg">
          <Lock1 size={18} color="currentColor" className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">{outLabel.limitReachedTitle || `You’ve used all your free ${outLabel.title.toLowerCase()}`}</p>
            <p className="text-body-xs">{outLabel.limitReachedMsg || "You’ve reached a free limit. Upgrade to keep exploring."}</p>
          </div>
        </div>
      )}

      {/* meters */}
      <div className="grid grid-cols-2 gap-3">
        {METERS.map(({ kind, Icon }, i) => {
          const total = FREE_LIMITS[kind];
          const l = left(kind);
          const out = l === 0;
          const low = l === 1;
          return (
            <div
              key={kind}
              className={cn("flex flex-col gap-2.5 rounded-md border p-4 transition-colors", out ? "border-error-bg bg-error-bg" : "border-line bg-surface-subtle")}
              style={{ animation: `fade-up 420ms cubic-bezier(0.22,1,0.36,1) ${i * 70}ms backwards` }}
            >
              <div className="flex items-center gap-2">
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", out ? "bg-surface-card text-error-fg" : "bg-brand-subtle text-brand")}>
                  <Icon size={16} color="currentColor" />
                </span>
                <span className="min-w-0 flex-1 text-label-md text-ink">{USAGE_LABEL[kind].title}</span>
                {out ? (
                  <span aria-label="Limit reached" className="inline-flex h-6 max-sm:hidden items-center gap-1 rounded-full bg-surface-card px-2 text-label-sm text-error-fg">
                    <Lock1 size={12} color="currentColor" /> Limit reached
                  </span>
                ) : null}
              </div>
              {/* countdown: what's left this month */}
              <p className="text-body-sm text-ink-secondary">
                <b key={l} className={cn("inline-block animate-pop-in text-h4", out ? "text-error-fg" : low ? "text-premium-fg" : "text-ink")}>{l}</b> of {total} left
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-surface-card" role="progressbar" aria-label={`${USAGE_LABEL[kind].title} left`} aria-valuenow={l} aria-valuemin={0} aria-valuemax={total}>
                <div
                  className={cn("h-full rounded-full transition-[width] duration-700 ease-out", out ? "bg-error-fg" : low ? "bg-premium-fg" : "bg-brand-gradient")}
                  // countdown bar: shrinks as the allowance is used
                  style={{ width: `${(l / total) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* gold perks + upgrade */}
      <div className="flex flex-col gap-4 rounded-md bg-premium-bg p-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <p className="mb-2.5 flex items-center gap-1.5 text-label-md text-premium-fg">
            <Crown1 size={16} color="currentColor" /> Gold removes every limit
          </p>
          <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
            {GOLD.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-body-sm text-ink">
                <Icon size={16} color="currentColor" className="shrink-0 text-premium-fg" />
                <span className="truncate">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <ButtonLink href="/plans" size="md" className="shrink-0" leftIcon={<Crown1 size={18} color="currentColor" />}>
          Upgrade to Gold
        </ButtonLink>
      </div>

    </section>
  );
}
