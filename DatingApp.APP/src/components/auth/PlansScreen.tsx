"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Add, Minus, Card as CardIcon, Crown1, Lock1, TickCircle } from "iconsax-react";
import { Alert, Badge, Button, Card, Input, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { saveDraft } from "@/lib/demo";
import { readPlan, setPlan } from "@/lib/verification";
import { AuthShell } from "./AuthShell";
import { BackButton } from "@/components/ui/BackButton";
import { DemoTips } from "./DemoTips";
import { DEMO } from "./shared";

/**
 * Journey 8 · Upgrade plan (Figma 07 Plans, 07a payment failed, 07b upgraded).
 * Payment is simulated — no gateway is called.
 */
type Period = 1 | 3 | 6;
type PlanId = "free" | "gold" | "platinum";

const PRICES: Record<Exclude<PlanId, "free">, Record<Period, number>> = {
  gold: { 1: 2500, 3: 6375, 6: 11250 },
  platinum: { 1: 6500, 3: 16575, 6: 29250 },
};
const SAVE: Record<Period, string | null> = { 1: null, 3: "Save 15%", 6: "Save 25%" };

const PLANS: { id: PlanId; name: string; tagline: string; features: string[] }[] = [
  { id: "free", name: "Free", tagline: "Your current plan", features: ["Create & post your profile", "3 searches per month", "5 profile views per month", "Safety & privacy controls"] },
  { id: "gold", name: "Gold", tagline: "For serious seekers and families", features: ["Unlimited messages and interest requests", "Unlimited searches and profile views", "See contacts after acceptance", "View horoscopes", "Highlighted in search"] },
  { id: "platinum", name: "Platinum", tagline: "Personal help from our matchmakers", features: ["Everything in Gold", "Dedicated matchmaker", "Hand-picked weekly matches", "Priority verification"] },
];

const FAQ = [
  { q: "Can I stay on the Free plan?", a: "Yes. Your profile stays live and you get 3 searches and 5 profile views each month. Gold unlocks messages and interest requests." },
  { q: "Is my payment secure?", a: "Payments are processed by a PCI-DSS certified gateway. We never store your full card number." },
  { q: "Can I cancel?", a: "Plans don’t auto-renew. When your period ends you simply move back to Free — no hidden fees." },
];

const lkr = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;

export function PlansScreen() {
  const toast = useToast();
  const [period, setPeriod] = useState<Period>(3);
  const [current, setCurrent] = useState<PlanId>("free");
  useEffect(() => setCurrent(readPlan()), []);
  const [paying, setPaying] = useState<Exclude<PlanId, "free"> | null>(null);
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
          <Badge tone="success">You’re on the Free plan — your profile is live</Badge>
        ) : (
          <Badge tone="premium">You’re on {current === "gold" ? "Gold" : "Platinum"} 🎉</Badge>
        )}
        <h1 className="text-h2 md:text-display-lg">Connect faster with Gold</h1>
        <p className="text-body-md text-ink-secondary md:text-body-lg">Upgrade only when you’re ready. Cancel anytime — no hidden fees.</p>
      </div>

      {/* billing period */}
      <div role="radiogroup" aria-label="Billing period" className="flex gap-1 rounded-full border border-line bg-surface-card p-1.5 shadow-sm">
        {([1, 3, 6] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={period === p}
            onClick={() => setPeriod(p)}
            className={cn("flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-body-sm transition-all sm:gap-2 sm:px-5 sm:text-body-md", period === p ? "bg-brand-gradient text-white" : "text-ink hover:bg-surface-subtle")}
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
      <div className="grid w-full gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const featured = plan.id === "gold";
          const isCurrent = current === plan.id;
          const price = plan.id === "free" ? 0 : PRICES[plan.id][period];
          return (
            <article
              key={plan.id}
              className={cn("flex flex-col gap-6 rounded-xl p-8", featured ? "bg-brand-strong text-ink-on-brand shadow-xl" : "border border-line bg-surface-card shadow-sm")}
            >
              <div className="flex items-center justify-between">
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
              <p className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-h1">{lkr(price)}</span>
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
                <Button fullWidth size="md" variant={featured ? "white" : "primary"} onClick={() => setPaying(plan.id as "gold" | "platinum")}>
                  {featured ? "Upgrade to Gold" : "Choose Platinum"}
                </Button>
              )}
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-body-xs text-ink-tertiary">
        Pay with
        {["Visa", "Mastercard", "LankaQR", "eZ Cash", "Bank transfer"].map((m) => (
          <span key={m} className="rounded-sm border border-line bg-surface-card px-3 py-1.5 text-ink-secondary">
            {m}
          </span>
        ))}
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

      {paying && (
        <PaymentSheet
          plan={paying}
          period={period}
          amount={PRICES[paying][period]}
          onClose={() => setPaying(null)}
          onPaid={() => {
            setCurrent(paying);
            saveDraft({ plan: paying });
            setPlan(paying, period); // unlocks the paid features on the Dashboard (expiry = period)
            setPaying(null);
            toast.success(`You’re now ${paying === "gold" ? "Gold" : "Platinum"}!`, "Unlimited interests are unlocked. Happy matching!");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      <DemoTips tips={[{ label: "Any card number → payment works" }, { label: "Failing card", value: DEMO.failingCard }]} />
    </AuthShell>
  );
}

/* ── Payment sheet (07a payment failed) ─────────────────── */

function PaymentSheet({ plan, period, amount, onClose, onPaid }: { plan: "gold" | "platinum"; period: Period; amount: number; onClose: () => void; onPaid: () => void }) {
  const toast = useToast();
  const [method, setMethod] = useState("Card");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<{ card?: string; exp?: string; cvc?: string }>({});
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const pay = () => {
    setFailed(false);
    if (method === "Card") {
      const er: typeof errors = {};
      if (card.replace(/\s/g, "").length < 16) er.card = "Enter your 16-digit card number";
      if (!/^\d{2}\/\d{2}$/.test(exp)) er.exp = "MM/YY";
      if (!/^\d{3}$/.test(cvc)) er.cvc = "3 digits";
      setErrors(er);
      if (Object.keys(er).length) return;
    }
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      if (method === "Card" && card === DEMO.failingCard) {
        setFailed(true);
        toast.error("Payment failed", "Your bank declined the payment. You haven’t been charged.");
        return;
      }
      onPaid();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-surface-scrim p-0 sm:items-center sm:p-4" onClick={onClose}>
      <Card className="w-full max-w-[480px] animate-fade-up rounded-b-none p-6 sm:rounded-b-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-body-sm text-ink-tertiary">Upgrade to</p>
            <h2 className="text-h4">
              {plan === "gold" ? "Gold" : "Platinum"} · {period} month{period > 1 ? "s" : ""}
            </h2>
          </div>
          <p className="text-h5 font-extrabold text-brand">{lkr(amount)}</p>
        </div>

        {failed && (
          <Alert type="error" title="Payment failed" className="mb-4" action={<button type="button" onClick={() => setMethod("LankaQR")} className="font-bold text-brand hover:underline">Try another method</button>}>
            Your bank declined this card. You haven’t been charged.
          </Alert>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {["Card", "LankaQR", "eZ Cash", "Bank transfer"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMethod(m); setFailed(false); }}
              className={cn("h-9 rounded-full border px-3.5 text-body-sm font-semibold", method === m ? "border-transparent bg-brand-gradient text-white" : "border-line-strong bg-surface-card hover:border-brand")}
            >
              {m}
            </button>
          ))}
        </div>

        {method === "Card" ? (
          <div className="space-y-4">
            <Input
              label="Card number"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              icon={<CardIcon size={20} color="currentColor" />}
              value={card}
              onChange={(e) => {
                setCard(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "));
                setErrors((x) => ({ ...x, card: undefined }));
                setFailed(false);
              }}
              error={errors.card}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry"
                placeholder="MM/YY"
                inputMode="numeric"
                value={exp}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                  setErrors((x) => ({ ...x, exp: undefined }));
                }}
                error={errors.exp}
              />
              <Input label="CVC" placeholder="123" inputMode="numeric" value={cvc} onChange={(e) => { setCvc(e.target.value.replace(/\D/g, "").slice(0, 3)); setErrors((x) => ({ ...x, cvc: undefined })); }} error={errors.cvc} />
            </div>
          </div>
        ) : (
          <Alert type="info" title={`Pay with ${method}`}>
            {method === "Bank transfer" ? "We’ll show our bank details and activate your plan once the receipt is checked (usually 2 hours)." : "You’ll be redirected to complete the payment. (Simulated in this prototype.)"}
          </Alert>
        )}

        <Button fullWidth className="mt-6" loading={loading} leftIcon={<Lock1 size={18} color="currentColor" />} onClick={pay}>
          Pay {lkr(amount)}
        </Button>
        <button type="button" onClick={onClose} className="mt-3 w-full text-center text-body-sm font-semibold text-ink-secondary hover:text-ink">
          Cancel
        </button>
        <p className="mt-3 text-center text-body-xs text-ink-tertiary">Demo: use {DEMO.failingCard} to see a failed payment.</p>
      </Card>
    </div>
  );
}
