"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
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
      <div className="relative isolate flex flex-col gap-5 overflow-hidden bg-[linear-gradient(120deg,var(--gold-900)_0%,var(--gold-700)_55%,var(--gold-500)_100%)] p-5 text-white sm:p-6 lg:flex-row lg:items-center">
        <Crown1 aria-hidden size={180} color="currentColor" className="pointer-events-none absolute -right-6 -top-10 -z-10 text-white opacity-10" />

        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="kyc-pop flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-premium-fg shadow-lg ring-4 ring-[rgba(255,255,255,0.25)]">
            <Crown1 size={28} color="currentColor" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h4 text-white">{name} member</h2>
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
        <div className="flex w-full flex-col gap-2 rounded-lg bg-[rgba(255,255,255,0.14)] p-4 backdrop-blur-[8px] lg:w-[340px]">
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
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {soon && (
          <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-premium-line bg-premium-bg px-4 py-3 text-body-sm text-premium-fg">
            <Timer1 size={18} color="currentColor" />
            <span className="flex-1">Your {name} plan ends on {fmt(m.expires)}. Renew now to keep every feature.</span>
            <Link href="/plans" className="font-bold underline-offset-2 hover:underline">
              Renew
            </Link>
          </div>
        )}

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
            <Link href="/plans" className="flex h-11 items-center gap-2 rounded-full bg-brand-subtle px-5 text-button-md text-brand-text ring-1 ring-inset ring-brand transition-colors hover:bg-brand hover:text-white">
              <Crown1 size={18} color="currentColor" /> Upgrade to Platinum
            </Link>
          )}
          <Link href="/plans" className="flex h-11 items-center gap-2 rounded-full bg-brand-gradient px-6 text-button-md text-ink-on-brand transition-shadow hover:shadow-glow">
            {soon ? "Renew now" : "Extend plan"}
          </Link>
        </div>
      </div>
    </section>
  );
}
