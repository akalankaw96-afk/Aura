"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown2,
  Bank,
  Clock,
  Copy,
  CopySuccess,
  Crown1,
  DocumentDownload,
  DocumentText,
  DocumentUpload,
  Edit2,
  ReceiptText,
  ScanBarcode,
  SecuritySafe,
  TickCircle,
  Trash,
  WalletMoney,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { MemberShell } from "@/components/layout/MemberShell";
import { Button, ButtonLink, Input, LoveSticker, PinNote, SegmentedTabs, Textarea, useToast } from "@/components/ui";
import { CopyButton, useCopy } from "@/components/ui/CopyButton";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { ApiError } from "@/lib/http";
import { BOOST } from "@/lib/promotion";
import {
  createBankTransfer,
  createBoostTransfer,
  getMyPayments,
  getPaymentMethods,
  uploadReceipt,
  type BankAccount,
  type Payment,
  type PaymentMethods,
  type PaymentQr,
} from "@/lib/billing";
import {
  BANK_ACCOUNTS,
  PAYMENT_QR,
  PERIODS,
  PLAN_NAME,
  PLAN_PRICES,
  RECEIPT_MAX_MB,
  RECEIPT_TYPES,
  REVIEW_TIME,
  lkr,
  type PaidPlan,
  type Period,
} from "@/content/payment";

/**
 * Payment page (/plans/checkout?plan=gold&months=3, or ?product=boost) — phase 1: bank transfer only (S04-T03, T05).
 * 1. Order summary + the member's payment reference (order made by the API: amount from the price list)
 * 2. "How to pay" card: Bank accounts tab (one collapsible section per bank, copy buttons) and QR code tab
 *    (one collapsible LankaQR code per bank) — from GET /api/payments/methods
 * 3. How to pay — pinned notes, same style as Home → How it works
 * 4. Upload the bank receipt (photo or PDF) → POST /api/payments/{id}/receipt
 * After submit the member sees "Payment under review" on every device (GET /api/payments/mine).
 */
type Pending = { title: string; outcome: string; amount: number; reference: string; fileName: string };

/** "Gold · 3 months" / "Profile boost · 7 days" */
const productTitle = (p: Pick<Payment, "product" | "planId" | "months" | "days">) =>
  p.product === "boost"
    ? `Profile boost · ${p.days} days`
    : `${PLAN_NAME[p.planId === "platinum" ? "platinum" : "gold"]} · ${p.months} month${p.months > 1 ? "s" : ""}`;

const toPending = (p: Payment): Pending => ({
  title: productTitle(p),
  outcome: p.product === "boost" ? "Profile promoted" : `${PLAN_NAME[p.planId === "platinum" ? "platinum" : "gold"]} activated`,
  amount: p.amount,
  reference: p.reference,
  fileName: p.receiptFileName || "Receipt",
});

