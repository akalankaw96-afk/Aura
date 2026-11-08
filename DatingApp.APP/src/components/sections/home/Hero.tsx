"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown2, Heart, SearchNormal1, TickCircle, User, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Navbar } from "@/components/layout/Navbar";
import { Chip } from "@/components/ui/Chip";
import { AgeRangePopover, formatAgeRange, type AgeRange } from "./AgeRangePopover";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/context/LanguageContext";
import { ProfilePhotoCard } from "@/components/cards/ProfilePhotoCard";
import { HERO, MARQUEE_PROFILES } from "@/content/home";

/**
 * Figma: 01 Hero (1440 × 924)
 *  - background photo + black 62 % + Gradient/Hero Overlay 80 %
 *  - glass Navbar, trust pill, Display/XL title, Body/XL description
 *  - Search Bar (Layout = 2 fields) with popovers (Figma: Search Popover)
 *  - All / Brides / Grooms chips + auto-scrolling Profile Marquee
 */
export function Hero() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "bride" | "groom">("all");
  const list = useMemo(() => MARQUEE_PROFILES.filter((p) => filter === "all" || p.gender === filter), [filter]);

  return (
    <section aria-label="Find a partner" className="relative isolate overflow-hidden bg-rose-950 text-ink-on-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={HERO.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black opacity-[0.62]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-hero-overlay opacity-80" />

      <Navbar variant="light" />

      <div className="container-page flex flex-col items-center gap-8 pb-10 pt-12 text-center lg:pb-[42px] lg:pt-[112px]">
        <div className="flex flex-col items-center gap-4">
          <h1 className="enter max-w-[960px] text-[36px] font-extrabold leading-[1.2] tracking-[-0.02em] md:text-display-lg lg:text-display-xl">{t.hero.title}</h1>
          <p style={{ "--enter-delay": "120ms" } as React.CSSProperties} className="enter max-w-[720px] text-body-md text-ink-on-brand-muted md:text-body-xl">{t.hero.description}</p>
        </div>
        <div className="enter flex w-full justify-center" style={{ "--enter-delay": "240ms" } as React.CSSProperties}>
          <HeroSearch />
        </div>
      </div>

      {/* Figma: Frame 5 — filter tabs + marquee */}
      <div className="flex flex-col items-center gap-6 pb-16">
        <div role="tablist" aria-label="Show" className="enter flex gap-2" style={{ "--enter-delay": "380ms" } as React.CSSProperties}>
          {(
            [
              ["all", t.hero.all, "/brand/couple.png"],
              ["bride", t.hero.brides, "/brand/bride.png"],
              ["groom", t.hero.grooms, "/brand/groom.png"],
            ] as const
          ).map(([value, label, avatar]) => (
            <Chip key={value} role="tab" aria-selected={filter === value} selected={filter === value} avatar={avatar} onClick={() => setFilter(value)}>
              {label}
            </Chip>
          ))}
        </div>
        <div className="enter w-full" style={{ "--enter-delay": "500ms" } as React.CSSProperties}>
          <Marquee key={filter}>
            {list.map((p) => (
              <ProfilePhotoCard key={p.id} profile={p} variant="card" />
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

/** Infinite, pause-on-hover horizontal scroll (Figma prototype: Profile Marquee). */
export function Marquee({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative w-full overflow-hidden">
      <div className="flex w-max animate-marquee gap-5 py-2 group-hover:[animation-play-state:paused]">
        <div className="flex gap-5">{children}</div>
        <div className="flex gap-5" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Search Bar (Layout = 2 fields) + Search Popover ───────────────── */

export function HeroSearch() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [lookingFor, setLookingFor] = useState<"Bride" | "Groom">("Bride");
  const [age, setAge] = useState<AgeRange>({ min: 25, max: 32 });
  const [open, setOpen] = useState<null | "for" | "age">(null);
  const ref = useRef<HTMLDivElement>(null);

  // Figma note: close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const ageLabel = formatAgeRange(age);

  const search = () => {
    setOpen(null);
    router.push(`/search?for=${lookingFor.toLowerCase()}&min=${age.min}&max=${age.max}`);
  };

  // Figma: Search Bar (Layout = 2 fields) — the open segment is rounded only on its
  // outer side (Looking for: left 24, Age: right 24); the side next to the divider stays square.
  const segment = (active: boolean, side: "left" | "right") =>
    cn(
      "flex w-full items-center gap-3 rounded-md px-6 py-2 text-left text-ink transition-colors md:w-[220px]",
      side === "left" ? "md:rounded-l-[24px] md:rounded-r-none" : "md:rounded-l-none md:rounded-r-[24px]",
      active ? "bg-brand-subtle" : "hover:bg-surface-subtle"
    );

  const lookingForLabel = lookingFor === "Bride" ? t.hero.bride : t.hero.groom;

  return (
    <div ref={ref} className="relative z-20 w-full max-w-[600px] text-left md:w-auto">
      <div className="flex flex-col gap-2 rounded-xl bg-surface-card p-3 shadow-xl md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2">
        {/* Looking for */}
        <button type="button" aria-haspopup="listbox" aria-expanded={open === "for"} onClick={() => setOpen(open === "for" ? null : "for")} className={segment(open === "for", "left")}>
          <Heart size={24} color="currentColor" className="shrink-0 text-icon-brand" />
          <span className="flex flex-1 flex-col">
            <span className="text-label-sm text-ink-tertiary">{t.hero.lookingFor}</span>
            <span className="text-body-md font-semibold">{lookingForLabel}</span>
          </span>
          <ArrowDown2 size={24} color="currentColor" className={cn("shrink-0 text-icon-brand transition-transform", open === "for" && "rotate-180")} />
        </button>
        <span aria-hidden className="hidden w-px self-stretch bg-line md:block" />
        {/* Age */}
        <button type="button" aria-haspopup="dialog" aria-expanded={open === "age"} onClick={() => setOpen(open === "age" ? null : "age")} className={segment(open === "age", "right")}>
          <User size={24} color="currentColor" className="shrink-0 text-icon-brand" />
          <span className="flex flex-1 flex-col">
            <span className="text-label-sm text-ink-tertiary">{t.hero.age}</span>
            <span className="text-body-md font-semibold">{ageLabel}</span>
          </span>
          <ArrowDown2 size={24} color="currentColor" className={cn("shrink-0 text-icon-brand transition-transform", open === "age" && "rotate-180")} />
        </button>
        <button
          type="button"
          onClick={search}
          className="flex h-[54px] items-center justify-center gap-2 rounded-full bg-brand-gradient px-8 text-button-md text-ink-on-brand transition-shadow hover:shadow-glow"
        >
          <SearchNormal1 size={20} color="currentColor" />
          {t.hero.search}
        </button>
      </div>

      {open === "for" && (
        /* Figma: Search Popover (Type = Looking for) — 300 wide, padding 16, gap 12, radius lg */
        <div className="absolute left-0 top-[calc(100%+8px)] flex w-full animate-pop-in flex-col gap-3 rounded-lg border border-line bg-surface-card p-4 shadow-xl md:w-[300px]">
          <p id="looking-for-title" className="text-label-md text-ink-tertiary">{t.hero.lookingFor}</p>
          <div role="radiogroup" aria-labelledby="looking-for-title" className="flex flex-col gap-3">
            {(
              [
                ["Bride", t.hero.bride, lang === "si" ? "කාන්තා පැතිකඩ" : "Female profiles", "/brand/bride.png", "bg-rose-100"],
                ["Groom", t.hero.groom, lang === "si" ? "පිරිමි පැතිකඩ" : "Male profiles", "/brand/groom.png", "bg-gold-100"],
              ] as const
            ).map(([v, label, sub, img, tint]) => {
              const on = lookingFor === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setLookingFor(v);
                    setOpen(null);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors",
                    on ? "bg-brand-subtle ring-[1.5px] ring-inset ring-brand" : "border border-line bg-surface-card hover:bg-surface-subtle",
                    on && "border-transparent"
                  )}
                >
                  <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden", tint)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="h-10 w-10 object-contain" />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-body-md font-semibold text-ink">{label}</span>
                    <span className="text-caption text-ink-tertiary">{sub}</span>
                  </span>
                  {on && <TickCircle size={20} color="currentColor" variant="Bold" className="shrink-0 text-brand" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {open === "age" && <AgeRangePopover value={age} onApply={(v) => { setAge(v); setOpen(null); }} />}
    </div>
  );
}
