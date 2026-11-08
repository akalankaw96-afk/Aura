"use client";

import React from "react";
import Link from "next/link";
import {
  Book,
  Briefcase,
  Building,
  Cpu,
  Crown1,
  Global,
  Health,
  Hospital,
  House2,
  Location,
  Lovely,
  Map1,
  Monitor,
  People,
  Profile2User,
  Star1,
  Teacher,
  Verify,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useLanguage } from "@/context/LanguageContext";
import { CATEGORIES, type CategoryIcon } from "@/content/home";

/**
 * Figma: Category Brick Wall (1440 × 628) — three rows of Category Bricks
 * scrolling in opposite directions, white fades at both edges.
 * Brick: 232 × 80, padding 0/16, gap 12, radius lg, border, Shadow/SM.
 */
const ICONS: Record<CategoryIcon, typeof Book> = {
  teacher: Teacher,
  people: People,
  verify: Verify,
  book: Book,
  health: Health,
  cpu: Cpu,
  global: Global,
  location: Location,
  briefcase: Briefcase,
  monitor: Monitor,
  star: Star1,
  crown: Crown1,
  house: House2,
  map: Map1,
  lovely: Lovely,
  hospital: Hospital,
  building: Building,
  "profile-2user": Profile2User,
};

// Figma row offsets: Row 1 starts at -40, Row 2 runs the other way, Row 3 at -102
const ROW_STYLE = ["[animation-duration:70s]", "[animation-direction:reverse] [animation-duration:80s]", "[animation-duration:90s]"];

export function CategoryWall() {
  const { t } = useLanguage();

  return (
    <section id="categories" className="scroll-mt-28 overflow-hidden py-16 lg:py-24">
      <div className="flex flex-col gap-12">
        <div className="container-page">
          <SectionHeader eyebrow={t.categories.eyebrow} title={t.categories.title} description={t.categories.description} />
        </div>

        <div className="reveal group relative flex flex-col gap-3 py-2.5">
          {CATEGORIES.rows.map((row, r) => (
            <div key={r} className={cn("flex w-max animate-marquee gap-4 group-hover:[animation-play-state:paused]", ROW_STYLE[r])}>
              {[...row, ...row, ...row, ...row].map((c, k) => (
                <Brick
                  key={k}
                  {...c}
                  displayLabel={t.categories.labels[c.label] || c.label}
                  proposalsText={t.categories.proposals}
                  hidden={k >= row.length * 2}
                />
              ))}
            </div>
          ))}
          {/* Figma: Fade L / Fade R — 160px white fades */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-[linear-gradient(90deg,var(--color-bg-page),transparent)] md:w-40" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-[linear-gradient(270deg,var(--color-bg-page),transparent)] md:w-40" />
        </div>

        <Link href="/search" className="mx-auto flex h-14 items-center rounded-full bg-brand-gradient px-8 text-button-lg text-ink-on-brand transition-shadow hover:shadow-glow md:hidden">
          {t.categories.exploreAll}
        </Link>
      </div>
    </section>
  );
}

function Brick({
  label,
  displayLabel,
  count,
  proposalsText,
  icon,
  hidden,
}: {
  label: string;
  displayLabel: string;
  count: string;
  proposalsText: string;
  icon: CategoryIcon;
  hidden?: boolean;
}) {
  const Icon = ICONS[icon];
  return (
    <Link
      href={`/search?category=${encodeURIComponent(label)}`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="flex h-20 w-[232px] shrink-0 items-center gap-3 rounded-lg border border-line bg-surface-card px-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-focus hover:shadow-lg"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-icon-brand">
        <Icon size={24} color="currentColor" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-body-md font-semibold text-ink">{displayLabel}</span>
        <span className="text-caption text-ink-tertiary">{count} {proposalsText}</span>
      </span>
    </Link>
  );
}
