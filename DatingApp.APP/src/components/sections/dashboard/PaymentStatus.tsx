"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, DocumentText, InfoCircle, ReceiptText } from "iconsax-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui";
import { hasStoredSession } from "@/lib/http";
import { getMyPayments, lkr, openReceipt, type Payment } from "@/lib/billing";

/**
 * Members' payments on the dashboard (S04-T06), all from GET /api/payments/mine:
 *  PaymentStatusNotice — "we're checking your receipt" / "we couldn't confirm your payment" banner
 *  PaymentHistory      — list of payments with status and receipt (inside the plan card)
 */
const day = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const paymentTitle = (p: Payment) =>
  p.product === "boost"
    ? `Profile boost · ${p.days} days`
    : `${p.planId === "platinum" ? "Platinum" : "Gold"} · ${p.months} month${p.months > 1 ? "s" : ""}`;

const checkoutLink = (p: Payment) => (p.product === "boost" ? "/plans/checkout?product=boost" : `/plans/checkout?plan=${p.planId}&months=${p.months}`);

const STATUS: Record<Payment["status"], { label: string; cls: string }> = {
  Pending: { label: "Waiting for receipt", cls: "bg-surface-muted text-ink-secondary" },
  AwaitingReview: { label: "Being checked", cls: "bg-warning-bg text-warning-fg" },
  Approved: { label: "Paid", cls: "bg-success-bg text-success-fg" },
  Rejected: { label: "Not accepted", cls: "bg-error-bg text-error-fg" },
  Cancelled: { label: "Replaced", cls: "bg-surface-muted text-ink-tertiary" },
};

function useMyPayments() {
  const [items, setItems] = useState<Payment[] | null>(null);
  useEffect(() => {
    if (!hasStoredSession()) {
      setItems([]);
      return;
    }
    let alive = true;
    getMyPayments()
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);
  return items;
}

/** Banner under the hero while a receipt is being checked, or after one was turned down (14 days). */
export function PaymentStatusNotice() {
  const items = useMyPayments();
  if (!items || items.length === 0) return null;

  const checking = items.find((p) => p.status === "AwaitingReview");
  if (checking) {
    return (
      <section aria-label="Payment being checked" className="kyc-in flex items-start gap-3 rounded-xl border border-warning-line bg-warning-bg p-4 text-body-sm text-warning-fg sm:items-center">
        <Clock size={22} color="currentColor" className="shrink-0" />
        <p className="flex-1">
          <span className="font-semibold">We’re checking your payment</span> for {paymentTitle(checking)} ({lkr(checking.amount)}, reference{" "}
          <span className="font-mono">{checking.reference}</span>). You’ll get an SMS as soon as it’s confirmed, usually within 24 hours.
        </p>
      </section>
    );
  }

  const latest = items[0];
  const recent = latest.reviewedAt && Date.now() - new Date(latest.reviewedAt).getTime() < 14 * 86_400_000;
  if (latest.status === "Rejected" && recent) {
    return (
      <section aria-label="Payment not accepted" className="kyc-in flex flex-col gap-3 rounded-xl border border-error-line bg-error-bg p-4 text-body-sm text-error-fg sm:flex-row sm:items-center">
        <InfoCircle size={22} color="currentColor" className="shrink-0" />
        <p className="flex-1">
          <span className="font-semibold">We couldn’t confirm your payment {latest.reference}</span>
          {latest.reviewNote ? `: ${latest.reviewNote}.` : "."} Please pay again with a new reference, or contact support if you think this is a mistake.
        </p>
        <Link href={checkoutLink(latest)} className="shrink-0 font-semibold underline underline-offset-4">
          Try again
        </Link>
      </section>
    );
  }
  return null;
}

/** Payment list for the plan card. */
export function PaymentHistory() {
  const toast = useToast();
  const items = useMyPayments();
  if (!items || items.length === 0) return null;

  const open = (p: Payment) =>
    openReceipt(p.id).catch((err) => toast.error("Couldn’t open the receipt", err instanceof Error ? err.message : "Please try again."));

  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-label-lg text-ink">
        <ReceiptText size={18} color="currentColor" className="text-premium-fg" /> Payment history
      </h3>
      <ul className="flex flex-col divide-y divide-line rounded-[16px] border border-line">
        {items.slice(0, 10).map((p) => {
          const st = STATUS[p.status];
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-body-sm">
              <span className="min-w-[160px] flex-1">
                <span className="block font-semibold text-ink">{paymentTitle(p)}</span>
                <span className="block text-body-xs text-ink-tertiary">
                  {day(p.submittedAt ?? p.createdAt)} · <span className="font-mono">{p.reference}</span>
                </span>
                {p.status === "Rejected" && p.reviewNote && <span className="block text-body-xs text-error-fg">{p.reviewNote}</span>}
              </span>
              <span className="font-semibold text-ink">{lkr(p.amount)}</span>
              <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-label-sm", st.cls)}>{st.label}</span>
              {p.hasReceipt && (
                <button
                  type="button"
                  onClick={() => void open(p)}
                  aria-label={`Open receipt for ${p.reference}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-brand-text hover:bg-brand-subtle"
                >
                  <DocumentText size={18} color="currentColor" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
