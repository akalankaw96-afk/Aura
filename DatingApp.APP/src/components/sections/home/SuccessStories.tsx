"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight2, Location, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { STORIES } from "@/content/home";

/**
 * Figma: 05 Success stories (auto-scroll) — 1440 × 880, padding 96/0.
 * Centre Story Card 760 × 420 with side photo cards (104 × 300 and
 * 76 × 212 at 75 % / 40 % opacity), prev / next buttons and dots.
 * Auto-advances every 6 s (Figma prototype: after-delay smart animate).
 */
export function SuccessStories() {
  const [i, setI] = useState(0);
  const n = STORIES.items.length;
  const story = STORIES.items[i];

  useEffect(() => {
    const t = window.setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => window.clearInterval(t);
  }, [n, i]);

  const side = STORIES.side;

  return (
    <section id="stories" aria-roledescription="carousel" className="scroll-mt-28 overflow-hidden py-16 lg:py-24">
      <div className="flex flex-col gap-12">
        <div className="container-page">
          <SectionHeader eyebrow={STORIES.eyebrow} title={STORIES.title} description={STORIES.description} />
        </div>

        <div className="flex items-center justify-center gap-4">
          {/* left side cards (desktop only) */}
          <SideCard src={side[0]} small className="hidden opacity-75 xl:block" />
          <SideCard src={side[1]} className="hidden lg:block" />

          {/* Figma: Story 3 — 760 × 420, padding 12, gap 12 */}
          <article key={i} aria-live="polite" className="flex w-full max-w-[760px] animate-fade-up flex-col-reverse gap-3 md:min-h-[420px] rounded-xl border border-line bg-surface-card p-3 shadow-xl max-lg:mx-page-x md:flex-row">
            <div className="flex flex-1 flex-col justify-between gap-6 px-4 pb-4 pt-4 md:py-6 md:pl-6 md:pr-4">
              <div className="flex flex-col gap-3">
                <span className="inline-flex h-[22px] w-fit items-center gap-1 rounded-full bg-success-bg px-2 text-label-sm text-success-fg">
                  <Verify size={14} color="currentColor" /> {story.badge}
                </span>
                <h3 className="text-h4 md:text-h3">{story.headline}</h3>
              </div>
              <blockquote className="flex flex-col gap-1">
                <span aria-hidden className="h-[34px] text-[48px] font-bold leading-[1.2] text-brand-text">“</span>
                <p className="text-body-md font-semibold text-ink md:text-body-lg md:font-semibold">{story.quote}</p>
              </blockquote>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-label-lg text-ink-on-brand">{story.initials}</span>
                <div>
                  <p className="text-label-lg text-ink">{story.names}</p>
                  <p className="flex items-center gap-1 text-caption text-ink-tertiary">
                    <Location size={14} color="currentColor" /> {story.meta}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative aspect-[360/394] w-full overflow-hidden rounded-md md:w-[360px] md:shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.photo} alt={`${story.names} on their wedding day`} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-hero-overlay px-5 pb-5 pt-16 text-ink-on-brand">
                <p className="text-label-md">{story.caption}</p>
                <p className="text-caption">{story.captionMeta}</p>
              </div>
            </div>
          </article>

          <SideCard src={side[2]} className="hidden lg:block" />
          <SideCard src={side[3]} small className="hidden opacity-75 xl:block" />
          <SideCard src={side[4]} small className="hidden opacity-40 2xl:block" />
        </div>

        {/* Figma: Controls 224 × 48 */}
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="Previous story"
            onClick={() => setI((x) => (x - 1 + n) % n)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface-card text-ink transition-colors hover:bg-surface-subtle"
          >
            <ArrowLeft size={20} color="currentColor" />
          </button>
          <div className="flex items-center gap-2">
            {STORIES.items.map((_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Story ${k + 1}`}
                aria-current={k === i}
                onClick={() => setI(k)}
                className={cn("h-2 rounded-full transition-all", k === i ? "w-8 bg-brand" : "w-2 bg-rose-300")}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next story"
            onClick={() => setI((x) => (x + 1) % n)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-ink-on-brand transition-colors hover:bg-brand-hover"
          >
            <ArrowRight2 size={20} color="currentColor" />
          </button>
        </div>
      </div>
    </section>
  );
}

/** Figma: Story side cards — 104 × 300 (or 76 × 212 small), padding 8, radius xl */
function SideCard({ src, small, className }: { src: string; small?: boolean; className?: string }) {
  return (
    <div className={cn("shrink-0 rounded-xl bg-surface-card p-2 shadow-md", small ? "h-[212px] w-[76px]" : "h-[300px] w-[104px]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full rounded-lg object-cover" />
    </div>
  );
}
