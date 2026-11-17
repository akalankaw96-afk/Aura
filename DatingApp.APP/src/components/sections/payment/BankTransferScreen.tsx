"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bank,
  Clock,
  Copy,
  CopySuccess,
  Crown1,
  DocumentText,
  DocumentUpload,
  Edit2,
  ReceiptText,
  SecuritySafe,
  TickCircle,
  Trash,
  WalletMoney,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { MemberShell } from "@/components/layout/MemberShell";
import { Button, ButtonLink, Input, LoveSticker, PinNote, Textarea, useToast } from "@/components/ui";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { SESSION_KEY } from "@/lib/http";
import {
  BANK_ACCOUNT,
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
 * Payment page (/plans/checkout?plan=gold&months=3) — phase 1: bank transfer only.
 * 1. Order summary + the member's payment reference
 * 2. Bank account card with copy buttons ("Copy all" too)
 * 3. How to pay — pinned notes, same style as Home → How it works
 * 4. Upload the bank receipt (photo or PDF) — highlighted step, shared PhotoSlot for images
 * After submit the member sees "Payment under review". Demo: kept in localStorage until
 * POST /api/payments/bank-transfer exists (docs/API_GUIDELINES.md).
 */
const PENDING_KEY = "vk-payment-pending";

type Pending = { plan: PaidPlan; months: Period; amount: number; reference: string; fileName: string; paidOn: string; submittedAt: string };

function readSession(): { userId?: string; phoneNumber?: string; fullName?: string } {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Short code the member types into the transfer's "reference / remarks" so we can match the payment */
function makeReference(plan: PaidPlan, months: Period) {
  const s = readSession();
  const tail = (s.phoneNumber || s.userId || "000000").replace(/\W/g, "").slice(-6).toUpperCase();
  return `VK-${plan === "gold" ? "G" : "P"}${months}-${tail}`;
}

export function BankTransferScreen() {
  const params = useSearchParams();
  const plan: PaidPlan = params.get("plan") === "platinum" ? "platinum" : "gold";
  const m = Number(params.get("months"));
  const months: Period = (PERIODS as number[]).includes(m) ? (m as Period) : 3;
  const amount = PLAN_PRICES[plan][months];

  const [reference, setReference] = useState("VK-…");
  const [pending, setPending] = useState<Pending | null>(null);
  const [flash, setFlash] = useState(false);
  const uploadRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setReference(makeReference(plan, months));
    try {
      setPending(JSON.parse(localStorage.getItem(PENDING_KEY) || "null"));
    } catch {}
  }, [plan, months]);

  const goToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setFlash(true);
    window.setTimeout(() => setFlash(false), 2200);
  };

  return (
    <MemberShell back="/plans" crumb="Payment" title="Complete your payment" subtitle="Pay by bank transfer, then upload your receipt. We’ll activate your plan as soon as we confirm it.">
      {pending ? (
        <SubmittedCard pending={pending} onReplace={() => { try { localStorage.removeItem(PENDING_KEY); } catch {} setPending(null); }} />
      ) : (
        <div className="flex flex-col gap-10">
          {/* top: bank details + order summary (summary first on phones) */}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <BankCard amount={amount} reference={reference} onPaid={goToUpload} />
            <div className="order-first lg:order-none lg:sticky lg:top-28">
              <OrderSummary plan={plan} months={months} amount={amount} reference={reference} />
            </div>
          </div>
          <HowToPay />
          <ReceiptUpload
              sectionRef={uploadRef}
              flash={flash}
              plan={plan}
              months={months}
              amount={amount}
              reference={reference}
              onDone={(p) => {
                try {
                  localStorage.setItem(PENDING_KEY, JSON.stringify(p));
                } catch {}
                setPending(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
        </div>
      )}
    </MemberShell>
  );
}

/* ─────────────────────────── Copy button ─────────────────────────── */

function useCopy() {
  const toast = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      toast.error("Couldn’t copy", `Select the ${label.toLowerCase()} and copy it yourself.`);
      return;
    }
    setCopied(key);
    toast.success(`${label} copied`);
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
  };
  return { copied, copy };
}

function copyButtonTone(onBrand: boolean, done: boolean) {
  if (onBrand) {
    return done ? "bg-white text-success-fg" : "bg-[rgba(255,255,255,0.18)] text-white ring-1 ring-inset ring-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.28)]";
  }
  return done ? "bg-success-bg text-success-fg" : "bg-brand-subtle text-brand-text hover:bg-brand hover:text-ink-on-brand";
}

