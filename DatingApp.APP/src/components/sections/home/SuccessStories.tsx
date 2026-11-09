"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight2, Location, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useLanguage } from "@/context/LanguageContext";
import { STORIES } from "@/content/home";
import { BumpTitle } from "@/components/motion/BumpTitle";

/**
 * Figma: 05 Success stories (auto-scroll) — 1440 × 880, padding 96/0.
 * Every story is one card. The active story sits in the centre as the full
 * Story Card (760 × 420); its neighbours are the side photo cards
 * (104 × 300, then 76 × 212 at 75 % / 40 %). On each step every card slides
 * one slot, so the next photo grows into the centre card — no static images.
 * Auto-advances every INTERVAL ms, pauses on hover / focus, swipe on touch.
 */
const INTERVAL = 5000;

/** Slot geometry, by distance from the centre (desktop, lg+) */
const SLOTS = [
  { w: 760, h: 420, cx: 0, opacity: 1 },
  { w: 104, h: 300, cx: 448, opacity: 1 },
  { w: 76, h: 212, cx: 554, opacity: 0.75 },
  { w: 76, h: 212, cx: 646, opacity: 0.4 },
];
const STAGE_H = 420;
const PHOTO_W = 360;

export function SuccessStories() {
  const { t } = useLanguage();
  const items = useMemo(() => {
    return t.stories.items.map((item, idx) => ({
      ...item,
      initials: STORIES.items[idx]?.initials || "VK",
      photo: STORIES.items[idx]?.photo || "/images/stories/story-main.jpg",
    }));
  }, [t.stories.items]);

  const n = items.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const prev = useRef(0);
  const touchX = useRef<number | null>(null);

  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => go(i + 1), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [i, paused, go]);

  useEffect(() => {
    prev.current = i;
  }, [i]);

  /** -3 … 3 for 7 stories: where card k sits relative to the active one */
  const half = Math.floor(n / 2);
  const offsetOf = (k: number, active: number) => ((k - active + n + half) % n) - half;

  const story = items[i] || items[0];
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => (touchX.current = e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      touchX.current = null;
    },
  };

  return (
    <section
      id="stories"
      aria-roledescription="carousel"
      aria-label={t.stories.title}
      className="scroll-mt-28 overflow-hidden py-16 lg:py-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex flex-col gap-12">
        <div className="container-page">
          <SectionHeader eyebrow={t.stories.eyebrow} title={t.stories.title} description={t.stories.description} />
        </div>

        {/* Desktop: sliding slot carousel */}
        <div className="reveal relative hidden lg:block" style={{ height: STAGE_H }} {...swipe}>
          {items.map((s, k) => {
            const off = offsetOf(k, i);
            const was = offsetOf(k, prev.current);
            const wrapped = Math.abs(off - was) > half; // jumped from one edge to the other → no slide
            const slot = SLOTS[Math.min(Math.abs(off), SLOTS.length - 1)];
            const active = off === 0;
            const pad = active ? 12 : 8;
            return (
              <div
                key={s.names}
                aria-hidden={!active}
                onClick={active ? undefined : () => go(k)}
                className={cn(
                  "absolute overflow-hidden bg-surface-card",
                  active ? "z-10 rounded-xl border border-line shadow-xl" : "cursor-pointer rounded-xl shadow-md hover:shadow-lg",
                  wrapped ? "transition-none" : "transition-[left,top,width,height,opacity,box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                )}
                style={{
                  width: slot.w,
                  height: slot.h,
                  top: (STAGE_H - slot.h) / 2,
                  left: `calc(50% + ${Math.sign(off) * slot.cx - slot.w / 2}px)`,
                  opacity: Math.abs(off) > 3 ? 0 : slot.opacity,
                }}
              >
                {/* text panel — fades in once the card has grown */}
                <div
                  className={cn(
                    "absolute flex flex-col justify-between py-6 pl-6 pr-4 transition-opacity",
                    active ? "opacity-100 delay-300 duration-500" : "pointer-events-none opacity-0 duration-150",
                  )}
                  style={{ left: 12, top: 12, bottom: 12, width: SLOTS[0].w - PHOTO_W - 36 }}
                >
                  <StoryText story={s} />
                </div>

                {/* photo — full card when on the side, right-hand panel when active */}
                <div
                  className={cn(
                    "absolute overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    active ? "rounded-md" : "rounded-lg",
                    wrapped && "transition-none",
                  )}
                  style={{ top: pad, right: pad, bottom: pad, width: active ? PHOTO_W : slot.w - pad * 2 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.photo}
                    alt={active ? `${s.names} on their wedding day` : ""}
                    className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms]", active ? "scale-100" : "scale-110")}
                  />
                  <div
                    className={cn(
                      "absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-hero-overlay px-5 pb-5 pt-16 text-ink-on-brand transition-opacity",
                      active ? "opacity-100 delay-300 duration-500" : "opacity-0 duration-150",
                    )}
                  >
                    <p className="text-label-md">{s.caption}</p>
                    <p className="text-caption">{s.captionMeta}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile / tablet: one card, slides in on change */}
        <div className="px-page-x lg:hidden" {...swipe}>
          <article key={i} aria-live="polite" className="mx-auto flex w-full max-w-[760px] animate-story-in flex-col-reverse gap-3 rounded-xl border border-line bg-surface-card p-3 shadow-xl md:min-h-[420px] md:flex-row">
            <div className="flex flex-1 flex-col justify-between gap-6 p-4 md:py-6 md:pl-6 md:pr-4">
              <StoryText story={story} />
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
        </div>

        {/* Figma: Controls 224 × 48 */}
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="Previous story"
            onClick={() => go(i - 1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface-card text-ink transition-all hover:-translate-x-0.5 hover:bg-surface-subtle active:scale-95"
          >
            <ArrowLeft size={20} color="currentColor" />
          </button>
          <div className="flex items-center gap-2">
            {items.map((_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Story ${k + 1}`}
                aria-current={k === i}
                onClick={() => go(k)}
                className={cn("relative h-2 overflow-hidden rounded-full bg-rose-300 transition-all duration-500", k === i ? "w-8" : "w-2 hover:bg-brand-focus")}
              >
                {k === i && (
                  <span
                    key={i}
                    aria-hidden
                    className="absolute inset-0 origin-left rounded-full bg-brand"
                    style={{ animation: `dot-fill ${INTERVAL}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
                  />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Next story"
            onClick={() => go(i + 1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-ink-on-brand transition-all hover:translate-x-0.5 hover:bg-brand-hover active:scale-95"
          >
            <ArrowRight2 size={20} color="currentColor" />
          </button>
        </div>
      </div>
    </section>
  );
}

type Story = {
  badge: string;
  headline: string;
  quote: string;
  names: string;
  meta: string;
  initials: string;
  photo: string;
  caption: string;
  captionMeta: string;
};

function StoryText({ story }: { story: Story }) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <span className="inline-flex h-[22px] w-fit items-center gap-1 rounded-full bg-success-bg px-2 text-label-sm text-success-fg">
          <Verify size={14} color="currentColor" /> {story.badge}
        </span>
        <BumpTitle as="h3" stagger={55} className="text-h4 md:text-h3">{story.headline}</BumpTitle>
      </div>
      <blockquote className="flex flex-col gap-1">
        <span aria-hidden className="h-[34px] text-[48px] font-bold leading-[1.2] text-brand-text">“</span>
        <p className="text-body-md font-semibold text-ink md:text-body-lg md:font-semibold">{story.quote}</p>
      </blockquote>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-label-lg text-ink-on-brand">{story.initials}</span>
        <div>
          <p className="text-label-lg text-ink">{story.names}</p>
          <p className="flex items-center gap-1 text-caption text-ink-tertiary">
            <Location size={14} color="currentColor" /> {story.meta}
          </p>
        </div>
      </div>
    </>
  );
}
