"use client";

import React, { useEffect, useState } from "react";
import { ArrowDown2, Crown1, Eye, Heart, Lock1, Messages2, SearchNormal1, Sms, Star1 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { useAccess } from "@/lib/verification";
import { USAGE_LABEL, useUsage } from "@/lib/usage";

/**
 * Plan & usage card — approved members on the Free plan.
 * Collapsed by default (saves space): one row with the plan badge, a small "left" pill per allowance,
 * Upgrade and a Details toggle. Expanded: limit alert, meters, reset date and what Gold unlocks.
 * The open / closed choice is remembered. Same pattern as the Gold / Platinum card (ProPlanCard).
 * Hidden for Gold / Platinum.
 */
const METERS: { kind: "profileViews" | "searches" | "interests" | "chats"; Icon: typeof Heart }[] = [
  { kind: "profileViews", Icon: Eye },
  { kind: "searches", Icon: SearchNormal1 },
  { kind: "interests", Icon: Heart },
  { kind: "chats", Icon: Messages2 },
];

/** Days until the monthly reset (from the API; 1st of next month otherwise) — the countdown under the title */
function resetInfo(resetsAt: string | null) {
  const now = new Date();
  const next = resetsAt ? new Date(resetsAt) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const days = Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 86_400_000));
  // the server's month starts at midnight UTC — show that date, not the local evening before it
  return { days, label: next.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) };
}
const GOLD = [
  { Icon: Eye, label: "Unlimited profile views" },
  { Icon: Messages2, label: "Unlimited new chats" },
  { Icon: Heart, label: "Unlimited interests" },
  { Icon: SearchNormal1, label: "Unlimited & advanced search" },
  { Icon: Sms, label: "Contact & WhatsApp sharing" },
  { Icon: Star1, label: "Horoscope matching" },
];

export function PlanUsageCard() {
  const { locked, isPaid } = useAccess();
  const { left, limit, usage, loaded } = useUsage();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      setOpen(localStorage.getItem("vk-usage-card-open") === "1");
    } catch {}
  }, []);
  const toggle = () =>
    setOpen((o) => {
      try {
        localStorage.setItem("vk-usage-card-open", o ? "0" : "1");
      } catch {}
      return !o;
    });
  if (locked || isPaid || !loaded) return null;

  const meters = METERS.filter(({ kind }) => limit(kind) !== null); // unlimited ones aren't metered
  const outMeter = meters.find(({ kind }) => left(kind) === 0);
  const outLabel = outMeter ? USAGE_LABEL[outMeter.kind] : null;
  const anyOut = Boolean(outMeter);
  const reset = resetInfo(usage.resetsAt);

  return (
    <section aria-label="Your plan and usage" className="kyc-in flex flex-col rounded-xl border border-premium-line bg-surface-card p-4 shadow-sm sm:px-6 sm:py-4">
      {/* summary row — always visible */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex h-7 items-center rounded-full bg-surface-muted px-3 text-label-sm text-ink-secondary">Free plan</span>
          <h2 className="text-h6 text-ink">This month’s usage</h2>
          <div className="flex flex-wrap gap-2">
            {meters.map(({ kind, Icon }) => {
              const l = left(kind);
              const out = l === 0;
              return (
                <span
                  key={kind}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-label-sm",
                    pillTone(l),
                  )}
                >
                  {out ? <Lock1 size={14} color="currentColor" /> : <Icon size={14} color="currentColor" />}
                  {USAGE_LABEL[kind].title} <b className="font-bold">{l}/{limit(kind)}</b>
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <ButtonLink href="/plans" size="sm" className="max-sm:flex-1" leftIcon={<Crown1 size={16} color="currentColor" />}>
            Upgrade
          </ButtonLink>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls="usage-details"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-button-sm text-ink-secondary ring-1 ring-inset ring-line-strong transition-colors hover:bg-brand-subtle hover:text-brand hover:ring-brand max-sm:flex-1 max-sm:justify-center"
          >
            {open ? "Hide details" : "Details"}
            <ArrowDown2 size={16} color="currentColor" className={cn("transition-transform duration-300", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* collapsible details — animates height with grid rows (same as ProPlanCard) */}
      <div id="usage-details" className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
      <div className="min-h-0 overflow-hidden" inert={!open}>
      <div className="flex flex-col gap-5 pb-1 pt-5">
      <p className="text-label-sm text-ink-tertiary">
        Resets in {reset.days} day{reset.days === 1 ? "" : "s"} · {reset.label}
      </p>

      {anyOut && outLabel && (
        <div className="flex animate-fade-up items-start gap-3 rounded-md bg-premium-bg px-4 py-3 text-body-sm text-premium-fg">
          <Lock1 size={18} color="currentColor" className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">{`You’ve used all your free ${outLabel.unit} this month`}</p>
            <p className="text-body-xs">{`They come back on ${reset.label}. Upgrade to Gold to keep going right now.`}</p>
          </div>
        </div>
      )}

      {/* meters */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {meters.map(({ kind, Icon }, i) => {
          const total = limit(kind) ?? 0;
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
                  style={{ width: `${total > 0 ? (l / total) * 100 : 0}%` }}
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
      </div>
      </div>
      </div>
    </section>
  );
}

/** Usage pill colour: used up · one left · plenty left. */
function pillTone(left: number) {
  if (left === 0) return "bg-error-bg text-error-fg";
  if (left === 1) return "bg-premium-bg text-premium-fg";
  return "bg-surface-subtle text-ink-secondary";
}
