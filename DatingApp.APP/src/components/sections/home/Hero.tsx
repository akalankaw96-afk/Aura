"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown2, Heart, SearchNormal1, TickCircle, User, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Navbar } from "@/components/layout/Navbar";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { ProfileGlassCard } from "@/components/cards/ProfileGlassCard";
import { HERO, MARQUEE_PROFILES } from "@/content/home";

/**
 * Figma: 01 Hero (1440 × 924)
 *  - background photo + black 62 % + Gradient/Hero Overlay 80 %
 *  - glass Navbar, trust pill, Display/XL title, Body/XL description
 *  - Search Bar (Layout = 2 fields) with popovers (Figma: Search Popover)
 *  - All / Brides / Grooms chips + auto-scrolling Profile Marquee
 */
export function Hero() {
  const [filter, setFilter] = useState<"all" | "bride" | "groom">("all");
  const list = useMemo(() => MARQUEE_PROFILES.filter((p) => filter === "all" || p.gender === filter), [filter]);

  return (
    <section aria-label="Find a partner" className="relative isolate overflow-hidden bg-rose-950 text-ink-on-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={HERO.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black opacity-[0.62]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-hero-overlay opacity-80" />

      <Navbar variant="glass" />

      <div className="container-page flex flex-col items-center gap-8 pb-10 pt-12 text-center lg:pb-[42px] lg:pt-[112px]">
        <div className="flex flex-col items-center gap-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-line-glass bg-surface-glass px-4 py-2 text-label-md backdrop-blur-[8px]">
            <Verify size={18} color="currentColor" />
            {HERO.trustPill}
          </p>
          <h1 className="max-w-[960px] text-[36px] font-extrabold leading-[1.2] tracking-[-0.02em] md:text-display-lg lg:text-display-xl">{HERO.title}</h1>
          <p className="max-w-[720px] text-body-md text-ink-on-brand-muted md:text-body-xl">{HERO.description}</p>
        </div>
        <HeroSearch />
      </div>

      {/* Figma: Frame 5 — filter tabs + marquee */}
      <div className="flex flex-col items-center gap-6 pb-16">
        <div role="tablist" aria-label="Show" className="flex gap-2">
          {(
            [
              ["all", "All", "/brand/couple.png"],
              ["bride", "Brides", "/brand/bride.png"],
              ["groom", "Grooms", "/brand/groom.png"],
            ] as const
          ).map(([value, label, avatar]) => (
            <Chip key={value} role="tab" aria-selected={filter === value} selected={filter === value} avatar={avatar} onClick={() => setFilter(value)}>
              {label}
            </Chip>
          ))}
        </div>
        <Marquee key={filter}>
          {list.map((p) => (
            <ProfileGlassCard key={p.id} profile={p} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/** Infinite, pause-on-hover horizontal scroll (Figma prototype: Profile Marquee). */
function Marquee({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative w-full overflow-hidden">
      <div className="flex w-max animate-marquee gap-5 group-hover:[animation-play-state:paused]">
        <div className="flex gap-5">{children}</div>
        <div className="flex gap-5" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Search Bar (Layout = 2 fields) + Search Popover ───────────────── */

const AGE_PRESETS = ["18 – 24", "25 – 32", "33 – 40", "40+"];
const AGES = Array.from({ length: 43 }, (_, i) => String(18 + i));

function HeroSearch() {
  const router = useRouter();
  const toast = useToast();
  const [lookingFor, setLookingFor] = useState<"Bride" | "Groom">("Bride");
  const [age, setAge] = useState({ min: "25", max: "32" });
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

  const ageLabel = age.max === "60" && age.min === "40" ? "40+" : `${age.min} – ${age.max}`;

  const search = () => {
    setOpen(null);
    router.push(`/search?for=${lookingFor.toLowerCase()}&min=${age.min}&max=${age.max}`);
  };

  const segment = (active: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-full px-6 py-2 text-left text-ink transition-colors md:w-[220px]",
      active ? "bg-brand-subtle" : "hover:bg-surface-subtle"
    );

  return (
    <div ref={ref} className="relative z-20 w-full max-w-[600px] text-left md:w-auto">
      <div className="flex flex-col gap-2 rounded-xl bg-surface-card p-3 shadow-xl md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2">
        {/* Looking for */}
        <button type="button" aria-haspopup="listbox" aria-expanded={open === "for"} onClick={() => setOpen(open === "for" ? null : "for")} className={segment(open === "for")}>
          <Heart size={24} color="currentColor" className="shrink-0 text-icon-brand" />
          <span className="flex flex-1 flex-col">
            <span className="text-label-sm text-ink-tertiary">Looking for</span>
            <span className="text-body-md font-semibold">{lookingFor}</span>
          </span>
          <ArrowDown2 size={24} color="currentColor" className={cn("shrink-0 text-icon-brand transition-transform", open === "for" && "rotate-180")} />
        </button>
        <span aria-hidden className="hidden w-px self-stretch bg-line md:block" />
        {/* Age */}
        <button type="button" aria-haspopup="dialog" aria-expanded={open === "age"} onClick={() => setOpen(open === "age" ? null : "age")} className={segment(open === "age")}>
          <User size={24} color="currentColor" className="shrink-0 text-icon-brand" />
          <span className="flex flex-1 flex-col">
            <span className="text-label-sm text-ink-tertiary">Age</span>
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
          Search
        </button>
      </div>

      {open === "for" && (
        <div role="listbox" aria-label="Looking for" className="absolute left-0 top-[calc(100%+8px)] w-full animate-fade-up rounded-lg border border-line bg-surface-card p-2 shadow-xl md:w-[260px]">
          {(
            [
              ["Bride", "/brand/bride.png"],
              ["Groom", "/brand/groom.png"],
            ] as const
          ).map(([v, img]) => (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={lookingFor === v}
              onClick={() => {
                setLookingFor(v);
                setOpen(null);
              }}
              className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-body-md font-semibold text-ink hover:bg-brand-subtle", lookingFor === v && "bg-brand-subtle text-brand-text")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-8 w-8 rounded-full" />
              <span className="flex-1">{v}</span>
              {lookingFor === v && <TickCircle size={20} color="currentColor" variant="Bold" />}
            </button>
          ))}
        </div>
      )}

      {open === "age" && (
        <div role="dialog" aria-label="Age range" className="absolute left-0 top-[calc(100%+8px)] w-full animate-fade-up rounded-lg border border-line bg-surface-card p-4 text-ink shadow-xl md:left-[236px] md:w-[300px]">
          <p className="mb-3 text-label-md">Age range</p>
          <div className="mb-4 flex items-center gap-2">
            <AgeSelect label="Minimum age" value={age.min} onChange={(min) => setAge((a) => ({ min, max: Number(min) > Number(a.max) ? min : a.max }))} />
            <span className="text-ink-tertiary">–</span>
            <AgeSelect label="Maximum age" value={age.max} onChange={(max) => setAge((a) => ({ max, min: Number(max) < Number(a.min) ? max : a.min }))} />
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {AGE_PRESETS.map((p) => {
              const [min, max] = p === "40+" ? ["40", "60"] : p.split(" – ");
              const active = age.min === min && age.max === max;
              return (
                <Chip key={p} selected={active} onClick={() => setAge({ min, max })}>
                  {p}
                </Chip>
              );
            })}
          </div>
          <button type="button" onClick={() => setOpen(null)} className="h-11 w-full rounded-full bg-brand-gradient text-button-md text-ink-on-brand">
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

function AgeSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <Select aria-label={label} value={value} onChange={onChange} options={AGES} searchPlaceholder="Type an age" containerClassName="flex-1" />;
}
