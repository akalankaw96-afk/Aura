"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight2, CallCalling, Clock, CloseCircle, DocumentText, Gallery, Headphone, MessageText1, Messages2, Send2, ShieldTick, Sms, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { MemberShell } from "@/components/layout/MemberShell";
import { Button, COUNTRIES, FilterChip, Input, PhoneField, Textarea, isValidSriLankanMobile, useToast } from "@/components/ui";
import type { CountryCode } from "@/components/ui/Flag";
import { CopyButton, useCopy } from "@/components/ui/CopyButton";
import { useAuthSession } from "@/lib/session";
import { sendSupportMessage } from "@/services/support";
import {
  SUPPORT,
  SUPPORT_ATTACHMENT_MAX_MB,
  SUPPORT_ATTACHMENT_TYPES,
  SUPPORT_MESSAGE_MAX,
  SUPPORT_TOPICS,
  type SupportTopic,
} from "@/content/support";

const ICONS = { email: Sms, whatsapp: Messages2, hotline: CallCalling };

/**
 * /support — left: how to reach us (wine card like the payment page: Email · WhatsApp · Hotline with Copy,
 * tap the row to open the app), hours and quick links. Right: "Send us a message" (topic, contact, subject,
 * message, optional screenshot) → ticket number. Works for guests and members (members are pre-filled).
 */
type Channel = (typeof SUPPORT.channels)[number];

/** `channels` come from the server page: the WhatsApp / hotline numbers are server-only environment variables. */
export function SupportScreen({ channels }: Readonly<{ channels: readonly Channel[] }>) {
  return (
    <MemberShell publicPage crumb="Support" title={SUPPORT.title} subtitle="Questions about your account, verification or payments? We’re here to help.">
      <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
        <ContactCard channels={channels} />
        <MessageForm />
      </div>
    </MemberShell>
  );
}

/* ───────────── left: contact options ───────────── */

function ContactCard({ channels }: Readonly<{ channels: readonly Channel[] }>) {
  const { copied, copy } = useCopy();
  return (
    <section
      aria-labelledby="contact-title"
      className="enter relative isolate flex flex-col gap-5 overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--rose-950)_0%,var(--rose-900)_55%,var(--rose-800)_100%)] p-5 text-white shadow-xl ring-1 ring-inset ring-[rgba(255,255,255,0.08)] sm:p-6 lg:sticky lg:top-28"
    >
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full border-[26px] border-[rgba(255,255,255,0.08)]" />
      <Headphone aria-hidden size={120} color="currentColor" className="pointer-events-none absolute -bottom-6 right-2 -z-10 text-white opacity-10" />

      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-md">
          <Headphone size={22} color="currentColor" variant="Bold" />
        </span>
        <div>
          <p className="text-overline uppercase text-[rgba(255,255,255,0.8)]">Get in touch</p>
          <h2 id="contact-title" className="text-h5">
            Talk to our team
          </h2>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {channels.map(({ id, title, contact, href }) => {
          const Icon = ICONS[id];
          const external = id === "whatsapp";
          return (
            <li
              key={id}
              className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.07)] px-3 py-3 ring-1 ring-inset ring-[rgba(255,255,255,0.12)] backdrop-blur-[6px] transition-colors hover:bg-[rgba(255,255,255,0.11)]"
            >
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.14)]">
                <Icon size={20} color="currentColor" />
              </span>
              {href ? (
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:shadow-ring-brand"
                >
                  <span className="block text-label-sm text-[rgba(255,255,255,0.75)]">{title}</span>
                  <span className="block break-words text-label-lg">{contact}</span>
                </a>
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="text-label-sm text-[rgba(255,255,255,0.75)]">{title}</p>
                  <p className="text-body-sm text-[rgba(255,255,255,0.7)]">Not available yet</p>
                </div>
              )}
              {href && <CopyButton onBrand done={copied === id} onClick={() => void copy(id, contact, title === "Email" ? "Email address" : `${title} number`)} label={title.toLowerCase()} />}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2 border-t border-[rgba(255,255,255,0.14)] pt-4 text-body-sm text-[rgba(255,255,255,0.88)]">
        <p className="flex items-center gap-2.5">
          <Clock size={18} color="currentColor" className="shrink-0" /> {SUPPORT.hours}
        </p>
        <p className="flex items-center gap-2.5">
          <MessageText1 size={18} color="currentColor" className="shrink-0" /> {SUPPORT.replyTime}
        </p>
      </div>

      <nav aria-label="Quick help" className="flex flex-col gap-1 rounded-lg bg-[rgba(255,255,255,0.07)] p-2 ring-1 ring-inset ring-[rgba(255,255,255,0.12)]">
        <p className="px-2 pb-1 pt-1 text-label-sm text-[rgba(255,255,255,0.75)]">Quick help</p>
        {SUPPORT.quickLinks.map((l) => (
          <Link key={l.href} href={l.href} className="flex items-center justify-between rounded-md px-2 py-2 text-label-md transition-colors hover:bg-[rgba(255,255,255,0.1)]">
            {l.label}
            <ArrowRight2 size={16} color="currentColor" />
          </Link>
        ))}
      </nav>
    </section>
  );
}

