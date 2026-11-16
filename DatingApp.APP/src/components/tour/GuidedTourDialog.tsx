"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CloseCircle, Crown1, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button, LoveSticker } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useAccess } from "@/lib/verification";
import { HOW_TO_USE, type TourItem } from "@/content/howToUse";
import { TOUR_EVENT, TOUR_ITEM_IDS, setTourStatus } from "@/lib/tour";

/**
 * Gold / Platinum guided tour — a step-by-step popup with the real app screenshots
 * (content and screens from content/howToUse.ts → full tour). Mounted once in the root layout,
 * opened with openTour(). Paid members only: anyone else is ignored.
 * Desktop: screenshot left, text right · Phones: bottom sheet, screenshot on top.
 * Keyboard: ← / → to move, Esc to close.
 */
export function GuidedTourDialog() {
  const { lang } = useLanguage();
  const { isPaid, locked } = useAccess();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  const c = HOW_TO_USE[lang] ?? HOW_TO_USE.en;
  const slides = useMemo(() => {
    const all = c.groups.flatMap((g) => g.items);
    return TOUR_ITEM_IDS.map((id) => all.find((it) => it.id === id)).filter(Boolean) as TourItem[];
  }, [c]);

  useEffect(() => {
    const onOpen = () => {
      if (locked || !isPaid) return;
      setI(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_EVENT, onOpen);
    return () => window.removeEventListener(TOUR_EVENT, onOpen);
  }, [isPaid, locked]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!open || !d) return;
    const prev = document.documentElement.style.overflow;
    d.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      d.close();
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  const n = slides.length;
  const last = i === n; // final "you're all set" slide

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((x) => Math.min(n, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, n]);

  if (!open || !n) return null;

  const close = (finished = false) => {
    setTourStatus(finished || last ? "done" : "later");
    setOpen(false);
  };
  const item = slides[Math.min(i, n - 1)];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tour-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/55 backdrop:backdrop-blur-md"
    >
      <div className="flex h-full items-end justify-center sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
        <div className="relative flex max-h-full w-full max-w-[880px] animate-dialog-in flex-col overflow-hidden rounded-t-[28px] bg-surface-card shadow-xl sm:rounded-[28px]">
          {/* header: progress + skip */}
          <div className="flex items-center gap-3 border-b border-line px-5 py-3 sm:px-6">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-premium-bg px-2.5 text-label-sm text-premium-fg">
              <Crown1 size={14} color="currentColor" /> Gold tour
            </span>
            <div className="flex flex-1 items-center gap-1.5" aria-label={last ? "Tour complete" : `Step ${i + 1} of ${n}`}>
              {slides.map((s, k) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setI(k)}
                  aria-label={`Go to step ${k + 1}: ${s.title}`}
                  className={cn("h-1.5 flex-1 rounded-full transition-colors", progressTone(k, i, last))}
                />
              ))}
            </div>
            {!last && (
              <button type="button" onClick={() => close()} className="text-label-sm text-ink-tertiary hover:text-ink">
                Skip tour
              </button>
            )}
            <button type="button" onClick={() => close()} aria-label="Close" className="rounded-full p-1 text-ink-tertiary hover:text-ink focus-visible:outline-none focus-visible:shadow-ring-brand">
              <CloseCircle size={22} color="currentColor" />
            </button>
          </div>

          {last ? (
            /* final slide */
            <div key="done" className="flex animate-fade-up flex-col items-center gap-4 overflow-y-auto px-6 py-10 text-center">
              <span className="relative">
                <span className="kyc-pop flex h-20 w-20 items-center justify-center rounded-full bg-success-bg text-success-fg">
                  <TickCircle size={44} color="currentColor" variant="Bold" />
                </span>
                <LoveSticker variant="double" size={36} rotate={14} className="absolute -right-6 -top-3" />
              </span>
              <h2 id="tour-title" className="text-h3 text-ink">
                You’re all set
              </h2>
              <p className="max-w-[460px] text-body-md text-ink-secondary">
                That’s everything Gold unlocks. Find your match, start chatting, and share contacts when you’re both ready.
              </p>
              <div className="mt-2 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row">
                <Button size="lg" className="sm:flex-1" onClick={() => close(true)}>
                  Start exploring
                </Button>
                <Link
                  href="/how-to-use#tour"
                  onClick={() => close(true)}
                  className="flex h-12 items-center justify-center rounded-full px-5 text-button-md text-brand-text ring-1 ring-inset ring-brand hover:bg-brand-subtle sm:flex-1"
                >
                  Open the full guide
                </Link>
              </div>
            </div>
          ) : (
            <div key={item.id} className="grid min-h-0 animate-fade-up overflow-y-auto sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
              {/* screenshot */}
              <div className="relative flex items-center justify-center bg-[linear-gradient(180deg,var(--color-bg-brand-subtle),var(--color-surface-card))] px-6 py-6 sm:py-10">
                <LoveSticker variant="outline" size={36} rotate={-14} className="absolute left-6 top-6 opacity-70" />
                <figure className="w-[46%] max-w-[230px] -rotate-2 rounded-[28px] bg-gray-900 p-1.5 shadow-xl ring-1 ring-line sm:w-[72%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.shots[0].src} alt={item.shots[0].alt} width={585} height={1266} className="block h-auto w-full rounded-[22px]" />
                </figure>
              </div>
              {/* text */}
              <div className="flex flex-col gap-4 p-5 sm:p-8">
                <p className="text-overline uppercase text-brand-text">
                  Step {i + 1} of {n}
                </p>
                <h2 id="tour-title" className="text-h4 text-ink">
                  {item.title}
                </h2>
                <p className="text-body-md text-ink-secondary">{item.summary}</p>
                <ul className="flex flex-col gap-2">
                  {item.bullets.slice(0, 3).map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-body-sm text-ink-secondary">
                      <TickCircle size={18} color="currentColor" variant="Bold" className="mt-0.5 shrink-0 text-brand" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <span className="inline-flex w-fit items-center rounded-full bg-brand-subtle px-3 py-1.5 text-label-sm text-brand-text">
                  {c.whereLabel}: {item.where}
                </span>
                <div className="mt-auto flex gap-3 pt-2">
                  <Button variant="outline" size="md" disabled={i === 0} onClick={() => setI((x) => x - 1)} leftIcon={<ArrowLeft size={18} color="currentColor" />}>
                    Back
                  </Button>
                  <Button size="md" fullWidth onClick={() => setI((x) => x + 1)} rightIcon={<ArrowRight size={18} color="currentColor" />}>
                    {i === n - 1 ? "Finish" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

/** Progress bar segment: done (or last slide) · current · still to come. */
function progressTone(k: number, current: number, last: boolean) {
  if (k < current || last) return "bg-brand";
  if (k === current) return "bg-brand-focus";
  return "bg-line-strong";
}
