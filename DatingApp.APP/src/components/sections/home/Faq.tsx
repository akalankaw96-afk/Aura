"use client";

import React, { useId, useState } from "react";
import { Add, Call, Minus } from "iconsax-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useLanguage } from "@/context/LanguageContext";
import { FAQ } from "@/content/home";

/**
 * Figma: 07 FAQ — two columns (Intro 400 + Accordion 816, gap 64).
 * FAQ Item: padding 24, gap 12, radius lg. Open item = brand-subtle fill +
 * border-focus, minus toggle on bg-brand; closed = plus on bg-muted.
 */
export function Faq() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(0);
  const base = useId();

  return (
    <section id="faq" className="scroll-mt-28 py-16 lg:py-24">
      <div className="container-page grid gap-8 lg:grid-cols-[400px_1fr] lg:gap-16">
        <div className="flex flex-col gap-8">
          <SectionHeader align="left" eyebrow={t.faq.eyebrow} title={t.faq.title} description={t.faq.description} className="max-lg:mx-auto max-lg:items-center max-lg:text-center" />
          <HelpCard className="hidden lg:flex" />
        </div>

        <div className="reveal-stagger flex flex-col gap-4">
          {t.faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={cn("rounded-lg border p-6 shadow-sm transition-colors", isOpen ? "border-brand-focus bg-brand-subtle" : "border-line bg-surface-card")}>
                <h3>
                  <button
                    type="button"
                    id={`${base}-q${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`${base}-a${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center gap-4 text-left text-h6 text-ink"
                  >
                    <span className="flex-1">{item.q}</span>
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", isOpen ? "bg-brand text-ink-on-brand" : "bg-surface-muted text-ink")}>
                      {isOpen ? <Minus size={18} color="currentColor" /> : <Add size={18} color="currentColor" />}
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <p id={`${base}-a${i}`} role="region" aria-labelledby={`${base}-q${i}`} className="mt-3 animate-fade-up text-body-md text-ink-secondary">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <HelpCard className="lg:hidden" />
      </div>
    </section>
  );
}

/** Figma: Help card — 400 × 227, padding 24, gap 12, radius xl */
function HelpCard({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-xl border border-line bg-surface-card p-6", className)}>
      <Call size={28} color="currentColor" className="text-icon-brand" />
      <p className="text-h6 text-ink">{t.faq.helpTitle}</p>
      <p className="text-body-md text-ink-secondary">{t.faq.helpText}</p>
      <a href={FAQ.help.href} className="flex h-[43px] items-center rounded-full bg-brand-subtle px-6 text-button-md text-brand-text ring-1 ring-inset ring-brand">
        {t.faq.helpCta}
      </a>
    </div>
  );
}