/* ───────────── right: send us a message ───────────── */

const looksLikeEmail = (v: string) => {
  const at = v.indexOf("@");
  const dot = v.lastIndexOf(".");
  return at > 0 && at === v.lastIndexOf("@") && dot > at + 1 && dot < v.length - 1 && !/\s/.test(v);
};

/** "+94771234567" / "0771234567" / "771234567" → country + national digits for the phone field (Sri Lanka by default) */
function splitPhone(raw?: string | null): { iso: CountryCode; digits: string } {
  const v = (raw ?? "").replace(/[^\d+]/g, "");
  if (v.startsWith("+")) {
    const c = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((x) => v.startsWith(x.dial));
    if (c) return { iso: c.iso, digits: v.slice(c.dial.length).replace(/^0/, "") };
  }
  return { iso: "lk", digits: v.replace(/^0/, "") };
}

type Sent = { reference: string; demo: boolean };

function MessageForm() {
  const toast = useToast();
  const { session, fullName } = useAuthSession();
  const [topic, setTopic] = useState<SupportTopic | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState<CountryCode>("lk");
  const [reference, setReference] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mobileTouched = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // members: fill in who they are (they can still change it)
  useEffect(() => {
    if (!session) return;
    setName((n) => n || fullName);
    setEmail((e) => e || session.email || "");
    if (session.phoneNumber) {
      const p = splitPhone(session.phoneNumber);
      setMobile((m) => m || p.digits);
      setCountry((c) => (mobileTouched.current ? c : p.iso));
    }
  }, [session, fullName]);

  const errors = {
    topic: topic ? undefined : "Choose what your message is about",
    name: name.trim().length >= 2 ? undefined : "Enter your name",
    email: looksLikeEmail(email.trim()) ? undefined : "Enter your email so we can reply",
    mobile: !mobile || (country === "lk" ? isValidSriLankanMobile(mobile) : mobile.length >= 7) ? undefined : "Check the mobile number, or leave it empty",
    subject: subject.trim().length >= 4 ? undefined : "Add a short subject",
    message: message.trim().length >= 20 ? undefined : "Tell us a bit more (at least 20 characters)",
  };
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    if (!SUPPORT_ATTACHMENT_TYPES.includes(f.type)) {
      setFileError("Use a JPG, PNG, WebP or PDF file.");
      return;
    }
    if (f.size > SUPPORT_ATTACHMENT_MAX_MB * 1024 * 1024) {
      setFileError(`That file is over ${SUPPORT_ATTACHMENT_MAX_MB} MB. Try a smaller screenshot.`);
      return;
    }
    setFileError(null);
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    const firstError = (Object.keys(errors) as (keyof typeof errors)[]).find((k) => errors[k]);
    if (firstError || !topic) {
      const target = { topic: "[data-topic] button", mobile: "input[type=tel]" }[firstError as string] ?? `[name="${firstError}"]`;
      formRef.current?.querySelector<HTMLElement>(target)?.focus();
      return;
    }
    setBusy(true);
    try {
      const r = await sendSupportMessage({
        topic,
        subject: subject.trim(),
        message: message.trim(),
        name: name.trim(),
        email: email.trim(),
        mobile: mobile ? `${COUNTRIES.find((c) => c.iso === country)?.dial ?? "+94"}${mobile}` : undefined,
        paymentReference: topic === "payments" ? reference.trim() || undefined : undefined,
        attachment: file,
      });
      setSent(r);
    } catch (err) {
      toast.error("Message not sent", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setTopic(null);
    setReference("");
    setSubject("");
    setMessage("");
    setFile(null);
    setTried(false);
    setSent(null);
  };

  if (sent) return <SentCard sent={sent} email={email.trim()} onAnother={reset} />;

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => void submit(e)}
      aria-labelledby="message-title"
      className="enter flex min-w-0 flex-col gap-5 rounded-xl border border-line bg-surface-card p-5 shadow-sm sm:p-6 lg:p-8"
      style={{ "--enter-delay": "120ms" } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-icon-brand">
          <Send2 size={22} color="currentColor" />
        </span>
        <div>
          <h2 id="message-title" className="text-h5 text-ink">
            Send us a message
          </h2>
          <p className="text-body-sm text-ink-secondary">Tell us what’s wrong and we’ll get back to you.</p>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2.5" data-topic>
        <legend className="mb-2.5 text-label-md text-ink">What is it about?</legend>
        <div className="flex flex-wrap gap-2">
          {SUPPORT_TOPICS.map((t) => (
            <FilterChip key={t.id} selected={topic === t.id} onClick={() => setTopic(t.id)}>
              {t.label}
            </FilterChip>
          ))}
        </div>
        {show("topic") && <p className="text-body-xs text-error-fg">{errors.topic}</p>}
      </fieldset>

      <Input label="Your name" name="name" value={name} onChange={(e) => setName(e.target.value)} error={show("name")} autoComplete="name" placeholder="Nethmi Perera" />

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={show("email")}
          autoComplete="email"
          placeholder="name@gmail.com"
          helper={show("email") ? undefined : "We reply here"}
        />
        <PhoneField
          label="Mobile"
          hint="Optional"
          compact
          value={mobile}
          onChange={setMobile}
          country={country}
          onCountryChange={(c) => {
            mobileTouched.current = true;
            setCountry(c.iso);
          }}
          error={show("mobile")}
        />
      </div>

      {topic === "payments" && (
        <div className="animate-fade-up">
          <Input
            label="Payment reference"
            hint="Optional"
            name="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder="VK-G3-7K2QXM"
            className="font-mono"
            helper="It’s on your payment page and in the transfer remarks. It helps us find your payment fast."
          />
        </div>
      )}

      <Input label="Subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} error={show("subject")} maxLength={120} placeholder="Paid by bank transfer, plan not active yet" />

      <Textarea
        label="Message"
        name="message"
        value={message}
        onChange={setMessage}
        maxLength={SUPPORT_MESSAGE_MAX}
        rows={6}
        error={show("message")}
        placeholder="What happened, and when? Add any details that help us check it."
      />

      <Attachment file={file} error={fileError} inputRef={fileRef} onPick={pickFile} onRemove={() => setFile(null)} />

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <p className="flex flex-1 items-center gap-2 text-body-xs text-ink-tertiary">
          <ShieldTick size={16} color="currentColor" className="shrink-0 text-success-fg" /> Never share your password or a login code, even with us.
        </p>
        <Button type="submit" size="lg" loading={busy} leftIcon={<Send2 size={18} color="currentColor" />}>
          Send message
        </Button>
      </div>
    </form>
  );
}

