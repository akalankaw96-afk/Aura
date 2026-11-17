"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Add, Minus, Crown1, TickCircle } from "iconsax-react";
import { Badge, Button } from "@/components/ui";
import { PLAN_PRICES, lkr, type Period } from "@/content/payment";
import { cn } from "@/lib/cn";
import { readPlan } from "@/lib/verification";
import { getPlans } from "@/lib/billing";
import { AuthShell } from "./AuthShell";
import { BackButton } from "@/components/ui/BackButton";

/**
 * Journey 8 · Upgrade plan (Figma 07 Plans).
 * Phase 1 payment = bank transfer: choosing a plan opens /plans/checkout (bank details + receipt upload).
 * Prices live in content/payment.ts (shared with the Payment page).
 */
type PlanId = "free" | "gold" | "platinum";
/** Shown until GET /api/plans answers (and if it can't be reached); the database prices replace them (S04-T01). */
const DEFAULT_PRICES = PLAN_PRICES;
const DEFAULT_SAVE: Record<Period, string | null> = { 1: null, 3: "Save 15%", 6: "Save 25%" };

const PLANS: { id: PlanId; name: string; tagline: string; features: string[] }[] = [
  { id: "free", name: "Free", tagline: "Your current plan", features: ["Create & post your profile", "A few searches and profile views each month", "A few interests and new chats each month", "Safety & privacy controls"] },
  { id: "gold", name: "Gold", tagline: "For serious seekers and families", features: ["Unlimited messages and interest requests", "Unlimited searches and profile views", "See contacts after acceptance", "View horoscopes", "Highlighted in search"] },
  { id: "platinum", name: "Platinum", tagline: "Personal help from our matchmakers", features: ["Everything in Gold", "Dedicated matchmaker", "Hand-picked weekly matches", "Priority verification"] },
];

const FAQ = [
  { q: "Can I stay on the Free plan?", a: "Yes. Your profile stays live and each month you get a few searches, profile views, interests and new chats. Gold removes every limit." },
  { q: "How do I pay?", a: "By bank transfer for now. Choose a plan, transfer the amount to our bank account with your payment reference, then upload the receipt. We activate your plan within 24 hours (Mon–Sat). Card, LankaQR and eZ Cash are coming soon." },
  { q: "Can I cancel?", a: "Plans don’t auto-renew. When your period ends you simply move back to Free. No hidden fees." },
];


