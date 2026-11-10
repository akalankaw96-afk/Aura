"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Card as CardIcon,
  Chart,
  CloseCircle,
  Crown1,
  Eye,
  Heart,
  Location,
  Profile2User,
  RecordCircle,
  ScanBarcode,
  TickCircle,
  Timer1,
  Wallet2,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MEMBER } from "@/content/dashboard";
import { useAuthSession } from "@/lib/session";
import { useAccess } from "@/lib/verification";
import { BOOST, OPEN_PROMOTE_EVENT, openPromote, startBoost, useBoost } from "@/lib/promotion";

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const lkr = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;

const PERKS = [
  { Icon: Crown1, title: "Top of matching searches", text: "Shown in the Promoted row for members who match you." },
  { Icon: Eye, title: "Up to 10× more views", text: "A gold card with a “Promoted” badge stands out." },
  { Icon: Profile2User, title: "Only the right people", text: "Shown only to members inside your partner preferences." },
];

/* ------------------------------------------------------------------ */
/* Dashboard card — KYC approved + Pro (Gold / Platinum)               */
/* ------------------------------------------------------------------ */
export function PromoteCard() {
  const { locked, isPaid } = useAccess();
  const boost = useBoost();
  const [bar, setBar] = useState(0);

  useEffect(() => {
    setBar(0);
    if (!boost.active) return;
    const used = Math.max(4, Math.round(((boost.totalDays - boost.daysLeft) / boost.totalDays) * 100));
    const t = window.setTimeout(() => setBar(used), 250);
    return () => window.clearTimeout(t);
  }, [boost.active, boost.daysLeft, boost.totalDays]);

  if (locked || !isPaid) return null;

  // Active boost — status + results
  if (boost.active && boost.ends) {
    return (
      <section aria-label="Profile promotion" className="kyc-in promo-shine flex flex-col gap-5 rounded-xl border border-premium-line bg-premium-bg p-5 sm:p-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-md">
            <Crown1 size={26} color="currentColor" />
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full bg-success-fg ring-2 ring-white" />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h5 text-ink">Your profile is promoted</h2>
              <span className="promo-badge inline-flex h-[22px] items-center gap-1 rounded-full bg-surface-card px-2 text-label-sm text-premium-fg ring-1 ring-inset ring-premium-line">
                <Crown1 size={14} color="currentColor" /> Promoted
              </span>
            </div>
            <div className="h-2 w-full max-w-[360px] overflow-hidden rounded-full bg-surface-card" role="progressbar" aria-label="Promotion period used" aria-valuenow={bar} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--gold-300),var(--gold-500))] transition-[width] duration-1000 ease-out" style={{ width: `${bar}%` }} />
            </div>
            <p className="flex items-center gap-1.5 text-body-sm text-ink-secondary">
              <Timer1 size={16} color="currentColor" className="text-premium-fg" />
              {boost.daysLeft} day{boost.daysLeft === 1 ? "" : "s"} left · ends {fmt(boost.ends)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:w-[300px]">
          {[
            { Icon: Eye, value: boost.views, label: "Extra views" },
            { Icon: Heart, value: boost.interests, label: "New interests" },
          ].map(({ Icon, value, label }) => (
            <div key={label} className="flex flex-col gap-1 rounded-[16px] bg-surface-card p-3 shadow-xs">
              <Icon size={18} color="currentColor" className="text-premium-fg" />
              <span className="text-h5 text-ink">+{value}</span>
              <span className="text-caption text-ink-tertiary">{label}</span>
            </div>
          ))}
        </div>

        <Button variant="secondary" className="rounded-full" onClick={openPromote}>
          Extend 7 days
        </Button>
      </section>
    );
  }

  // Not promoted yet — offer
  return (
    <section aria-label="Promote your profile" className="kyc-in promo-shine flex flex-col gap-5 rounded-xl border border-premium-line bg-premium-bg p-5 sm:p-6 md:flex-row md:items-center">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-md">
        <Chart size={26} color="currentColor" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-h5 text-ink">Promote your profile</h2>
        <p className="text-body-sm text-ink-secondary">
          Appear at the top of matching searches with a gold <span className="font-semibold text-premium-fg">Promoted</span> badge for {BOOST.days} days — get up to 10× more views.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4 max-md:justify-between">
        <span className="flex flex-col items-end leading-tight">
          <span className="text-h5 text-ink">{lkr(BOOST.price)}</span>
          <span className="text-caption text-ink-tertiary">{BOOST.days} days · one-time</span>
        </span>
        <button
          type="button"
          onClick={openPromote}
          className="flex h-12 items-center gap-2 rounded-full bg-brand-gradient px-6 text-button-md text-ink-on-brand shadow-sm transition-shadow hover:shadow-glow active:scale-[0.98]"
        >
          <Crown1 size={18} color="currentColor" /> Promote my profile
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Promote flow — review → pay → promoted                             */
/* ------------------------------------------------------------------ */
type Step = "review" | "paying" | "done";
const METHODS = [
  { id: "saved", Icon: CardIcon, label: "Visa •••• 4242", hint: "Saved card" },
  { id: "qr", Icon: ScanBarcode, label: "LankaQR", hint: "Any banking app" },
  { id: "ez", Icon: Wallet2, label: "eZ Cash", hint: "Dialog wallet" },
];

export function PromoteModal() {
  const toast = useToast();
  const { locked, isPaid } = useAccess();
  const boost = useBoost();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [step, setStep] = useState<Step>("review");
  const [method, setMethod] = useState("saved");
  // snapshot of what was bought (the boost state changes right after paying)
  const [paid, setPaid] = useState<{ extending: boolean; start: Date; end: Date } | null>(null);
  const { profileCode, photoUrl } = useAuthSession();
  const memberId = profileCode || "Your Profile";
  const memberPhoto = photoUrl || MEMBER.photo;

  // open from the card, from ?promote=1 (Search → "Promote your profile"), or the event
  useEffect(() => {
    const show = () => {
      setStep("review");
      setMethod("saved");
      setClosing(false);
      setOpen(true);
    };
    window.addEventListener(OPEN_PROMOTE_EVENT, show);
    const url = new URL(window.location.href);
    if (url.searchParams.get("promote")) {
      url.searchParams.delete("promote");
      window.history.replaceState(null, "", url);
      window.setTimeout(show, 600);
    }
    return () => window.removeEventListener(OPEN_PROMOTE_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && step !== "paying" && close();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  if (!open || typeof document === "undefined") return null;
  // only approved Pro members can promote
  if (locked || !isPaid) return null;

  function close() {
    setClosing(true);
    window.setTimeout(() => setOpen(false), 180);
  }
  const extending = boost.active && !!boost.ends;
  const startDate = extending && boost.ends ? boost.ends : new Date();
  const endDate = new Date(startDate.getTime() + BOOST.days * 86_400_000);

  const pay = () => {
    setPaid({ extending, start: startDate, end: endDate });
    setStep("paying");
    window.setTimeout(() => {
      startBoost(BOOST.days);
      setStep("done");
      toast.success(extending ? "Promotion extended" : "Your profile is promoted", `Live in Promoted profiles until ${fmt(endDate)}.`);
    }, 1400);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden onClick={() => step !== "paying" && close()} className={cn("absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200", closing ? "opacity-0" : "animate-fade-in")} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promote-title"
        className={cn(
          "relative flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-y-auto rounded-t-xl bg-surface-card shadow-xl transition-all duration-200 sm:rounded-xl",
          closing ? "translate-y-4 opacity-0" : "animate-dialog-in",
        )}
      >
        {step !== "paying" && (
          <button type="button" aria-label="Close" onClick={close} className={cn("absolute right-4 top-4 z-10 transition-colors", step === "done" ? "text-ink-tertiary hover:text-ink" : "text-[rgba(255,255,255,0.8)] hover:text-white")}>
            <CloseCircle size={24} color="currentColor" />
          </button>
        )}

        {step === "done" ? (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <span className="kyc-pop flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-lg">
              <Crown1 size={40} color="currentColor" />
            </span>
            <h2 id="promote-title" className="text-h4 text-ink">
              {paid?.extending ? "Promotion extended!" : "You’re promoted!"}
            </h2>
            <p className="max-w-[360px] text-body-md text-ink-secondary">
              {memberId} now appears at the top of matching searches until <span className="font-semibold text-ink">{fmt(paid?.end ?? endDate)}</span>. We’ll show your extra views and interests on your dashboard.
            </p>
            <div className="flex w-full flex-col gap-2 rounded-[16px] bg-surface-subtle p-4 text-left text-body-sm">
              <Row label="Paid" value={`${lkr(BOOST.price)} · ${METHODS.find((m) => m.id === method)?.label}`} />
              <Row label="Promoted" value={`${fmt(paid?.start ?? startDate)} – ${fmt(paid?.end ?? endDate)}`} />
              <Row label="Receipt" value="Sent to your email" />
            </div>
            <Button className="w-full" onClick={close}>
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* Header with preview */}
            <div className="relative overflow-hidden rounded-t-xl bg-[linear-gradient(120deg,var(--gold-900)_0%,var(--gold-700)_55%,var(--gold-500)_100%)] px-6 pb-6 pt-7 text-white">
              <p className="flex items-center gap-1.5 text-label-sm uppercase tracking-wide text-[rgba(255,255,255,0.8)]">
                <Crown1 size={14} color="currentColor" /> Profile boost
              </p>
              <h2 id="promote-title" className="mt-1 text-h4 text-white">
                {extending ? "Extend your promotion" : "Promote your profile"}
              </h2>
              {/* how your card looks while promoted */}
              <div className="promo-shine mt-5 flex items-center gap-3 rounded-[16px] bg-premium-bg p-3 text-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={memberPhoto} alt="" className="h-14 w-14 shrink-0 rounded-[12px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-label-lg">
                    {memberId}
                    <span className="promo-badge inline-flex h-[20px] items-center gap-1 rounded-full bg-surface-card px-2 text-label-sm text-premium-fg">
                      <Crown1 size={12} color="currentColor" /> Promoted
                    </span>
                  </p>
                  <p className="flex items-center gap-1 truncate text-body-xs text-ink-tertiary">
                    <Location size={12} color="currentColor" /> Top of matching searches
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-6">
              <ul className="flex flex-col gap-3">
                {PERKS.map(({ Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-premium-bg text-premium-fg">
                      <Icon size={18} color="currentColor" />
                    </span>
                    <span className="text-body-sm">
                      <span className="block font-semibold text-ink">{title}</span>
                      <span className="text-ink-secondary">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {/* Package */}
              <div className="flex items-center gap-3 rounded-[16px] border-2 border-brand bg-brand-subtle p-4">
                <RecordCircle size={22} color="currentColor" variant="Bold" className="shrink-0 text-brand" />
                <div className="flex-1">
                  <p className="text-label-lg text-ink">{BOOST.days}-day boost</p>
                  <p className="text-body-xs text-ink-secondary">
                    {fmt(startDate)} – {fmt(endDate)}
                    {extending && " · added after your current boost"}
                  </p>
                </div>
                <span className="text-h5 text-ink">{lkr(BOOST.price)}</span>
              </div>

              {/* Payment method */}
              <fieldset className="flex flex-col gap-2" disabled={step === "paying"}>
                <legend className="mb-2 text-label-md text-ink">Pay with</legend>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map(({ id, Icon, label, hint }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={method === id}
                      onClick={() => setMethod(id)}
                      className={cn(
                        "relative flex flex-col items-start gap-1 rounded-[14px] border p-3 text-left transition-colors",
                        method === id ? "border-brand bg-brand-subtle ring-1 ring-inset ring-brand" : "border-line hover:border-brand-focus",
                      )}
                    >
                      <Icon size={20} color="currentColor" className={method === id ? "text-brand" : "text-ink-tertiary"} />
                      <span className="text-label-sm text-ink">{label}</span>
                      <span className="text-caption text-ink-tertiary">{hint}</span>
                      {method === id && <TickCircle size={16} color="currentColor" variant="Bold" className="absolute right-2 top-2 text-brand" />}
                    </button>
                  ))}
                </div>
              </fieldset>

              <Button size="lg" className="w-full" disabled={step === "paying"} onClick={pay}>
                {step === "paying" ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Processing payment…
                  </>
                ) : (
                  <>
                    <Crown1 size={20} color="currentColor" /> Pay {lkr(BOOST.price)} & promote
                  </>
                )}
              </Button>
              <p className="-mt-2 text-center text-caption text-ink-tertiary">One-time payment · no auto-renew · secure checkout</p>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-tertiary">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}