function Attachment({
  file,
  error,
  inputRef,
  onPick,
  onRemove,
}: Readonly<{ file: File | null; error: string | null; inputRef: React.RefObject<HTMLInputElement | null>; onPick: (f: File | undefined) => void; onRemove: () => void }>) {
  const [drag, setDrag] = useState(false);
  const isPdf = file?.type === "application/pdf";
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label-md text-ink">
        Screenshot <span className="font-normal text-ink-tertiary">(optional)</span>
      </p>
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-subtle px-4 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-icon-brand">
            {isPdf ? <DocumentText size={20} color="currentColor" /> : <Gallery size={20} color="currentColor" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-md text-ink">{file.name}</p>
            <p className="text-caption text-ink-tertiary">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button type="button" onClick={onRemove} aria-label={`Remove ${file.name}`} className="rounded-full p-1 text-ink-tertiary transition-colors hover:text-error-fg">
            <CloseCircle size={22} color="currentColor" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            onPick(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors focus-within:shadow-ring-brand",
            drag ? "border-brand bg-brand-subtle" : "border-line-strong hover:border-brand hover:bg-brand-subtle",
          )}
        >
          <Gallery size={24} color="currentColor" className="text-icon-brand" />
          <span className="text-label-md text-ink">Add a screenshot or PDF</span>
          <span className="text-caption text-ink-tertiary">JPG, PNG, WebP or PDF up to {SUPPORT_ATTACHMENT_MAX_MB} MB</span>
          <input
            ref={inputRef}
            type="file"
            accept={SUPPORT_ATTACHMENT_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => {
              onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {error && <p className="text-body-xs text-error-fg">{error}</p>}
    </div>
  );
}

function SentCard({ sent, email, onAnother }: Readonly<{ sent: Sent; email: string; onAnother: () => void }>) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <section aria-live="polite" className="flex animate-fade-up flex-col items-center gap-4 rounded-xl border border-line bg-surface-card p-8 text-center shadow-sm sm:p-10">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success-fg">
        <TickCircle size={34} color="currentColor" variant="Bold" />
      </span>
      <h2 ref={ref} tabIndex={-1} className="text-h4 text-ink focus:outline-none">
        Message sent
      </h2>
      <p className="max-w-md text-body-md text-ink-secondary">
        Your ticket is <b className="font-mono text-brand-text">{sent.reference}</b>. We’ll reply to <b className="text-ink">{email}</b> {SUPPORT.replyTime.toLowerCase().replace(/^we reply /, "")}.
      </p>
      {sent.demo && (
        <p className="rounded-md border border-warning-line bg-warning-bg px-4 py-2.5 text-body-sm text-warning-fg">
          Demo mode: the support API isn’t built yet, so nothing was sent.
        </p>
      )}
      <Button variant="outline" size="md" onClick={onAnother}>
        Send another message
      </Button>
    </section>
  );
}