export function PlansScreen() {
  const [period, setPeriod] = useState<Period>(3);
  const [current, setCurrent] = useState<PlanId>("free");
  useEffect(() => setCurrent(readPlan()), []);
  const router = useRouter();
  // prices from the database (S04-T01); the admin can change them at any time
  const [PRICES, setPrices] = useState(DEFAULT_PRICES);
  const [SAVE, setSave] = useState(DEFAULT_SAVE);
  useEffect(() => {
    getPlans()
      .then((list) => {
        const next = { gold: { ...DEFAULT_PRICES.gold }, platinum: { ...DEFAULT_PRICES.platinum } };
        const save: Record<Period, string | null> = { 1: null, 3: null, 6: null };
        for (const p of list) {
          if (p.product !== "plan" || (p.planId !== "gold" && p.planId !== "platinum")) continue;
          if (p.months !== 1 && p.months !== 3 && p.months !== 6) continue;
          next[p.planId][p.months as Period] = p.amount;
          if (p.planId === "gold" && p.savePercent) save[p.months as Period] = `Save ${p.savePercent}%`;
        }
        setPrices(next);
        setSave(save);
      })
      .catch(() => undefined); // keep the defaults; the server checks the real price when an order is made
  }, []);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <AuthShell wide frame="member">
      {/* Page header — same as other member pages: Back Button + breadcrumb */}
      <div className="enter flex w-full items-center gap-4">
        <BackButton />
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-body-sm text-ink-tertiary">
          <Link href="/dashboard" className="hover:text-brand-text">
            Dashboard
          </Link>
          <span aria-hidden>/</span>
          <span aria-current="page" className="font-semibold text-brand-text">
            Plans
          </span>
        </nav>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        {current === "free" ? (
          <Badge tone="success">You’re on the Free plan, your profile is live</Badge>
        ) : (
          <Badge tone="premium">You’re on {current === "gold" ? "Gold" : "Platinum"} 🎉</Badge>
        )}
        <h1 className="text-h2 md:text-display-lg">Connect faster with Gold</h1>
        <p className="text-body-md text-ink-secondary md:text-body-lg">Upgrade only when you’re ready. Cancel anytime, no hidden fees.</p>
      </div>

      {/* billing period */}
      <div role="radiogroup" aria-label="Billing period" className="flex w-full max-w-md gap-1 rounded-[28px] border border-line bg-surface-card p-1.5 shadow-sm sm:w-auto sm:max-w-none sm:rounded-full">
        {([1, 3, 6] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={period === p}
            onClick={() => setPeriod(p)}
            className={cn("flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-[22px] px-2 py-1.5 text-body-sm transition-all sm:h-11 sm:flex-none sm:flex-row sm:gap-2 sm:rounded-full sm:px-5 sm:py-0 sm:text-body-md", period === p ? "bg-brand-gradient text-white" : "text-ink hover:bg-surface-subtle")}
          >
            {p} month{p > 1 ? "s" : ""}
            {SAVE[p] && (
              <span className={cn("rounded-full px-2 py-0.5 text-label-sm", period === p ? "bg-surface-card text-brand" : "bg-premium-bg text-premium-fg")}>
                <span className="hidden sm:inline">{SAVE[p]}</span>
                <span className="sm:hidden">{SAVE[p]?.replace("Save ", "−")}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* plan cards — same Pricing Card spec as Home (padding 32, gap 24, radius xl) */}
      <div className="mx-auto grid w-full max-w-xl gap-6 lg:max-w-none lg:grid-cols-3">
        {PLANS.map((plan) => {
          const featured = plan.id === "gold";
          const isCurrent = current === plan.id;
          const price = plan.id === "free" ? 0 : PRICES[plan.id][period];
          return (
            <article
              key={plan.id}
              className={cn("flex min-w-0 flex-col gap-6 rounded-xl p-6 sm:p-8", featured ? "bg-brand-strong text-ink-on-brand shadow-xl" : "border border-line bg-surface-card shadow-sm")}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-h5">{plan.name}</h2>
                {featured && (
                  <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-premium-bg px-2 text-label-sm text-premium-fg">
                    <Crown1 size={14} color="currentColor" /> Most popular
                  </span>
                )}
                {isCurrent && plan.id !== "free" && <Badge tone="success">Your plan</Badge>}
              </div>
              <p className={cn("text-body-md", featured ? "text-ink-on-brand" : "text-ink-secondary")}>{isCurrent ? "Your current plan" : plan.id === "free" ? "Basic access" : plan.tagline}</p>
              <ul className="flex flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className={cn("flex items-center gap-2 text-body-md", featured ? "text-ink-on-brand" : "text-ink")}>
                    <TickCircle size={20} color="currentColor" className={featured ? "text-ink-on-brand" : "text-success-fg"} /> {f}
                  </li>
                ))}
              </ul>
              <div className={cn("h-px", featured ? "bg-brand" : "bg-line")} />
              <p className="flex flex-wrap items-baseline gap-x-1">
                <span className="whitespace-nowrap text-h1">{lkr(price)}</span>
                <span className={cn("text-body-md", featured ? "text-ink-on-brand" : "text-ink-secondary")}>/ {plan.id === "free" ? "forever" : `${period} month${period > 1 ? "s" : ""}`}</span>
              </p>
              {isCurrent ? (
                <Button fullWidth size="md" variant={featured ? "white" : "outline"} disabled>
                  Current plan
                </Button>
              ) : plan.id === "free" ? (
                <Button fullWidth size="md" variant="outline" disabled>
                  Included
                </Button>
              ) : (
                <Button fullWidth size="md" variant={featured ? "white" : "primary"} onClick={() => router.push(`/plans/checkout?plan=${plan.id}&months=${period}`)}>
                  {featured ? "Upgrade to Gold" : "Choose Platinum"}
                </Button>
              )}
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-body-xs text-ink-tertiary">
        Pay with
        <span className="rounded-sm border border-brand-focus bg-brand-subtle px-3 py-1.5 font-semibold text-brand-text">Bank transfer</span>
        {["Visa", "Mastercard", "LankaQR", "eZ Cash"].map((m) => (
          <span key={m} className="rounded-sm border border-line bg-surface-card px-3 py-1.5 text-ink-tertiary opacity-70">
            {m}
          </span>
        ))}
        <span className="text-ink-tertiary">· cards and wallets coming soon</span>
      </div>

      {/* FAQ — same FAQ Item spec as Home */}
      <div className="flex w-full flex-col gap-4">
        {FAQ.map((f, i) => {
          const open = openFaq === i;
          return (
            <div key={f.q} className={cn("rounded-lg border p-6 shadow-sm transition-colors", open ? "border-brand-focus bg-brand-subtle" : "border-line bg-surface-card")}>
              <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? -1 : i)} className="flex w-full items-center gap-4 text-left text-h6 text-ink">
                <span className="flex-1">{f.q}</span>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", open ? "bg-brand text-ink-on-brand" : "bg-surface-muted text-ink")}>
                  {open ? <Minus size={18} color="currentColor" /> : <Add size={18} color="currentColor" />}
                </span>
              </button>
              {open && <p className="mt-3 animate-fade-up text-body-md text-ink-secondary">{f.a}</p>}
            </div>
          );
        })}
      </div>


    </AuthShell>
  );
}