export function BankTransferScreen() {
  const params = useSearchParams();
  const toast = useToast();
  const isBoost = params.get("product") === "boost";
  const wantedPlan: PaidPlan = params.get("plan") === "platinum" ? "platinum" : "gold";
  const m = Number(params.get("months"));
  const wantedMonths: Period = (PERIODS as number[]).includes(m) ? (m as Period) : 3;

  const [order, setOrder] = useState<Payment | null>(null);
  const [methods, setMethods] = useState<PaymentMethods>({ accounts: BANK_ACCOUNTS, qrCodes: PAYMENT_QR });
  const [underReview, setUnderReview] = useState<Payment | null>(null);
  const [rejected, setRejected] = useState<Payment | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const uploadRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    getPaymentMethods().then((m) => { if (!cancelled) setMethods(m); }).catch(() => {});
    (async () => {
      try {
        const mine = (await getMyPayments()).filter((p) => p.product === (isBoost ? "boost" : "plan"));
        if (cancelled) return;
        const waiting = mine.find((p) => p.status === "AwaitingReview");
        if (waiting) {
          setUnderReview(waiting);
          setOrder(waiting);
          return;
        }
        const last = mine[0];
        if (last?.status === "Rejected") setRejected(last);
        const created = isBoost ? await createBoostTransfer(BOOST.days) : await createBankTransfer(wantedPlan, wantedMonths);
        if (!cancelled) setOrder(created);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "PAYMENT_UNDER_REVIEW") {
          window.location.reload();
          return;
        }
        setLoadError(err instanceof Error ? err.message : "We couldn’t start your payment. Please try again.");
      }
    })();
    return () => { cancelled = true; };
  }, [isBoost, wantedPlan, wantedMonths]);

  // while a receipt is being checked the page shows that order, whatever the link asked for
  const plan: PaidPlan = order?.planId === "platinum" ? "platinum" : order ? "gold" : wantedPlan;
  const months: Period = order && (PERIODS as number[]).includes(order.months) ? (order.months as Period) : wantedMonths;
  const amount = order?.amount ?? (isBoost ? BOOST.price : PLAN_PRICES[plan][months]);
  const title = order ? productTitle(order) : isBoost ? `Profile boost · ${BOOST.days} days` : productTitle({ product: "plan", planId: plan, months, days: 0 });
  const reference = order?.reference ?? "VK-…";

  const goToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setFlash(true);
    window.setTimeout(() => setFlash(false), 2200);
  };

  const showSubmitted = underReview && !replacing;

  return (
    <MemberShell
      back={isBoost ? "/dashboard" : "/plans"}
      crumb="Payment"
      title="Complete your payment"
      subtitle={`Pay by bank transfer, then upload your receipt. We’ll ${isBoost ? "promote your profile" : "activate your plan"} as soon as we confirm it.`}
    >
      {showSubmitted ? (
        <SubmittedCard pending={toPending(underReview)} onReplace={() => setReplacing(true)} />
      ) : (
        <div className="flex flex-col gap-10">
          {loadError && (
            <div role="alert" className="flex flex-col gap-3 rounded-lg border border-error-line bg-error-bg p-4 text-body-sm text-error-fg sm:flex-row sm:items-center">
              <p className="flex-1 font-semibold">{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          )}
          {rejected && (
            <div role="status" className="rounded-lg border border-warning-line bg-warning-bg p-4 text-body-sm text-warning-fg">
              <p className="font-semibold">We couldn’t confirm your last payment ({rejected.reference})</p>
              {rejected.reviewNote && <p className="mt-1">{rejected.reviewNote}</p>}
              <p className="mt-1">Please pay with the new reference below, or contact support if you think this is a mistake.</p>
            </div>
          )}
          {/* top: bank details + order summary (summary first on phones) */}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <BankCard methods={methods} amount={amount} reference={reference} onPaid={goToUpload} isBoost={isBoost} />
            <div className="order-first lg:order-none lg:sticky lg:top-28">
              <OrderSummary title={title} isBoost={isBoost} amount={amount} reference={reference} />
            </div>
          </div>
          <HowToPay />
          <ReceiptUpload
            sectionRef={uploadRef}
            flash={flash}
            order={order}
            amount={amount}
            reference={reference}
            onDone={(p) => {
              setUnderReview(p);
              setOrder(p);
              setReplacing(false);
              setRejected(null);
              toast.success("Receipt sent", isBoost ? "We’ll check it and promote your profile." : "We’ll check it and activate your plan.");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </MemberShell>
  );
}

/* ─────────────────────────── Order summary ─────────────────────────── */

function OrderSummary({ title, isBoost, amount, reference }: Readonly<{ title: string; isBoost: boolean; amount: number; reference: string }>) {
  const { copied, copy } = useCopy();
  return (
    <section aria-label="Order summary" className="flex flex-col gap-4 rounded-xl border border-premium-line bg-surface-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-sm">
          <Crown1 size={22} color="currentColor" variant="Bold" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-label-sm text-ink-tertiary">{isBoost ? "You’re buying" : "You’re upgrading to"}</p>
          <h2 className="text-h5 text-ink">{title}</h2>
        </div>
        <Link href="/plans" className="text-label-sm font-semibold text-brand-text underline-offset-4 hover:underline">
          Change
        </Link>
      </div>

      <div className="flex items-end justify-between gap-3 rounded-lg bg-premium-bg px-4 py-3">
        <span className="text-label-md text-premium-fg">Amount to pay</span>
        <span className="text-h3 text-ink">{lkr(amount)}</span>
      </div>

      {/* payment reference */}
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-brand-focus bg-brand-subtle p-4">
        <p className="text-label-md text-ink">Your payment reference</p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate font-mono text-h5 tracking-wide text-brand-text">{reference}</code>
          <CopyButton done={copied === "ref"} onClick={() => copy("ref", reference, "Reference")} label="reference" />
        </div>
        <p className="text-body-xs text-ink-secondary">Type this in the transfer’s “reference” or “remarks” box so we can match your payment quickly.</p>
      </div>

      <ul className="flex flex-col gap-2 text-body-sm text-ink-secondary">
        <li className="flex items-center gap-2">
          <Clock size={16} color="currentColor" className="shrink-0 text-brand" /> Activated {REVIEW_TIME}
        </li>
        <li className="flex items-center gap-2">
          <SecuritySafe size={16} color="currentColor" className="shrink-0 text-brand" /> Plans don’t auto-renew, no hidden fees
        </li>
      </ul>
    </section>
  );
}

/* ─────────────────────────── Bank account card ─────────────────────────── */

type PayTab = "bank" | "qr";

const keyOf = (x: { id?: string }, i: number) => x.id || `item-${i}`;

/** "Commercial Bank" → CB · "Bank of Ceylon (BOC)" → BOC · "People’s Bank" → PB */
function monogram(name: string) {
  const inBrackets = /\(([^)]+)\)/.exec(name)?.[1];
  if (inBrackets) return inBrackets.slice(0, 3).toUpperCase();
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !["of", "and", "the"].includes(w.toLowerCase()))
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

/** Collapsed-row hint: "Account ending 4521" (or the branch while the number is a placeholder) */
function accountHint(a: BankAccount) {
  const digits = a.accountNumber.replace(/\D/g, "");
  if (digits.length >= 4 && !a.accountNumber.startsWith("[")) return `Account ending ${digits.slice(-4)}`;
  return a.branch;
}

/** Only our own files or https images (the URL comes from the API config). */
const safeImage = (url?: string) => (url && (url.startsWith("/") || url.startsWith("https://")) ? url : "");

function BankCard({ methods, amount, reference, onPaid, isBoost }: Readonly<{ methods: PaymentMethods; amount: number; reference: string; onPaid: () => void; isBoost: boolean }>) {
  const { copied, copy } = useCopy();
  const { accounts, qrCodes } = methods;
  const [tab, setTab] = useState<PayTab>("bank");
  const [openBank, setOpenBank] = useState<string | null>(accounts.length ? keyOf(accounts[0], 0) : null);
  const [openQr, setOpenQr] = useState<string | null>(qrCodes.length ? keyOf(qrCodes[0], 0) : null);

  // real accounts replace the placeholders after load: keep the first one open
  useEffect(() => {
    setOpenBank(accounts.length ? keyOf(accounts[0], 0) : null);
    setOpenQr(qrCodes.length ? keyOf(qrCodes[0], 0) : null);
  }, [accounts, qrCodes]);

  return (
    <section aria-label="How to pay us" className="relative isolate overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--rose-950)_0%,var(--rose-900)_55%,var(--rose-800)_100%)] p-5 text-white shadow-xl ring-1 ring-inset ring-[rgba(255,255,255,0.08)] sm:p-8">
      {/* decor: soft rings + bank watermark */}
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full border-[28px] border-[rgba(255,255,255,0.08)]" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-56 w-56 rounded-full bg-[rgba(255,255,255,0.06)]" />
      <Bank aria-hidden size={140} color="currentColor" className="pointer-events-none absolute -bottom-6 right-4 -z-10 text-white opacity-10" />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-md">
          {tab === "bank" ? <Bank size={22} color="currentColor" variant="Bold" /> : <ScanBarcode size={22} color="currentColor" variant="Bold" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-overline uppercase text-[rgba(255,255,255,0.8)]">{tab === "bank" ? "Bank transfer" : "Scan & pay"}</p>
          <h2 className="text-h5">{tab === "bank" ? "Our bank accounts" : "Pay with a QR code"}</h2>
        </div>
        <SegmentedTabs
          tone="onBrand"
          idBase="pay"
          label="How to pay"
          value={tab}
          onChange={setTab}
          className="max-sm:w-full max-sm:[&>button]:flex-1 max-sm:[&>button]:justify-center"
          tabs={[
            { id: "bank" as PayTab, label: "Bank accounts", count: accounts.length, icon: <Bank size={16} color="currentColor" /> },
            { id: "qr" as PayTab, label: "QR code", count: qrCodes.length, icon: <ScanBarcode size={16} color="currentColor" /> },
          ]}
        />
      </div>

      <div role="tabpanel" id={`pay-panel-${tab}`} aria-labelledby={`pay-tab-${tab}`} className="mt-6 flex flex-col gap-3">
        {tab === "bank" &&
          (accounts.length ? (
            <>
              <p className="text-body-sm text-[rgba(255,255,255,0.8)]">Pay into any one of these accounts. Open a bank to see its details.</p>
              {accounts.map((a, i) => {
                const k = keyOf(a, i);
                return (
                  <PayAccordion
                    key={k}
                    id={`bank-${k}`}
                    open={openBank === k}
                    onToggle={() => setOpenBank((o) => (o === k ? null : k))}
                    mark={monogram(a.bankName)}
                    title={a.bankName}
                    subtitle={accountHint(a)}
                  >
                    <BankDetails account={a} k={k} amount={amount} reference={reference} copied={copied} copy={copy} />
                  </PayAccordion>
                );
              })}
            </>
          ) : (
            <EmptyMethod text="Bank details aren’t available right now. Please try again soon, or talk to support." />
          ))}

        {tab === "qr" &&
          (qrCodes.length ? (
            <>
              <p className="text-body-sm text-[rgba(255,255,255,0.8)]">Scan with your bank app (LankaQR). Open a bank to see its QR code.</p>
              {qrCodes.map((q, i) => {
                const k = keyOf(q, i);
                return (
                  <PayAccordion
                    key={k}
                    id={`qr-${k}`}
                    open={openQr === k}
                    onToggle={() => setOpenQr((o) => (o === k ? null : k))}
                    mark={monogram(q.name)}
                    title={q.name}
                    subtitle={safeImage(q.imageUrl) ? `${q.provider} · scan to pay` : `${q.provider} · coming soon`}
                  >
                    <QrDetails qr={q} k={k} amount={amount} reference={reference} copied={copied} copy={copy} />
                  </PayAccordion>
                );
              })}
            </>
          ) : (
            <EmptyMethod text="QR payments are coming soon. Please use a bank account for now." action={{ label: "See bank accounts", onClick: () => setTab("bank") }} />
          ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-body-sm text-[rgba(255,255,255,0.85)]">Paid? Upload the receipt so we can {isBoost ? "promote your profile" : "activate your plan"}.</p>
        <Button variant="white" size="md" className="bg-white text-rose-700 hover:bg-rose-50" onClick={onPaid} rightIcon={<DocumentUpload size={18} color="currentColor" />}>
          I’ve paid, upload receipt
        </Button>
      </div>
    </section>
  );
}

/** One bank / QR row on the wine card: tap the header to open or close it (height animates, hidden content is inert). */
function PayAccordion({
  id,
  open,
  onToggle,
  mark,
  title,
  subtitle,
  children,
}: Readonly<{ id: string; open: boolean; onToggle: () => void; mark: string; title: string; subtitle: string; children: React.ReactNode }>) {
  return (
    <div
      className={cn(
        "rounded-lg ring-1 ring-inset backdrop-blur-[6px] transition-colors duration-300",
        open ? "bg-[rgba(255,255,255,0.1)] ring-[rgba(255,255,255,0.24)]" : "bg-[rgba(255,255,255,0.05)] ring-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.08)]",
      )}
    >
      <h3>
        <button
          type="button"
          id={`${id}-head`}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3.5 text-left focus-visible:outline-none focus-visible:shadow-ring-brand"
        >
          <span
            aria-hidden
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-label-sm font-bold tracking-wide transition-colors duration-300",
              open ? "bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-md" : "bg-[rgba(255,255,255,0.14)] text-white",
            )}
          >
            {mark}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-label-lg">{title}</span>
            <span className="block truncate text-body-xs text-[rgba(255,255,255,0.72)]">{subtitle}</span>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)]">
            <ArrowDown2 size={16} color="currentColor" className={cn("transition-transform duration-300 motion-reduce:transition-none", open && "rotate-180")} />
          </span>
        </button>
      </h3>
      <section
        id={`${id}-body`}
        aria-labelledby={`${id}-head`}
        className={cn("grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div className="px-4 pb-4">{children}</div>
        </div>
      </section>
    </div>
  );
}

type CopyFn = (key: string, value: string, label: string) => void | Promise<void>;

function BankDetails({ account: a, k, amount, reference, copied, copy }: Readonly<{ account: BankAccount; k: string; amount: number; reference: string; copied: string | null; copy: CopyFn }>) {
  const rows: { key: string; label: string; value: string; big?: boolean }[] = [
    { key: "acc", label: "Account number", value: a.accountNumber, big: true },
    { key: "name", label: "Account name", value: a.accountName },
    { key: "branch", label: "Branch", value: a.branch },
    { key: "swift", label: "SWIFT (from overseas)", value: a.swift },
  ];
  const all = [
    `Bank: ${a.bankName}`,
    `Account name: ${a.accountName}`,
    `Account number: ${a.accountNumber}`,
    `Branch: ${a.branch}`,
    `Amount: ${lkr(amount)}`,
    `Reference: ${reference}`,
  ].join("\n");
  const allKey = `${k}-all`;
  return (
    <div className="flex flex-col gap-3 border-t border-[rgba(255,255,255,0.12)] pt-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows
          .filter((r) => r.value)
          .map((r) => (
            <div
              key={r.key}
              className={cn("flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.07)] px-4 py-3 ring-1 ring-inset ring-[rgba(255,255,255,0.12)]", r.big && "sm:col-span-2")}
            >
              <div className="min-w-0 flex-1">
                <dt className="text-label-sm text-[rgba(255,255,255,0.75)]">{r.label}</dt>
                <dd className={cn("break-words", r.big ? "font-mono text-h5 tracking-[0.06em] sm:text-h3 sm:tracking-[0.08em]" : "text-body-lg font-semibold")}>{r.value}</dd>
              </div>
              <CopyButton onBrand done={copied === `${k}-${r.key}`} onClick={() => copy(`${k}-${r.key}`, r.value.replace(/\s/g, r.big ? "" : " "), r.label)} label={r.label.toLowerCase()} />
            </div>
          ))}
      </dl>
      <button
        type="button"
        onClick={() => copy(allKey, all, `${a.bankName} details`)}
        className="flex h-10 items-center gap-2 self-start rounded-full bg-white px-4 text-button-sm text-rose-700 shadow-md transition-transform hover:-translate-y-0.5 active:scale-95"
      >
        {copied === allKey ? <CopySuccess size={18} color="currentColor" /> : <Copy size={18} color="currentColor" />}
        {copied === allKey ? "Copied" : "Copy all details"}
      </button>
    </div>
  );
}

function QrDetails({ qr, k, amount, reference, copied, copy }: Readonly<{ qr: PaymentQr; k: string; amount: number; reference: string; copied: string | null; copy: CopyFn }>) {
  const src = safeImage(qr.imageUrl);
  if (!src) {
    return (
      <div className="flex flex-col items-center gap-3 border-t border-[rgba(255,255,255,0.12)] pt-4 text-center sm:flex-row sm:text-left">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.05)]">
          <ScanBarcode size={28} color="currentColor" className="opacity-80" />
        </span>
        <div>
          <p className="text-label-lg">{qr.name} QR code is coming soon</p>
          <p className="text-body-sm text-[rgba(255,255,255,0.75)]">Please pay into one of our bank accounts for now.</p>
        </div>
      </div>
    );
  }
  const steps = [
    "Open your bank app and choose Scan / LankaQR.",
    "Scan this code. On a phone, save it and pick it from your gallery.",
    `Enter the exact amount: ${lkr(amount)}.`,
    `Type ${reference} in the remarks / reference box.`,
  ];
  return (
    <div className="grid gap-5 border-t border-[rgba(255,255,255,0.12)] pt-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-lg bg-white p-3 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- the URL comes from the API config */}
          <img src={src} alt={`${qr.provider} QR code for ${qr.name}, paid to ${qr.accountName}`} width={176} height={176} className="h-44 w-44 object-contain" />
        </div>
        <a
            href={src}
            download={`vikasitha-${k}-qr.png`}
            className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-button-sm text-rose-700 shadow-md transition-transform hover:-translate-y-0.5 active:scale-95"
          >
          <DocumentDownload size={18} color="currentColor" /> Save QR code
        </a>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <p className="text-body-sm text-[rgba(255,255,255,0.8)]">
          Paid to <b className="text-white">{qr.accountName}</b>
          {qr.note ? ` · ${qr.note}` : ""}
        </p>
        <ol className="flex flex-col gap-2">
          {steps.map((t, i) => (
            <li key={t} className="flex items-start gap-3 text-body-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.14)] text-label-sm">{i + 1}</span>
              <span className="pt-0.5">{t}</span>
            </li>
          ))}
        </ol>
        <div className="grid gap-2 sm:grid-cols-2">
          <QrCopyTile label="Amount" value={lkr(amount)} done={copied === `${k}-amount`} onCopy={() => copy(`${k}-amount`, String(amount), "Amount")} />
          <QrCopyTile label="Reference" value={reference} done={copied === `${k}-ref`} onCopy={() => copy(`${k}-ref`, reference, "Reference")} mono />
        </div>
      </div>
    </div>
  );
}

function QrCopyTile({ label, value, done, onCopy, mono }: Readonly<{ label: string; value: string; done: boolean; onCopy: () => void; mono?: boolean }>) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.07)] px-3 py-2.5 ring-1 ring-inset ring-[rgba(255,255,255,0.12)]">
      <div className="min-w-0 flex-1">
        <p className="text-label-sm text-[rgba(255,255,255,0.75)]">{label}</p>
        <p className={cn("truncate text-label-lg", mono && "font-mono tracking-wide")}>{value}</p>
      </div>
      <CopyButton onBrand done={done} onClick={onCopy} label={label.toLowerCase()} />
    </div>
  );
}