function CopyButton({ done, onClick, label, onBrand = false }: Readonly<{ done: boolean; onClick: () => void; label: string; onBrand?: boolean }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-label-sm transition-[background-color,color,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:shadow-ring-brand",
        copyButtonTone(onBrand, done),
      )}
    >
      {done ? <CopySuccess size={16} color="currentColor" /> : <Copy size={16} color="currentColor" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/* ─────────────────────────── Order summary ─────────────────────────── */

function OrderSummary({ plan, months, amount, reference }: Readonly<{ plan: PaidPlan; months: Period; amount: number; reference: string }>) {
  const { copied, copy } = useCopy();
  return (
    <section aria-label="Order summary" className="flex flex-col gap-4 rounded-xl border border-premium-line bg-surface-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-sm">
          <Crown1 size={22} color="currentColor" variant="Bold" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-label-sm text-ink-tertiary">You’re upgrading to</p>
          <h2 className="text-h5 text-ink">
            {PLAN_NAME[plan]} · {months} month{months > 1 ? "s" : ""}
          </h2>
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

function BankCard({ amount, reference, onPaid }: Readonly<{ amount: number; reference: string; onPaid: () => void }>) {
  const { copied, copy } = useCopy();
  const rows: { key: string; label: string; value: string; big?: boolean }[] = [
    { key: "acc", label: "Account number", value: BANK_ACCOUNT.accountNumber, big: true },
    { key: "name", label: "Account name", value: BANK_ACCOUNT.accountName },
    { key: "bank", label: "Bank", value: BANK_ACCOUNT.bankName },
    { key: "branch", label: "Branch", value: BANK_ACCOUNT.branch },
    { key: "swift", label: "SWIFT (from overseas)", value: BANK_ACCOUNT.swift },
  ];
  const all = [
    `Bank: ${BANK_ACCOUNT.bankName}`,
    `Account name: ${BANK_ACCOUNT.accountName}`,
    `Account number: ${BANK_ACCOUNT.accountNumber}`,
    `Branch: ${BANK_ACCOUNT.branch}`,
    `Amount: ${lkr(amount)}`,
    `Reference: ${reference}`,
  ].join("\n");

  return (
    <section aria-label="Bank account details" className="relative isolate overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--rose-950)_0%,var(--rose-900)_55%,var(--rose-800)_100%)] p-5 text-white shadow-xl ring-1 ring-inset ring-[rgba(255,255,255,0.08)] sm:p-8">
      {/* decor: soft rings + bank watermark */}
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full border-[28px] border-[rgba(255,255,255,0.08)]" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-56 w-56 rounded-full bg-[rgba(255,255,255,0.06)]" />
      <Bank aria-hidden size={140} color="currentColor" className="pointer-events-none absolute -bottom-6 right-4 -z-10 text-white opacity-10" />

      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-md">
          <Bank size={22} color="currentColor" variant="Bold" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-overline uppercase text-[rgba(255,255,255,0.8)]">Bank transfer</p>
          <h2 className="text-h5">Our bank account</h2>
        </div>
        <button
          type="button"
          onClick={() => copy("all", all, "Bank details")}
          className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-button-sm text-rose-700 shadow-md transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          {copied === "all" ? <CopySuccess size={18} color="currentColor" /> : <Copy size={18} color="currentColor" />}
          {copied === "all" ? "Copied" : "Copy all details"}
        </button>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.key}
            className={cn(
              "flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.07)] px-4 py-3 ring-1 ring-inset ring-[rgba(255,255,255,0.12)] backdrop-blur-[6px]",
              r.big && "sm:col-span-2",
            )}
          >
            <div className="min-w-0 flex-1">
              <dt className="text-label-sm text-[rgba(255,255,255,0.75)]">{r.label}</dt>
              <dd className={cn("break-words", r.big ? "font-mono text-h3 tracking-[0.08em]" : "text-body-lg font-semibold")}>{r.value}</dd>
            </div>
            <CopyButton onBrand done={copied === r.key} onClick={() => copy(r.key, r.value.replace(/\s/g, r.big ? "" : " "), r.label)} label={r.label.toLowerCase()} />
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-body-sm text-[rgba(255,255,255,0.85)]">Transferred the money? Upload the receipt so we can activate your plan.</p>
        <Button variant="white" size="md" className="bg-white text-rose-700 hover:bg-rose-50" onClick={onPaid} rightIcon={<DocumentUpload size={18} color="currentColor" />}>
          I’ve paid, upload receipt
        </Button>
      </div>
    </section>
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
  plan,
  months,
  amount,
  reference,
  onDone,
}: Readonly<{
  sectionRef: React.RefObject<HTMLElement | null>;
  flash: boolean;
  plan: PaidPlan;
  months: Period;
  amount: number;
  reference: string;
  onDone: (p: Pending) => void;
}>) {
  const toast = useToast();
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
    setSending(true);
    // Waits for the API: POST /api/payments/bank-transfer (see API_GUIDELINES → Planned: bank transfer payments)
    // (multipart: plan, months, amount, reference, paidOn, note, receipt)
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    toast.success("Receipt sent", "We’ll check it and activate your plan.");
    onDone({ plan, months, amount, reference, paidOn, fileName: file.name, submittedAt: new Date().toISOString() });
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

        <Button type="submit" size="lg" fullWidth loading={sending} leftIcon={<DocumentUpload size={20} color="currentColor" />}>
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
    { label: `${PLAN_NAME[pending.plan]} activated`, done: false },
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
          We’ll check your {lkr(pending.amount)} payment and activate {PLAN_NAME[pending.plan]} ({pending.months} month{pending.months > 1 ? "s" : ""}) {REVIEW_TIME}. You’ll get an SMS when it’s ready.
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
