"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowDown2,
  Calendar,
  Crown1,
  Eye,
  Heart,
  Lock1,
  Messages2,
  Profile2User,
  Ranking,
  SearchNormal1,
  ShieldTick,
  Sms,
  Star1,
  TickCircle,
  Timer1,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { readMembership, useAccess } from "@/lib/verification";

/**
 * Pro membership card — approved Gold / Platinum members (replaces the Free usage card).
 * Plan badge, Active status, valid-until date with days left + period bar,
 * unlimited allowances, and every feature the plan includes (Platinum extras
 * shown locked for Gold, with an upgrade link). Renew when ≤ 7 days left.
 */
type Feature = { Icon: typeof Heart; label: string; platinum?: boolean };
const FEATURES: Feature[] = [
  { Icon: Messages2, label: "Unlimited messages" },
  { Icon: Heart, label: "Unlimited interests" },
  { Icon: SearchNormal1, label: "Unlimited & advanced search" },
  { Icon: Eye, label: "See who viewed & shortlisted you" },
  { Icon: Sms, label: "Contact & WhatsApp after acceptance" },
  { Icon: Star1, label: "Horoscope matching" },
  { Icon: Ranking, label: "Highlighted in search" },
  { Icon: Profile2User, label: "Dedicated matchmaker", platinum: true },
  { Icon: Crown1, label: "Hand-picked weekly matches", platinum: true },
  { Icon: ShieldTick, label: "Priority verification", platinum: true },
];
const ALLOWANCES = [
  { Icon: Messages2, label: "Messages" },
  { Icon: SearchNormal1, label: "Searches" },
  { Icon: Heart, label: "Interests" },
];

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function ProPlanCard() {
  const { locked, isPaid, plan } = useAccess();
  const [m, setM] = useState<ReturnType<typeof readMembership>>(null);
  const [bar, setBar] = useState(0);
  // collapsed by default to save space — the choice is remembered
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      setOpen(localStorage.getItem("vk-plan-card-open") === "1");
    } catch {}
  }, []);
  const toggle = () =>
    setOpen((o) => {
      try {
        localStorage.setItem("vk-plan-card-open", o ? "0" : "1");
      } catch {}
      return !o;
    });

  useEffect(() => {
    let t = 0;
    const update = () => {
      const next = readMembership();
      setM(next);
      setBar(0);
      if (!next) return;
      const used = Math.max(3, Math.min(100, Math.round(((next.totalDays - next.daysLeft) / next.totalDays) * 100)));
      window.clearTimeout(t);
      t = window.setTimeout(() => setBar(used), 250);
    };
    update();
    window.addEventListener("vk-plan-change", update);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("vk-plan-change", update);
    };
  }, [plan]);

  if (locked || !isPaid || !m) return null;

  const platinum = m.plan === "platinum";
  const name = platinum ? "Platinum" : "Gold";
  const soon = m.daysLeft <= 7;
  const included = FEATURES.filter((f) => platinum || !f.platinum);
  const extras = platinum ? [] : FEATURES.filter((f) => f.platinum);

  return (
    <section aria-label={`${name} membership`} className="kyc-in overflow-hidden rounded-xl border border-premium-line bg-surface-card shadow-sm">
      {/* Header — premium band */}
      <div className="relative isolate flex flex-col gap-4 overflow-hidden bg-[linear-gradient(120deg,var(--gold-900)_0%,var(--gold-700)_55%,var(--gold-500)_100%)] dark:bg-[image:var(--gradient-premium-band)] p-4 text-white sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:gap-5">
        <Crown1 aria-hidden size={180} color="currentColor" className="pointer-events-none absolute -right-6 -top-10 -z-10 text-white opacity-10" />

        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="kyc-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-premium-fg shadow-lg ring-4 ring-[rgba(255,255,255,0.25)]">
            <Crown1 size={24} color="currentColor" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h5 text-white">{name} member</h2>
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[rgba(255,255,255,0.2)] px-2.5 text-label-sm text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-gold-300" /> Active
              </span>
            </div>
            <p className="text-body-sm text-[rgba(255,255,255,0.8)]">
              {m.months}-month plan · Member since {fmt(m.start)}
            </p>
          </div>
        </div>

        {/* Valid until + period bar */}
        <div className="flex w-full flex-col gap-2 rounded-lg bg-[rgba(255,255,255,0.14)] px-4 py-3 backdrop-blur-[8px] lg:w-[320px]">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-label-md">
              <Calendar size={18} color="currentColor" /> Valid until
            </span>
            <span className="text-h6">{fmt(m.expires)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.25)]" role="progressbar" aria-label="Plan period used" aria-valuenow={bar} aria-valuemin={0} aria-valuemax={100}>
            <div className={cn("h-full rounded-full transition-[width] duration-1000 ease-out", soon ? "bg-white" : "bg-gold-300")} style={{ width: `${bar}%` }} />
          </div>
          <p className="flex items-center gap-1.5 text-body-xs text-[rgba(255,255,255,0.85)]">
            <Timer1 size={14} color="currentColor" />
            {m.daysLeft === 0 ? "Expires today" : `${m.daysLeft} day${m.daysLeft === 1 ? "" : "s"} left`} · Plans don’t auto-renew
          </p>
        </div>
        {/* expand / collapse plan details */}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls="plan-details"
          className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.16)] px-4 text-button-sm text-white ring-1 ring-inset ring-[rgba(255,255,255,0.35)] transition-colors hover:bg-[rgba(255,255,255,0.26)] max-lg:w-full"
        >
          {open ? "Hide details" : "Plan details"}
          <ArrowDown2 size={16} color="currentColor" className={cn("transition-transform duration-300", open && "rotate-180")} />
        </button>
      </div>

      {/* renew reminder stays visible even when collapsed */}
      {soon && (
        <div className={cn(
          "mx-4 mt-4 flex flex-col gap-3 rounded-lg border border-premium-line bg-premium-bg px-4 py-3 text-body-sm text-premium-fg sm:mx-6 sm:flex-row sm:items-center",
          !open && "mb-4",
        )}>
          <p className="flex min-w-0 flex-1 items-center gap-3">
            <Timer1 size={18} color="currentColor" className="shrink-0" />
            <span>Your {name} plan ends on {fmt(m.expires)}. Renew now to keep every feature.</span>
          </p>
          <ButtonLink href="/plans" size="sm" className="self-start sm:shrink-0 sm:self-auto">
            Renew now
          </ButtonLink>
        </div>
      )}

      {/* collapsible details — animates height with grid rows */}
      <div id="plan-details" className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
      <div className="min-h-0 overflow-hidden" inert={!open}>
      <div className="flex flex-col gap-5 p-5 sm:p-6">

        {/* Allowances — all unlimited */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {ALLOWANCES.map(({ Icon, label }, i) => (
            <div key={label} className="flex flex-col items-start gap-2 rounded-[16px] border border-premium-line bg-premium-bg p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4" style={{ animation: `fade-up 400ms ease-out ${i * 70}ms backwards` }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-card text-premium-fg">
                <Icon size={20} color="currentColor" />
              </span>
              <span className="flex flex-col">
                <span className="text-label-md text-ink">{label}</span>
                <span className="text-label-lg text-premium-fg sm:text-h6">Unlimited</span>
              </span>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="flex flex-col gap-3">
          <h3 className="text-label-lg text-ink">Included in your {name} plan</h3>
          <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {included.map(({ Icon, label }, i) => (
              <li key={label} className="flex items-center gap-2.5 text-body-sm text-ink" style={{ animation: `fade-up 400ms ease-out ${150 + i * 40}ms backwards` }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-premium-bg text-premium-fg">
                  <Icon size={16} color="currentColor" />
                </span>
                <span className="flex-1">{label}</span>
                <TickCircle size={18} color="currentColor" variant="Bold" className="shrink-0 text-success-fg" />
              </li>
            ))}
          </ul>
        </div>

        {extras.length > 0 && (
          <div className="flex flex-col gap-3 rounded-[16px] border border-dashed border-line-strong bg-surface-subtle p-4">
            <p className="flex items-center gap-2 text-label-md text-ink-secondary">
              <Lock1 size={16} color="currentColor" /> With Platinum
            </p>
            <ul className="flex flex-wrap gap-2">
              {extras.map(({ Icon, label }) => (
                <li key={label} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-card px-3 text-body-sm text-ink-tertiary ring-1 ring-inset ring-line">
                  <Icon size={14} color="currentColor" /> {label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <p className="min-w-[200px] flex-1 text-body-sm text-ink-tertiary">
            Paid {fmt(m.start)} · Renew any time to add {m.months} more month{m.months > 1 ? "s" : ""} from {fmt(m.expires)}.
          </p>
          {!platinum && (
            <ButtonLink href="/plans" variant="secondary" size="md" leftIcon={<Crown1 size={18} color="currentColor" />}>
              Upgrade to Platinum
            </ButtonLink>
          )}
          <ButtonLink href="/plans" size="md">
            {soon ? "Renew now" : "Extend plan"}
          </ButtonLink>
        </div>
      </div>
      </div>
      </div>
    </section>
  );
}