function EmptyMethod({ text, action }: Readonly<{ text: string; action?: { label: string; onClick: () => void } }>) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.05)] p-5 sm:flex-row sm:items-center">
      <p className="flex-1 text-body-sm text-[rgba(255,255,255,0.85)]">{text}</p>
      {action && (
        <button type="button" onClick={action.onClick} className="h-10 rounded-full bg-white px-4 text-button-sm text-rose-700 shadow-md">
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────── How to pay (pinned notes) ─────────────────────────── */

const STEPS = [
  { Icon: Copy, title: "Copy the details", text: "Copy our account number and your payment reference.", pill: "Takes 10 seconds", tone: "rose" as const },
  { Icon: WalletMoney, title: "Transfer the amount", text: "Use online banking, a bank app, CDM or any branch.", pill: "Exact amount", tone: "gold" as const },
  { Icon: Edit2, title: "Add your reference", text: "Type your VK reference in the remarks / reference box.", pill: "Helps us find it", tone: "rose" as const },
  { Icon: ReceiptText, title: "Upload the receipt", text: "Upload a photo, screenshot or PDF of the slip below.", pill: `Live ${REVIEW_TIME.split(" (")[0]}`, tone: "gold" as const },
];

function HowToPay() {
  return (
    <section aria-label="How to pay" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-overline uppercase text-brand-text">How to pay</p>
        <h2 className="text-h4 text-ink">4 easy steps</h2>
      </div>
      <ol className="grid gap-x-6 gap-y-10 pt-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className={cn(i % 2 ? "lg:mt-6" : "")}>
            <PinNote tone={s.tone} className={cn("h-full", i % 2 ? "rotate-[1.2deg]" : "-rotate-[1.2deg]")} panelClassName="h-full">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-gradient text-ink-on-brand">
                  <s.Icon size={20} color="currentColor" />
                </span>
                <span className={cn("text-[40px] font-bold leading-none", s.tone === "rose" ? "text-brand" : "text-gold-700 dark:text-gold-300")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-h6 text-gray-900 dark:text-ink">{s.title}</h3>
              <p className="text-body-sm text-gray-600 dark:text-ink-secondary">{s.text}</p>
              <span className="w-fit rounded-full bg-white px-2.5 py-1 text-label-sm text-rose-700 dark:bg-surface-raised dark:text-rose-300">{s.pill}</span>
            </PinNote>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────────────────── Receipt upload ─────────────────────────── */

function ReceiptUpload({
  sectionRef,
  flash,
  order,
  amount,
  reference,
  onDone,
}: Readonly<{
  sectionRef: React.RefObject<HTMLElement | null>;
  flash: boolean;
  order: Payment | null;
  amount: number;
  reference: string;
  onDone: (p: Payment) => void;
}>) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // today's date is set in the browser (server and browser clocks can differ → hydration mismatch)
  const [paidOn, setPaidOn] = useState("");
  const [today, setToday] = useState<string | undefined>(undefined);
  useEffect(() => {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
    setToday(local);
    setPaidOn((v) => v || local);
  }, []);
  const [note, setNote] = useState("");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = () => fileRef.current?.click();
  const take = (f: File | undefined | null) => {
    if (!f) return;
    if (!RECEIPT_TYPES.includes(f.type)) {
      setError("Use a JPG, PNG or WEBP photo, or a PDF.");
      return;
    }
    if (f.size > RECEIPT_MAX_MB * 1024 * 1024) {
      setError(`That file is too big. Use one under ${RECEIPT_MAX_MB} MB.`);
      return;
    }
    setError(null);
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };
  const remove = () => {
    setFile(null);
    setPreview(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Upload your bank receipt to continue.");
      return;
    }
    if (!paidOn) {
      setError("Enter the date you paid.");
      return;
    }
    if (!order) {
      setError("Your order isn’t ready yet. Wait a moment and try again.");
      return;
    }
    setSending(true);
    try {
      const saved = await uploadReceipt(order.id, file, paidOn, note);
      onDone(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t upload your receipt. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const isPdf = file?.type === "application/pdf";

  return (
    <section
      ref={sectionRef}
      id="upload-receipt"
      aria-label="Upload your bank receipt"
      className={cn(
        "relative scroll-mt-28 rounded-xl border-2 border-brand bg-surface-card p-5 shadow-lg transition-shadow duration-500 sm:p-8",
        flash && "shadow-[0_0_0_6px_var(--color-bg-brand-subtle),0_0_40px_rgba(222,5,71,0.35)]",
      )}
    >
      {/* "Final step" tab on the border */}
      <span className="absolute -top-3.5 left-6 inline-flex h-7 items-center gap-1.5 rounded-full bg-brand-gradient px-3 text-label-sm text-ink-on-brand shadow-md">
        <ReceiptText size={14} color="currentColor" /> Final step
      </span>
      <LoveSticker variant="double" size={44} rotate={12} className="absolute -right-3 -top-4 max-sm:hidden" />

      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h4 text-ink">Upload your bank receipt</h2>
          <p className="text-body-md text-ink-secondary">A photo or screenshot of the slip, or the PDF from your bank app. Make sure the amount, date and reference are readable.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
          {/* file */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              take(e.dataTransfer.files?.[0]);
            }}
            className={cn("mx-auto w-full max-w-[240px] rounded-lg transition-shadow md:max-w-none", drag && "ring-2 ring-brand ring-offset-2 ring-offset-surface-card", error && !file && "ring-2 ring-error-fg ring-offset-2 ring-offset-surface-card")}
          >
            {isPdf && file ? (
              // PDF: same tile size and actions as PhotoSlot
              <div className="relative flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg bg-brand-subtle p-4 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-md bg-surface-card text-brand shadow-sm">
                  <DocumentText size={30} color="currentColor" />
                </span>
                <p className="line-clamp-2 break-all text-label-md text-ink">{file.name}</p>
                <p className="text-body-xs text-ink-tertiary">PDF · {file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`}</p>
                <div className="absolute bottom-2.5 left-2.5 flex gap-2">
                  <button type="button" onClick={pick} aria-label="Change file" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-glass-strong text-brand shadow-sm hover:bg-surface-card">
                    <Edit2 size={16} color="currentColor" />
                  </button>
                  <button type="button" onClick={remove} aria-label="Remove file" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-glass-strong text-error-fg shadow-sm hover:bg-surface-card">
                    <Trash size={16} color="currentColor" />
                  </button>
                </div>
              </div>
            ) : (
              <PhotoSlot src={preview} main={false} label="Add receipt (photo or PDF)" onPick={pick} onRemove={remove} className="aspect-[3/4] w-full" />
            )}
            <input ref={fileRef} type="file" accept={RECEIPT_TYPES.join(",")} hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
            <p className="mt-2 text-center text-body-xs text-ink-tertiary">JPG, PNG, WEBP or PDF · up to {RECEIPT_MAX_MB} MB{!file && " · or drop it here"}</p>
          </div>

          {/* details */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Amount paid" value={lkr(amount)} readOnly />
              <Input label="Date of payment" type="date" value={paidOn} max={today} onChange={(e) => setPaidOn(e.target.value)} />
            </div>
            <Input label="Payment reference" value={reference} readOnly />
            <Textarea label="Note for our team" hint="Optional" rows={2} maxLength={200} value={note} onChange={setNote} placeholder="For example: paid from my father’s account" />
            <ul className="flex flex-col gap-1.5 rounded-md bg-surface-subtle p-3 text-body-xs text-ink-secondary">
              {["Amount, date and reference are clear", "Whole slip is in the photo, not cut off", "No other people’s card numbers showing"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <TickCircle size={14} color="currentColor" className="shrink-0 text-success-fg" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {error && (
          <p role="alert" className="-mt-2 text-body-sm font-semibold text-error-fg">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={sending} disabled={!order} leftIcon={<DocumentUpload size={20} color="currentColor" />}>
          Submit receipt
        </Button>
      </form>
    </section>
  );
}

/* ─────────────────────────── After upload ─────────────────────────── */

function StepMark({ done, current }: Readonly<{ done: boolean; current?: boolean }>) {
  if (done) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-fg text-label-sm text-white">
        <TickCircle size={16} color="currentColor" />
      </span>
    );
  }
  if (current) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-label-sm text-ink-on-brand">
        <Clock size={16} color="currentColor" />
      </span>
    );
  }
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-label-sm text-ink-tertiary">3</span>;
}

function SubmittedCard({ pending, onReplace }: Readonly<{ pending: Pending; onReplace: () => void }>) {
  const steps = [
    { label: "Receipt received", done: true },
    { label: "Our team checks the payment", done: false, current: true },
    { label: pending.outcome, done: false },
  ];
  return (
    <section aria-label="Payment under review" className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-6 rounded-xl border border-line bg-surface-card p-6 text-center shadow-sm sm:p-10">
      <span className="relative">
        <span className="kyc-pop flex h-20 w-20 items-center justify-center rounded-full bg-success-bg text-success-fg">
          <TickCircle size={44} color="currentColor" variant="Bold" />
        </span>
        <LoveSticker variant="double" size={36} rotate={14} className="absolute -right-6 -top-3" />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="text-h3 text-ink">Thank you, your receipt is with us</h2>
        <p className="text-body-md text-ink-secondary">
          We’ll check your {lkr(pending.amount)} payment for {pending.title} {REVIEW_TIME}. You’ll get an SMS when it’s ready.
        </p>
      </div>

      <ol className="flex w-full flex-col gap-3 text-left">
        {steps.map((s) => (
          <li key={s.label} className={cn("flex items-center gap-3 rounded-lg px-4 py-3", s.current ? "bg-brand-subtle" : "bg-surface-subtle")}>
            <StepMark done={s.done} current={s.current} />
            <span className={cn("text-body-md", s.current ? "font-semibold text-ink" : "text-ink-secondary")}>{s.label}</span>
          </li>
        ))}
      </ol>

      <dl className="grid w-full grid-cols-2 gap-3 text-left text-body-sm">
        <div className="rounded-md bg-surface-subtle p-3">
          <dt className="text-label-sm text-ink-tertiary">Reference</dt>
          <dd className="font-mono font-semibold text-ink">{pending.reference}</dd>
        </div>
        <div className="rounded-md bg-surface-subtle p-3">
          <dt className="text-label-sm text-ink-tertiary">Receipt</dt>
          <dd className="truncate font-semibold text-ink">{pending.fileName}</dd>
        </div>
      </dl>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <ButtonLink href="/dashboard" size="md" className="sm:flex-1">
          Back to dashboard
        </ButtonLink>
        <Button variant="outline" size="md" className="sm:flex-1" onClick={onReplace}>
          Upload a different receipt
        </Button>
      </div>
      <p className="text-body-xs text-ink-tertiary">
        Something wrong?{" "}
        <Link href="/support" className="font-semibold text-brand-text underline-offset-4 hover:underline">
          Contact support
        </Link>
      </p>
    </section>
  );
}
