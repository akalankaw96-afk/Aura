"use client";

import React from "react";
import { ArrowRight2, Lovely, SearchNormal1, UserAdd, Verify } from "iconsax-react";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PinNote } from "@/components/ui/PinNote";
import { LoveSticker } from "@/components/ui/Decor";
import { useLanguage } from "@/context/LanguageContext";
import { BumpTitle } from "@/components/motion/BumpTitle";

/**
 * Figma: How It Works Notes (1440 × 842) — four pinned notes on a board
 * with dashed connectors and love stickers. Positions / rotations are the
 * exact Figma values (Board 1280 × 498). Below lg the notes stack.
 */
const ICONS = { "user-add": UserAdd, verify: Verify, search: SearchNormal1, lovely: Lovely } as const;

// Figma: Board children (x, y, rotation) — Note 01…04
const NOTE_POS = [
  { x: 40, y: 60, rot: -5 },
  { x: 350, y: 210, rot: 4 },
  { x: 660, y: 50, rot: -3 },
  { x: 970, y: 200, rot: 5 },
];
const STICKERS = [
  { v: "sticker", x: 250, y: 30, s: 64, rot: 14 },
  { v: "outline", x: 600, y: 420, s: 58, rot: -12 },
  { v: "double", x: 1180, y: 120, s: 64, rot: 8 },
  { v: "sparkle", x: 10, y: 380, s: 58, rot: -10 },
  { v: "filled", x: 880, y: 20, s: 61, rot: 18 },
] as const;

export function HowItWorks() {
  const { t, lang } = useLanguage();

  const steps = [
    {
      n: "01",
      title: t.howItWorks.step1Title,
      text: t.howItWorks.step1Desc,
      pill: lang === "si" ? "විනාඩි 2කින්" : "About 2 minutes",
      tone: "rose" as const,
      icon: "user-add" as const,
    },
    {
      n: "02",
      title: t.howItWorks.step2Title,
      text: t.howItWorks.step2Desc,
      pill: lang === "si" ? "සත්‍යාපනය" : "ID + phone check",
      tone: "gold" as const,
      icon: "verify" as const,
    },
    {
      n: "03",
      title: t.howItWorks.step3Title,
      text: t.howItWorks.step3Desc,
      pill: lang === "si" ? "නොමිලේ" : "Free to send",
      tone: "rose" as const,
      icon: "search" as const,
    },
    {
      n: "04",
      title: t.howItWorks.step4Title,
      text: t.howItWorks.step4Desc,
      pill: lang === "si" ? "පෝරුවට සූදානම්" : "Plan the poruwa",
      tone: "gold" as const,
      icon: "lovely" as const,
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-28 py-16 lg:py-24">
      <div className="container-page flex flex-col gap-12">
        <SectionHeader eyebrow={t.howItWorks.eyebrow} title={t.howItWorks.title} description={t.howItWorks.description} />

        {/* Desktop board: exact Figma coordinates inside a 1280 × 498 canvas */}
        <div className="relative mx-auto hidden h-[498px] w-[1280px] max-w-full lg:block">
          <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1280 498" fill="none">
            <path d="M290 240 C 320 260, 350 280, 372 300" stroke="var(--rose-300)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
            <path d="M600 330 C 620 280, 640 220, 690 170" stroke="var(--rose-300)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
            <path d="M912 210 C 940 240, 960 270, 992 296" stroke="var(--rose-300)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
          </svg>
          {steps.map((s, i) => (
            <Note key={s.n} step={s} className="reveal absolute" style={{ left: NOTE_POS[i].x, top: NOTE_POS[i].y, transform: `rotate(${NOTE_POS[i].rot}deg)`, "--reveal-delay": `${i * 140}ms` } as React.CSSProperties} />
          ))}
          {STICKERS.map((st, i) => (
            <LoveSticker key={i} variant={st.v} size={st.s} rotate={st.rot} className="reveal-zoom absolute" style={{ left: st.x, top: st.y, "--reveal-delay": `${300 + i * 120}ms` } as React.CSSProperties} />
          ))}
        </div>

        {/* Tablet / mobile: stacked notes, alternating tilt (Figma: Home — Mobile 390) */}
        <ol className="reveal-stagger mx-auto flex w-full max-w-[340px] flex-col gap-10 lg:hidden">
          {steps.map((s, i) => (
            <li key={s.n} className={cn(i % 2 ? "self-end" : "self-start")}>
              <Note step={s} style={{ transform: `rotate(${i % 2 ? 3 : -3}deg)` }} />
            </li>
          ))}
        </ol>
        <div className="flex justify-center">
          <ButtonLink href="/how-to-use" variant="outline" rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
            {lang === "si" ? "සම්පූර්ණ මාර්ගෝපදේශය බලන්න" : "See the full guide"}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

type Step = {
  n: string;
  title: string;
  text: string;
  pill: string;
  tone: "rose" | "gold";
  icon: "user-add" | "verify" | "search" | "lovely";
};

/** Figma: Note — 270 × 264, white card, radius xl, pin + tinted panel (shared `PinNote`). */
function Note({ step, className, style }: { step: Step; className?: string; style?: React.CSSProperties }) {
  const Icon = ICONS[step.icon];
  const rose = step.tone === "rose";
  return (
    <PinNote tone={step.tone} className={cn("w-[270px]", className)} style={style}>
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-gradient text-ink-on-brand">
          <Icon size={22} color="currentColor" />
        </span>
        <span className={cn("text-[48px] font-bold leading-[1.2]", rose ? "text-brand" : "text-gold-700 dark:text-gold-300")}>{step.n}</span>
      </div>
      {/* note panels are always light (paper), so text uses fixed primitives */}
      <BumpTitle as="h3" delay={200} stagger={60} className="text-h5 text-gray-900 dark:text-ink">{step.title}</BumpTitle>
      <p className="text-body-sm text-gray-600 dark:text-ink-secondary">{step.text}</p>
      <span className="w-fit rounded-full bg-white px-2.5 py-1 text-label-sm text-rose-700 dark:bg-surface-raised dark:text-rose-300">{step.pill}</span>
    </PinNote>
  );
}
