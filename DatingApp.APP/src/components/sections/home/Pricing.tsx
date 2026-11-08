import React from "react";
import Link from "next/link";
import { Crown1, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PRICING } from "@/content/home";

/**
 * Figma: 06 Pricing — padding 96/80, gap 48. Three Pricing Cards
 * (384 × 458, padding 32, gap 24, radius xl). Gold = bg-brand-strong.
 * Mobile: Gold first (Figma: Home — Mobile 390).
 */
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-28 py-16 lg:py-24">
      <div className="container-page flex flex-col gap-12">
        <SectionHeader eyebrow={PRICING.eyebrow} title={PRICING.title} description={PRICING.description} />
        <div className="mx-auto grid w-full max-w-[1216px] gap-6 md:grid-cols-3 md:gap-8">
          {PRICING.plans.map((p) => {
            const gold = !!p.popular;
            return (
              <article
                key={p.id}
                className={cn(
                  "flex flex-col gap-6 rounded-xl p-8",
                  gold ? "order-first bg-brand-strong text-ink-on-brand shadow-xl md:order-none" : "border border-line bg-surface-card shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-h5">{p.name}</h3>
                  {gold && (
                    <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-premium-bg px-2 text-label-sm text-premium-fg">
                      <Crown1 size={14} color="currentColor" /> Most popular
                    </span>
                  )}
                </div>
                <p className={cn("text-body-md", gold ? "text-ink-on-brand" : "text-ink-secondary")}>{p.description}</p>
                <ul className="flex flex-col gap-3">
                  {p.features.map((f) => (
                    <li key={f} className={cn("flex items-center gap-2 text-body-md", gold ? "text-ink-on-brand" : "text-ink")}>
                      <TickCircle size={20} color="currentColor" className={gold ? "text-ink-on-brand" : "text-success-fg"} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={cn("h-px", gold ? "bg-brand" : "bg-line")} />
                <p className="flex items-baseline gap-1">
                  <span className="text-h1">{p.price}</span>
                  <span className={cn("text-body-md", gold ? "text-ink-on-brand" : "text-ink-secondary")}>{p.period}</span>
                </p>
                <Link
                  href={p.href}
                  className={cn(
                    "flex h-[43px] items-center justify-center rounded-full px-6 text-button-md transition-shadow",
                    gold ? "bg-brand-subtle text-brand-text hover:shadow-lg" : "bg-brand-gradient text-ink-on-brand hover:shadow-glow"
                  )}
                >
                  {p.cta}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
