"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AddCircle, Lovely, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { DASH_HERO, MEMBER } from "@/content/dashboard";
import { HERO } from "@/content/home";

/**
 * Figma: Dashboard → Hero — 1280 wide, padding 48, gap 40, radius 2xl.
 * Hero photo + black 62 % + brand gradient (left → right), welcome copy + CTAs,
 * and a glass "Profile strength" card (340 wide).
 */
function greeting(h: number) {
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function DashboardHero() {
  // time of day is only known in the browser → start neutral to avoid a hydration mismatch
  const [hello, setHello] = useState("Welcome");
  useEffect(() => setHello(greeting(new Date().getHours())), []);

  return (
    <section aria-label="Welcome" className="relative isolate overflow-hidden rounded-2xl bg-rose-950 text-ink-on-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={HERO.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black opacity-[0.62]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(107,5,38,0.85),rgba(222,5,71,0.35))]" />

      <div className="flex flex-col gap-8 p-6 sm:p-10 lg:flex-row lg:items-center lg:gap-10 lg:p-12">
        <div className="flex flex-1 flex-col gap-4">
          <span className="enter inline-flex w-fit items-center gap-1.5 rounded-full border border-line-glass bg-surface-glass py-1.5 pl-2.5 pr-3 text-label-sm backdrop-blur-[8px]">
            <Lovely size={16} color="currentColor" /> {DASH_HERO.eyebrow}
          </span>
          <h1 className="enter text-h2 md:text-display-lg" style={{ "--enter-delay": "80ms" } as React.CSSProperties}>
            {hello}, {MEMBER.firstName}
          </h1>
          <p className="enter text-body-md text-ink-on-brand-muted md:text-body-lg" style={{ "--enter-delay": "160ms" } as React.CSSProperties}>
            {DASH_HERO.subtitle}
          </p>
          <div className="enter flex flex-wrap gap-3 pt-2" style={{ "--enter-delay": "240ms" } as React.CSSProperties}>
            <Link href={DASH_HERO.primary.href} className="flex h-11 items-center rounded-full bg-brand-gradient px-6 text-button-md text-ink-on-brand transition-shadow hover:shadow-glow">
              {DASH_HERO.primary.label}
            </Link>
            <Link href={DASH_HERO.secondary.href} className="flex h-11 items-center rounded-full bg-brand-subtle px-6 text-button-md text-brand-text ring-1 ring-inset ring-brand">
              {DASH_HERO.secondary.label}
            </Link>
          </div>
        </div>

        <ProfileStrength />
      </div>
    </section>
  );
}

/** Figma: Hero → Profile strength — glass card, 340 wide, padding 20, gap 16, radius xl */
function ProfileStrength() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setW(MEMBER.strength), 500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <aside
      aria-label="Profile strength"
      className="enter flex w-full flex-col gap-4 rounded-xl border border-line-glass bg-surface-glass p-5 backdrop-blur-[24px] lg:w-[340px] lg:shrink-0"
      style={{ "--enter-delay": "320ms" } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MEMBER.photo} alt="" className="h-14 w-14 rounded-full border-2 border-white object-cover" />
        <div className="flex flex-col gap-0.5">
          <p className="text-h6">{MEMBER.fullName}</p>
          <p className="text-caption text-ink-on-brand-muted">{MEMBER.id} · Verified</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-label-md">
          <span>Profile strength</span>
          <span>{MEMBER.strength}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.2)]" role="progressbar" aria-valuenow={MEMBER.strength} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gold-300 transition-[width] duration-1000 ease-out" style={{ width: `${w}%` }} />
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {MEMBER.todos.map((t) => (
          <li key={t.label} className={cn("flex items-center gap-2 text-body-sm", t.done ? "text-ink-on-brand" : "text-ink-on-brand-muted")}>
            {t.done ? <TickCircle size={16} color="currentColor" variant="Bold" className="text-gold-300" /> : <AddCircle size={16} color="currentColor" />}
            {t.done ? (
              t.label
            ) : (
              <Link href="/register" className="hover:text-ink-on-brand hover:underline">
                {t.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
