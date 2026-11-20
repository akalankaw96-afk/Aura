"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DocumentText, EmptyWallet, TickCircle } from "iconsax-react";
import { Badge, Button, Card, Textarea, useToast } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import {
  approvePayment,
  getPaymentQueue,
  lkr,
  openReceipt,
  rejectPayment,
  type PaymentQueueFilter,
  type StaffPayment,
} from "@/lib/billing";

/**
 * Staff payments queue (S04-T04): bank receipts waiting, oldest first. Open the receipt (logged), check it against the
 * bank statement, then approve (starts or extends the plan, member gets an SMS) or reject with a reason they will see.
 */
const FILTERS: { key: PaymentQueueFilter; label: string }[] = [
  { key: "review", label: "To check" },
  { key: "pending", label: "No receipt yet" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const PLAN_LABEL: Record<string, string> = { gold: "Gold", platinum: "Platinum", free: "Free", boost: "Boost" };

const STATUS: Record<StaffPayment["status"], { label: string; tone: BadgeTone }> = {
  Pending: { label: "No receipt yet", tone: "neutral" },
  AwaitingReview: { label: "To check", tone: "warning" },
  Approved: { label: "Approved", tone: "success" },
  Rejected: { label: "Rejected", tone: "error" },
  Cancelled: { label: "Replaced", tone: "neutral" },
};

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-LK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const day = (d?: string | null) =>
  d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

export function AdminPayments() {
  const toast = useToast();
  const [filter, setFilter] = useState<PaymentQueueFilter>("review");
  const [items, setItems] = useState<StaffPayment[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (which: PaymentQueueFilter) => {
    setItems(null);
    try {
      setItems(await getPaymentQueue(which));
    } catch (err) {
      setItems([]);
      toast.error("Couldn’t load payments", err instanceof Error ? err.message : "");
    }
    // toast isn't a stable reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const open = (p: StaffPayment) =>
    openReceipt(p.id).catch((err) => toast.error("Couldn’t open the receipt", err instanceof Error ? err.message : "Please try again."));

  const decide = async (p: StaffPayment, action: "approve" | "reject") => {
    const note = (notes[p.id] ?? "").trim();
    if (action === "reject" && !note) {
      toast.error("Add a reason", "The member sees it, e.g. “The amount on the receipt is LKR 2,000”.");
      return;
    }
    setBusyId(p.id);
    try {
      if (action === "approve") {
        const done = await approvePayment(p.id, note);
        toast.success(`${PLAN_LABEL[done.planId] ?? done.planId} started for ${done.memberName}`, "They got an SMS and an in-app message.");
      } else {
        await rejectPayment(p.id, note);
        toast.success("Payment rejected", `${p.memberName} was told why by SMS.`);
      }
      await load(filter);
    } catch (err) {
      toast.error("That didn’t work", err instanceof Error ? err.message : "");
      await load(filter);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button key={f.key} size="sm" variant={filter === f.key ? "primary" : "outline"} onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => void load(filter)}>
          Refresh
        </Button>
      </div>

      {!items && <p className="text-body-md text-ink-secondary">Loading…</p>}
      {items && items.length === 0 && (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          {filter === "review" ? (
            <TickCircle size={40} color="currentColor" className="text-success-fg" />
          ) : (
            <EmptyWallet size={40} color="currentColor" className="text-ink-tertiary" />
          )}
          <h2 className="text-h5 text-ink">{filter === "review" ? "No receipts to check" : "Nothing here yet"}</h2>
          <p className="text-body-sm text-ink-secondary">Members’ bank receipts appear under “To check”, oldest first.</p>
        </Card>
      )}

      {items && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((p) => {
            const status = STATUS[p.status];
            return (
              <li key={p.id}>
                <Card className="flex flex-col gap-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-label-lg text-ink">
                        {p.memberName} {p.memberCode && <span className="text-body-sm text-ink-tertiary">· {p.memberCode}</span>}
                      </span>
                      <span className="block text-body-sm text-ink-secondary">{p.phoneNumber}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone={status.tone}>{status.label}</Badge>
                        <Badge tone="info">Now on {PLAN_LABEL[p.currentPlan] ?? p.currentPlan}</Badge>
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-h5 text-ink">{lkr(p.amount)}</span>
                      <span className="block text-body-sm text-ink-secondary">
                        {PLAN_LABEL[p.planId] ?? p.planId} · {p.product === "boost" ? `${p.days} days` : `${p.months} month${p.months === 1 ? "" : "s"}`}
                      </span>
                    </span>
                  </div>

                  <dl className="grid gap-3 rounded-lg bg-surface-subtle p-3 text-body-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-caption text-ink-tertiary">Reference</dt>
                      <dd className="font-mono font-semibold text-ink">{p.reference}</dd>
                    </div>
                    <div>
                      <dt className="text-caption text-ink-tertiary">Paid on</dt>
                      <dd className="text-ink">{day(p.paidOn)}</dd>
                    </div>
                    <div>
                      <dt className="text-caption text-ink-tertiary">Receipt sent</dt>
                      <dd className="text-ink">{when(p.submittedAt)}</dd>
                    </div>
                    {p.memberNote && (
                      <div className="sm:col-span-3">
                        <dt className="text-caption text-ink-tertiary">Member’s note</dt>
                        <dd className="text-ink">“{p.memberNote}”</dd>
                      </div>
                    )}
                  </dl>

                  {p.hasReceipt && (
                    <Button size="sm" variant="outline" className="w-fit" leftIcon={<DocumentText size={16} color="currentColor" />} onClick={() => void open(p)}>
                      Open receipt{p.receiptFileName ? ` · ${p.receiptFileName}` : ""}
                    </Button>
                  )}

                  {p.status === "AwaitingReview" ? (
                    <div className="flex flex-col gap-3">
                      <Textarea
                        label="Note"
                        hint="Required to reject · the member sees it"
                        value={notes[p.id] ?? ""}
                        onChange={(v) => setNotes((n) => ({ ...n, [p.id]: v }))}
                        rows={2}
                        maxLength={500}
                        placeholder="What you checked, or why it can’t be accepted"
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="danger" disabled={busyId === p.id} onClick={() => void decide(p, "reject")}>
                          Reject
                        </Button>
                        <Button size="sm" disabled={busyId === p.id} onClick={() => void decide(p, "approve")}>
                          Approve and start plan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    p.reviewedAt && (
                      <p className="text-body-sm text-ink-secondary">
                        {status.label} by {p.reviewedBy ?? "staff"} · {when(p.reviewedAt)}
                        {p.reviewNote ? `: ${p.reviewNote}` : ""}
                      </p>
                    )
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
