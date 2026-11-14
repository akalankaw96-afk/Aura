"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight2,
  Call,
  Chart,
  Crown1,
  Edit2,
  Flag,
  Heart,
  Home2,
  Location,
  Login,
  Lovely,
  Messages2,
  People,
  SearchNormal1,
  Send2,
  ShieldTick,
  Star1,
  TickCircle,
  UserAdd,
  Verify,
} from "iconsax-react";
import { MemberShell } from "@/components/layout/MemberShell";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PinNote } from "@/components/ui/PinNote";
import { BrandBandDecor, SignUp } from "@/components/sections/home/SignUp";
import { useLanguage } from "@/context/LanguageContext";
import { useSignedIn } from "@/lib/session";
import { cn } from "@/lib/cn";
import { HOW_TO_USE, type Shot, type Status, type TourItem } from "@/content/howToUse";

/**
 * How to use — /how-to-use (public, also linked from the member profile menu).
 * 1. Journey: six steps; tap a step → its real phone screen + the statuses you'll meet.
 * 2. The full tour: every feature grouped (account · finding · connecting · plans) with screens and "Find it in".
 * 3. Closing call to action (guest: Login / Create New · member: dashboard / search).
 */
export function HowToUseScreen() {
  const { lang } = useLanguage();
  const c = HOW_TO_USE[lang] ?? HOW_TO_USE.en;
  const signedIn = useSignedIn();

  return (
    <MemberShell
      publicPage
      back={signedIn ? "/dashboard" : "/"}
      crumb={c.crumb}
      title={c.title}
      subtitle={c.subtitle}
    >
      {/* trust chips + jump link */}
      <div className="flex flex-wrap items-center gap-2">
        <TrustChip Icon={Verify}>{c.trust[0]}</TrustChip>
        <TrustChip Icon={ShieldTick}>{c.trust[1]}</TrustChip>
        <TrustChip Icon={Location}>{c.trust[2]}</TrustChip>
        <a href="#tour" className="ml-auto inline-flex items-center gap-1.5 text-label-md text-brand-text hover:underline">
          {c.tourLink}
          <ArrowDown size={16} color="currentColor" />
        </a>
      </div>

      <Journey />

      {/* The full tour */}
      <section id="tour" aria-labelledby="tour-title" className="flex scroll-mt-24 flex-col gap-10 pt-6 lg:gap-14 lg:pt-10">
        <SectionHeader eyebrow={c.tourEyebrow} title={c.tourTitle} description={c.tourText} />
        {c.groups.map((group, gi) => (
          <div key={group.id} className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <p className="text-overline uppercase text-brand-text">{group.title}</p>
              <p className="text-body-md text-ink-secondary">{group.description}</p>
            </div>
            <div className="flex flex-col gap-16 lg:gap-20">
              {group.items.map((item, ii) => (
                <TourCard
                  key={item.id}
                  item={item}
                  index={c.groups.slice(0, gi).reduce((n, g) => n + g.items.length, 0) + ii}
                  whereLabel={c.whereLabel}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Closing CTA — the same band as the home page "Ready to meet your life partner?" */}
      {signedIn ? (
        <section className="pt-6 lg:pt-10">
          <div className="relative isolate overflow-hidden rounded-2xl bg-brand-gradient p-6 sm:p-10 lg:p-20">
            <BrandBandDecor />
            <div className="flex max-w-[620px] flex-col gap-5 text-ink-on-brand">
              <p className="text-overline uppercase">{c.journeyEyebrow}</p>
              <h2 className="text-h2 lg:text-display-lg">{c.ctaMemberTitle}</h2>
              <p className="text-body-md lg:text-body-lg">{c.ctaMemberText}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <ButtonLink href="/dashboard" variant="white">
                  {c.dashboard}
                </ButtonLink>
                <ButtonLink href="/search" variant="ghost" className="border border-ink-on-brand text-ink-on-brand hover:bg-surface-glass">
                  {c.search}
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <SignUp embedded />
      )}
    </MemberShell>
  );
}

/* ── Journey: step list + phone ─────────────────────────────────── */
function Journey() {
  const { lang } = useLanguage();
  const c = HOW_TO_USE[lang] ?? HOW_TO_USE.en;
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = c.steps[active];

  const onKey = (e: React.KeyboardEvent) => {
    const n = c.steps.length;
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? (active + 1) % n : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (active - 1 + n) % n : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section className="flex flex-col gap-8 pt-4 lg:pt-8">
      <SectionHeader eyebrow={c.journeyEyebrow} title={c.journeyTitle} description={c.journeyText} />
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
        {/* steps */}
        <div role="tablist" aria-orientation="vertical" aria-label={c.journeyTitle} onKeyDown={onKey} className="flex flex-col gap-2">
          {c.steps.map((s, i) => {
            const on = i === active;
            return (
              <React.Fragment key={s.id}>
              <button
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`step-tab-${s.id}`}
                aria-selected={on}
                aria-controls="step-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  "group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:shadow-ring-brand",
                  on ? "border-brand bg-brand-subtle shadow-sm" : "border-line bg-surface-card hover:border-brand",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-label-lg",
                    on ? "bg-brand-gradient text-ink-on-brand" : "bg-surface-subtle text-ink-secondary group-hover:text-brand",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className={cn("text-label-lg", on ? "text-brand-text" : "text-ink")}>{s.title}</span>
                  <span className={cn("text-body-sm text-ink-secondary", !on && "line-clamp-1 lg:line-clamp-none")}>{s.text}</span>
                </span>
              </button>
              {/* phones / tablets: the screen opens right under the tapped step */}
              {on && (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface-card px-4 py-6 shadow-sm lg:hidden">
                  <PhoneFrame key={s.id} shot={s.shot} className="w-[220px] animate-pop-in" />
                  {s.statuses && <StatusFlow label={c.statusLabel} statuses={s.statuses} />}
                </div>
              )}
              </React.Fragment>
            );
          })}
        </div>

        {/* phone + statuses */}
        <div id="step-panel" role="tabpanel" aria-labelledby={`step-tab-${step.id}`} className="hidden flex-col items-center gap-4 rounded-2xl border border-line bg-surface-card px-6 py-8 shadow-sm lg:sticky lg:top-24 lg:flex">
          <p className="text-overline uppercase text-brand-text">
            {c.stepLabel} {String(active + 1).padStart(2, "0")} · {step.title}
          </p>
          <PhoneFrame key={step.id} shot={step.shot} className="w-[250px] animate-pop-in xl:w-[270px]" />
          {step.statuses && <StatusFlow label={c.statusLabel} statuses={step.statuses} />}
        </div>
      </div>
    </section>
  );
}

/* ── Tour row: pinned note (details) + floating phone mock-up, alternating sides & colours ── */
const TOUR_ICONS: Record<string, typeof Verify> = {
  register: UserAdd,
  login: Login,
  verify: Verify,
  edit: Edit2,
  dashboard: Home2,
  search: SearchNormal1,
  limits: Chart,
  interest: Heart,
  respond: TickCircle,
  sent: Send2,
  favourites: Lovely,
  friends: People,
  chat: Messages2,
  contact: Call,
  report: Flag,
  gold: Crown1,
  promote: Star1,
};

function TourCard({ item, index, whereLabel }: { item: TourItem; index: number; whereLabel: string }) {
  const flip = index % 2 === 1;
  const tone = index % 2 === 0 ? "rose" : "gold";
  const Icon = TOUR_ICONS[item.id] ?? Heart;
  const two = item.shots.length > 1;
  return (
    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
      {/* pinned note */}
      <div className={cn("flex justify-center lg:col-span-5", flip && "lg:order-2")}>
        <PinNote
          tone={tone}
          className="reveal w-full max-w-[480px]"
          style={{ transform: `rotate(${flip ? 1.5 : -1.5}deg)` }}
          panelClassName="gap-4 p-6 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-gradient text-ink-on-brand">
              <Icon size={24} color="currentColor" />
            </span>
            <span className={cn("text-[56px] font-bold leading-none", tone === "rose" ? "text-brand" : "text-gold-700 dark:text-gold-300")}>
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          {/* paper panel is always light → fixed light-paper colours */}
          <h4 className="text-h4 text-gray-900 dark:text-ink md:text-h3">{item.title}</h4>
          <p className="text-body-md text-gray-600 dark:text-ink-secondary">{item.summary}</p>
          <ul className="flex flex-col gap-2">
            {item.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-body-sm text-gray-800 dark:text-ink-secondary">
                <TickCircle size={18} color="currentColor" variant="Bold" className={cn("mt-0.5 shrink-0", tone === "rose" ? "text-rose-600 dark:text-rose-400" : "text-gold-700 dark:text-gold-300")} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {item.statuses && <StatusFlow statuses={item.statuses} align="start" />}
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1.5 text-label-sm text-rose-700 shadow-xs dark:bg-surface-raised dark:text-rose-300">
            {whereLabel}: {item.where}
            <ArrowRight2 size={12} color="currentColor" />
          </span>
        </PinNote>
      </div>

      {/* phone mock-up */}
      <div className={cn("relative flex items-center justify-center gap-4 py-6 sm:gap-8 lg:col-span-7", flip && "lg:order-1")}>
        {item.shots.map((s, k) => (
          <PhoneFrame
            key={s.src}
            shot={s}
            className={cn("reveal", two ? "w-[44%] max-w-[230px]" : "w-[62%] max-w-[260px]")}
            style={{ transform: `rotate(${two ? (k === 0 ? -3 : 3) : flip ? 2 : -2}deg)` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Shared bits ───────────────────────────────────────────────── */
function PhoneFrame({ shot, className, style }: { shot: Shot; className?: string; style?: React.CSSProperties }) {
  return (
    <figure className={cn("shrink-0 rounded-[28px] bg-gray-900 p-1.5 shadow-xl ring-1 ring-line", className)} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.src} alt={shot.alt} width={585} height={1266} loading="lazy" className="block h-auto w-full rounded-[22px]" />
      <figcaption className="sr-only">{shot.alt}</figcaption>
    </figure>
  );
}

const STATUS_TONE: Record<Status["tone"], BadgeTone> = {
  neutral: "neutral",
  warning: "warning",
  success: "success",
  error: "error",
  brand: "brand",
  premium: "premium",
  info: "info",
};

function StatusFlow({ statuses, label, align = "center" }: { statuses: Status[]; label?: string; align?: "center" | "start" }) {
  return (
    <div className={cn("flex flex-col gap-2", align === "center" ? "items-center" : "items-start")}>
      {label && <p className="text-caption text-ink-tertiary">{label}</p>}
      <ol className={cn("flex flex-wrap items-center gap-1.5", align === "center" && "justify-center")}>
        {statuses.map((s, i) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <Badge tone={STATUS_TONE[s.tone]}>{s.label}</Badge>
            {i < statuses.length - 1 && <ArrowRight2 size={12} color="currentColor" className="text-ink-tertiary" aria-hidden />}
          </li>
        ))}
      </ol>
    </div>
  );
}

function TrustChip({ Icon, children }: { Icon: typeof Verify; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-card px-3 py-1.5 text-label-sm text-ink-secondary shadow-xs">
      <Icon size={16} color="currentColor" className="text-icon-brand" />
      {children}
    </span>
  );
}
