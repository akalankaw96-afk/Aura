"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CloseCircle,
  Coffee,
  Eye,
  EyeSlash,
  Heart,
  MessageQuestion,
  Mobile,
  Setting2,
  ShieldTick,
  Trash,
  Warning2,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { Alert, Button, Checkbox, LoveSticker, Modal, OtpInput, Textarea, useToast } from "@/components/ui";
import { apiService } from "@/services/api";
import { openFeedback } from "@/lib/feedback";
import {
  DELETE_RULES,
  DEMO_CODE,
  NotAvailableYet,
  confirmDelete,
  readProfileHidden,
  resetDemoAttempts,
  sendDeleteCode,
  setProfileHidden,
} from "@/services/accountClosure";
import { readSessionData } from "@/lib/storage";

/**
 * Account settings popup (profile menu → Account settings). Mounted once in the root layout,
 * opened with openAccountSettings().
 *
 *  home     → account summary · Take a break (hide / show profile) · quiet "Delete account" link
 *  ask      → small "Delete your account?" check (Cancel / Delete account) before the real flow
 *  break    → what hiding does → Hide my profile
 *  reason   → why are you leaving (chips) + optional comment ("Found my partner" → share story)
 *  confirm  → what gets deleted + "I understand" + "Hide instead" escape
 *  code     → SMS code to the verified mobile (OtpInput, resend timer, attempts)
 *  done     → account deleted → signs out → home
 */
export const ACCOUNT_SETTINGS_EVENT = "vk-account-settings";
export const openAccountSettings = () => window.dispatchEvent(new Event(ACCOUNT_SETTINGS_EVENT));

type Step = "home" | "break" | "ask" | "reason" | "confirm" | "code" | "done";

const REASONS = [
  { id: "found-here", label: "I found my partner on Yugadiwi", happy: true },
  { id: "found-elsewhere", label: "I found a partner elsewhere" },
  { id: "not-ready", label: "I’m not ready to marry yet" },
  { id: "no-matches", label: "I didn’t find suitable matches" },
  { id: "privacy", label: "Privacy or safety worries" },
  { id: "too-many-messages", label: "Too many messages or requests" },
  { id: "other", label: "Something else" },
];

function readSession(): { fullName?: string; phoneNumber?: string } {
  return readSessionData<{ fullName?: string; phoneNumber?: string }>() ?? {};
}
const maskPhone = (p?: string) => {
  const d = (p || "").replace(/\D/g, "").replace(/^94/, "").replace(/^0/, "");
  return d.length >= 4 ? `+94 ${d.slice(0, 2)} ••• ••${d.slice(-2)}` : "your mobile";
};

export function AccountSettingsDialog() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("home");
  const [session, setSession] = useState<{ fullName?: string; phoneNumber?: string }>({});
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  // delete flow state
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [tried, setTried] = useState(false);
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<"default" | "error" | "success">("default");
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      setSession(readSession());
      setHidden(readProfileHidden());
      setStep("home");
      setReason("");
      setComment("");
      setUnderstood(false);
      setTried(false);
      setCode("");
      setCodeState("default");
      setCodeMsg(null);
      setLocked(false);
      setOpen(true);
    };
    window.addEventListener(ACCOUNT_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(ACCOUNT_SETTINGS_EVENT, onOpen);
  }, []);

  // resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  if (!open) return null;
  const close = () => {
    if (step === "done") return finishDeleted();
    setOpen(false);
  };

  async function toggleHidden(next: boolean) {
    setBusy(true);
    try {
      const { demo: d } = await setProfileHidden(next, next ? "take-a-break" : undefined);
      setHidden(next);
      toast.success(
        next ? "Your profile is hidden" : "Your profile is visible again",
        next ? "Nobody can find you in search. Your friends and chats are kept." : "Members can find you in search again.",
      );
      if (d) toast.info("Demo", "Saved on this device only until the server supports it.");
      setStep("home");
    } catch (e) {
      toast.error("Couldn’t update your profile", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    setBusy(true);
    setCodeMsg(null);
    try {
      const r = await sendDeleteCode();
      resetDemoAttempts();
      setDemo(r.demo);
      setResendIn(r.resendSeconds);
      setCode("");
      setCodeState("default");
      setLocked(false);
      setStep("code");
      toast.success("Code sent", `We sent a 6-digit code to ${maskPhone(session.phoneNumber)}.`);
    } catch (e) {
      toast.error(e instanceof NotAvailableYet ? "Not available yet" : "Couldn’t send the code", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(value: string) {
    if (value.length !== DELETE_RULES.codeLength || busy || locked) return;
    setBusy(true);
    try {
      const r = await confirmDelete(value, reason, comment, demo);
      if (r.ok) {
        setCodeState("success");
        window.setTimeout(() => setStep("done"), 500);
        return;
      }
      setCodeState("error");
      setLocked(r.reason === "too-many");
      setCodeMsg(codeErrorMessage(r.reason, r.attemptsLeft));
    } catch (e) {
      setCodeState("error");
      setCodeMsg(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function finishDeleted() {
    apiService.logoutAllDevices(); // also clears the old local "hidden" flag (legacy key)
    setOpen(false);
    // full reload: clears every in-memory member state (tokens, caches) after deletion
    window.location.assign("/");
  }

  const back: Partial<Record<Step, Step>> = { break: "home", ask: "home", reason: "ask", confirm: "reason", code: "confirm" };
  const phone = maskPhone(session.phoneNumber);
  const leave = () => setOpen(false);
  const toBreak = () => setStep("break");

  function onCodeChange(v: string) {
    setCode(v);
    if (codeState !== "default") setCodeState("default");
    setCodeMsg(null);
    if (v.length === DELETE_RULES.codeLength) void verify(v);
  }

  function renderStep() {
    switch (step) {
      case "home":
        return (
          <HomeStep
            name={session.fullName}
            phone={phone}
            hidden={hidden}
            busy={busy}
            onShow={() => void toggleHidden(false)}
            onHide={toBreak}
            onDelete={() => setStep("ask")}
            onLeave={leave}
          />
        );
      case "break":
        return <BreakStep busy={busy} onHide={() => void toggleHidden(true)} />;
      case "ask":
        return <AskStep hidden={hidden} onBreak={toBreak} onCancel={() => setStep("home")} onDelete={() => setStep("reason")} />;
      case "reason":
        return (
          <ReasonStep
            reason={reason}
            setReason={setReason}
            comment={comment}
            setComment={setComment}
            tried={tried}
            setTried={setTried}
            hidden={hidden}
            onBreak={toBreak}
            onContinue={() => setStep("confirm")}
            onLeave={leave}
          />
        );
      case "confirm":
        return (
          <ConfirmStep
            understood={understood}
            setUnderstood={setUnderstood}
            tried={tried}
            setTried={setTried}
            busy={busy}
            phone={phone}
            onSend={() => void sendCode()}
            onKeep={close}
          />
        );
      case "code":
        return (
          <CodeStep
            phone={phone}
            demo={demo}
            code={code}
            codeState={codeState}
            codeMsg={codeMsg}
            busy={busy}
            locked={locked}
            resendIn={resendIn}
            onCodeChange={onCodeChange}
            onVerify={() => void verify(code)}
            onResend={() => void sendCode()}
          />
        );
      default:
        return <DoneStep demo={demo} onHome={finishDeleted} />;
    }
  }

  return (
    <Modal open onClose={close} labelledBy="account-title" size="md" animationKey={step} hideClose>
          <DialogHeader step={step} back={back[step]} onBack={setStep} onClose={close} />

          <div className="flex flex-col gap-5 p-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:p-6">
            {renderStep()}

            {(step === "reason" || step === "confirm") && <SupportLine onLeave={() => setOpen(false)} />}
          </div>
    </Modal>
  );
}


/* ───────────── header + steps (split out to keep each piece small) ───────────── */

const TITLES: Record<Step, string> = {
  home: "Account settings",
  break: "Take a break",
  ask: "Delete account",
  reason: "Delete account",
  confirm: "Delete account",
  code: "Delete account",
  done: "Account deleted",
};
const DANGER_STEP: Partial<Record<Step, 1 | 2 | 3>> = { reason: 1, confirm: 2, code: 3 };

function codeErrorMessage(reason: string | undefined, attemptsLeft?: number) {
  if (reason === "too-many") return "Too many wrong codes. Request a new code to try again.";
  if (reason === "expired") return "This code has expired. Request a new one.";
  const tries = attemptsLeft === 1 ? "try" : "tries";
  return `That code isn’t right. ${attemptsLeft} ${tries} left.`;
}

function DialogHeader({ step, back, onBack, onClose }: Readonly<{ step: Step; back?: Step; onBack: (s: Step) => void; onClose: () => void }>) {
  const dangerAt = DANGER_STEP[step];
  return (
    <div className={cn("sticky top-0 z-10 flex items-center gap-3 border-b border-line px-5 py-4 backdrop-blur", dangerAt ? "bg-error-bg/80" : "bg-surface-card/90")}>
      {back ? (
        <button type="button" onClick={() => onBack(back)} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-subtle hover:text-ink">
          <ArrowLeft size={20} color="currentColor" />
        </button>
      ) : (
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", step === "done" ? "bg-success-bg text-success-fg" : "bg-brand-subtle text-brand")}>
          <Setting2 size={18} color="currentColor" />
        </span>
      )}
      <h2 id="account-title" className="flex-1 text-h6 text-ink">
        {TITLES[step]}
      </h2>
      {dangerAt && <StepDots at={dangerAt} />}
      <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-ink-tertiary hover:text-ink focus-visible:outline-none focus-visible:shadow-ring-brand">
        <CloseCircle size={24} color="currentColor" />
      </button>
    </div>
  );
}

function HomeStep({
  name,
  phone,
  hidden,
  busy,
  onShow,
  onHide,
  onDelete,
  onLeave,
}: Readonly<{ name?: string; phone: string; hidden: boolean; busy: boolean; onShow: () => void; onHide: () => void; onDelete: () => void; onLeave: () => void }>) {
  return (
    <>
      <div className="flex items-center gap-3 rounded-lg bg-surface-subtle p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-h6 text-ink-on-brand">
          {(name || "V").trim()[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-label-lg text-ink">{name || "Your account"}</p>
          <p className="flex items-center gap-1.5 text-body-sm text-ink-secondary">
            <Mobile size={14} color="currentColor" /> {phone} · verified
          </p>
        </div>
        <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-label-sm", hidden ? "bg-warning-bg text-warning-fg" : "bg-success-bg text-success-fg")}>
          {hidden ? <EyeSlash size={14} color="currentColor" /> : <Eye size={14} color="currentColor" />}
          {hidden ? "Hidden" : "Visible"}
        </span>
      </div>

      {/* take a break */}
      <section className="flex flex-col gap-3 rounded-lg border border-line p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-premium-bg text-premium-fg">
            <Coffee size={20} color="currentColor" />
          </span>
          <div className="flex-1">
            <h3 className="text-label-lg text-ink">{hidden ? "Your profile is hidden" : "Take a break"}</h3>
            <p className="text-body-sm text-ink-secondary">
              {hidden
                ? "Nobody can find you in search. Show your profile again whenever you’re ready."
                : "Hide your profile from search for a while. Your friends, chats and plan are kept."}
            </p>
          </div>
        </div>
        {hidden ? (
          <Button variant="outline" size="md" loading={busy} onClick={onShow} leftIcon={<Eye size={18} color="currentColor" />}>
            Show my profile again
          </Button>
        ) : (
          <Button variant="outline" size="md" onClick={onHide} leftIcon={<EyeSlash size={18} color="currentColor" />}>
            Hide my profile
          </Button>
        )}
      </section>

      {/* delete: deliberately low-key, opens a confirmation first */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-body-xs text-ink-tertiary">Want to leave Yugadiwi for good?</p>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 text-label-sm text-ink-tertiary underline underline-offset-4 transition-colors hover:text-error-fg focus-visible:outline-none focus-visible:shadow-ring-brand"
        >
          Delete account
        </button>
      </div>

      <p className="text-center text-body-xs text-ink-tertiary">
        Read how we handle deletion in our{" "}
        <Link href="/privacy#delete-account" onClick={onLeave} className="font-semibold text-brand-text underline-offset-4 hover:underline">
          Privacy Policy
        </Link>
      </p>
    </>
  );
}

function BreakStep({ busy, onHide }: Readonly<{ busy: boolean; onHide: () => void }>) {
  return (
    <>
      <Illustration tone="calm" />
      <div className="flex flex-col gap-1 text-center">
        <h3 className="text-h5 text-ink">Need some time?</h3>
        <p className="text-body-sm text-ink-secondary">Hiding is the gentle option. You can come back any time with one tap.</p>
      </div>
      <ul className="flex flex-col gap-2 rounded-lg bg-surface-subtle p-4 text-body-sm text-ink">
        {[
          [EyeSlash, "Your profile disappears from search and Best matches"],
          [Heart, "Your friends, favourites and chats stay as they are"],
          [ShieldTick, "Your plan keeps running (it doesn’t pause)"],
        ].map(([I, t]) => {
          const Icon = I as typeof Heart;
          return (
            <li key={t as string} className="flex items-center gap-2.5">
              <Icon size={18} color="currentColor" className="shrink-0 text-brand" /> {t as string}
            </li>
          );
        })}
      </ul>
      <Button size="lg" fullWidth loading={busy} onClick={onHide} leftIcon={<EyeSlash size={20} color="currentColor" />}>
        Hide my profile
      </Button>
    </>
  );
}

function AskStep({ hidden, onBreak, onCancel, onDelete }: Readonly<{ hidden: boolean; onBreak: () => void; onCancel: () => void; onDelete: () => void }>) {
  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error-bg text-error-fg">
          <Trash size={28} color="currentColor" />
        </span>
        <h3 className="text-h5 text-ink">Delete your account?</h3>
        <p className="text-body-sm text-ink-secondary">
          Your profile, photos, chats and ID documents will be deleted permanently. This can’t be undone.
        </p>
      </div>
      {!hidden && (
        <button type="button" onClick={onBreak} className="flex items-center gap-3 rounded-lg bg-premium-bg p-3 text-left ring-1 ring-inset ring-premium-line">
          <Coffee size={20} color="currentColor" className="shrink-0 text-premium-fg" />
          <span className="flex-1 text-body-sm text-ink">
            <b className="font-semibold">Just need a break?</b> Hide your profile instead, and come back any time.
          </span>
        </button>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button variant="outline" size="lg" className="sm:flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="lg" className="sm:flex-1" onClick={onDelete}>
          Delete account
        </Button>
      </div>
    </>
  );
}

function ReasonStep({
  reason,
  setReason,
  comment,
  setComment,
  tried,
  setTried,
  hidden,
  onBreak,
  onContinue,
  onLeave,
}: Readonly<{
  reason: string;
  setReason: (r: string) => void;
  comment: string;
  setComment: (c: string) => void;
  tried: boolean;
  setTried: (t: boolean) => void;
  hidden: boolean;
  onBreak: () => void;
  onContinue: () => void;
  onLeave: () => void;
}>) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h3 className="text-h5 text-ink">We’re sorry to see you go</h3>
        <p className="text-body-sm text-ink-secondary">Why are you leaving? Your answer helps us improve.</p>
      </div>
      <div role="radiogroup" aria-label="Reason for leaving" className="flex flex-col gap-2">
        {REASONS.map((r) => {
          const on = reason === r.id;
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setReason(r.id);
                setTried(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-md border px-4 py-3 text-left text-body-md transition-colors",
                on ? "border-brand bg-brand-subtle text-ink" : "border-line text-ink-secondary hover:border-line-strong hover:text-ink",
                tried && !reason && "border-error-line",
              )}
            >
              <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", on ? "border-brand" : "border-line-strong")}>
                {on && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
              </span>
              {r.label}
            </button>
          );
        })}
      </div>
      {tried && !reason && (
        <p role="alert" className="-mt-2 text-body-sm text-error-fg">
          Choose a reason to continue
        </p>
      )}

      {reason === "found-here" && (
        <div className="flex items-center gap-3 rounded-lg bg-premium-bg p-4 ring-1 ring-inset ring-premium-line">
          <LoveSticker variant="double" size={36} />
          <p className="flex-1 text-body-sm text-ink">
            Congratulations! Would you share your story to inspire other families?
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onLeave();
              openFeedback("story");
            }}
          >
            Share story
          </Button>
        </div>
      )}

      <Textarea label="Anything else you’d like to tell us?" hint="Optional" rows={3} maxLength={500} value={comment} onChange={setComment} placeholder="Your comment goes only to our team." />

      <div className="flex flex-col gap-2">
        <Button
          variant="danger"
          size="lg"
          fullWidth
          onClick={() => {
            setTried(true);
            if (reason) onContinue();
          }}
        >
          Continue
        </Button>
        {!hidden && (
          <button type="button" onClick={onBreak} className="py-2 text-center text-label-md text-brand-text hover:underline">
            Just need a break? Hide my profile instead
          </button>
        )}
      </div>
    </>
  );
}

function ConfirmStep({
  understood,
  setUnderstood,
  tried,
  setTried,
  busy,
  phone,
  onSend,
  onKeep,
}: Readonly<{ understood: boolean; setUnderstood: (v: boolean) => void; tried: boolean; setTried: (t: boolean) => void; busy: boolean; phone: string; onSend: () => void; onKeep: () => void }>) {
  return (
    <>
      <div className="flex items-start gap-3 rounded-lg bg-error-bg p-4 text-error-fg">
        <Warning2 size={22} color="currentColor" className="mt-0.5 shrink-0" />
        <div>
          <p className="text-label-lg">This is permanent</p>
          <p className="text-body-sm">Once deleted, your account can’t be recovered.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-md text-ink">What will be deleted</p>
        <ul className="grid gap-2 text-body-sm text-ink-secondary sm:grid-cols-2">
          {["Your profile and photos", "Friends, favourites and interests", "All chats and shared contacts", "ID documents and verification", "Your plan (no refund for unused time)", "Your login and mobile link"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Trash size={15} color="currentColor" className="shrink-0 text-error-fg" /> {t}
            </li>
          ))}
        </ul>
        <p className="text-body-xs text-ink-tertiary">Your profile disappears straight away; the rest is erased within 30 days. We keep only what the law requires (for example payment records).</p>
      </div>
      <Checkbox
        checked={understood}
        onChange={(v) => {
          setUnderstood(v);
          setTried(false);
        }}
        error={tried && !understood}
      >
        I understand my account and data will be deleted permanently
      </Checkbox>
      {tried && !understood && (
        <p role="alert" className="-mt-3 pl-7 text-body-sm text-error-fg">
          Tick the box to continue
        </p>
      )}
      <Button
        variant="danger"
        size="lg"
        fullWidth
        loading={busy}
        leftIcon={<Mobile size={20} color="currentColor" />}
        onClick={() => {
          setTried(true);
          if (understood) onSend();
        }}
      >
        Send code to {phone}
      </Button>
      <Button variant="outline" size="md" fullWidth onClick={onKeep}>
        Keep my account
      </Button>
    </>
  );
}

function CodeStep({
  phone,
  demo,
  code,
  codeState,
  codeMsg,
  busy,
  locked,
  resendIn,
  onCodeChange,
  onVerify,
  onResend,
}: Readonly<{
  phone: string;
  demo: boolean;
  code: string;
  codeState: "default" | "error" | "success";
  codeMsg: string | null;
  busy: boolean;
  locked: boolean;
  resendIn: number;
  onCodeChange: (v: string) => void;
  onVerify: () => void;
  onResend: () => void;
}>) {
  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error-bg text-error-fg">
          <ShieldTick size={28} color="currentColor" />
        </span>
        <h3 className="text-h5 text-ink">Confirm it’s you</h3>
        <p className="text-body-sm text-ink-secondary">
          Enter the 6-digit code we sent to <b className="text-ink">{phone}</b>
        </p>
      </div>
      {demo && (
        <Alert type="warning" title="Demo mode">
          The server can’t send deletion codes yet, so nothing is deleted. Use {DEMO_CODE} to try the flow.
        </Alert>
      )}
      <OtpInput
        value={code}
        onChange={onCodeChange}
        state={codeState}
        disabled={busy || locked}
        autoFocus
      />
      {codeMsg && (
        <p role="alert" className="-mt-2 text-center text-body-sm text-error-fg">
          {codeMsg}
        </p>
      )}
      <Button variant="danger" size="lg" fullWidth loading={busy} disabled={code.length !== DELETE_RULES.codeLength || locked} onClick={onVerify}>
        Delete my account
      </Button>
      <p className="text-center text-body-sm text-ink-secondary">
        Didn’t get it?{" "}
        {resendIn > 0 ? (
          <span className="text-ink-tertiary">Resend in 0:{String(resendIn).padStart(2, "0")}</span>
        ) : (
          <button type="button" onClick={onResend} className="font-semibold text-brand-text hover:underline">
            Send a new code
          </button>
        )}
      </p>
    </>
  );
}

function DoneStep({ demo, onHome }: Readonly<{ demo: boolean; onHome: () => void }>) {
  return (
    <>
      <Illustration tone="bye" />
      <div className="flex flex-col gap-2 text-center">
        <h3 className="text-h4 text-ink">Your account has been deleted</h3>
        <p className="text-body-md text-ink-secondary">
          {demo
            ? "Demo: nothing was deleted on the server. In the real flow your profile is removed now and your data within 30 days."
            : "Your profile is gone from Yugadiwi and the rest of your data will be erased within 30 days. Thank you for being part of our community."}
        </p>
      </div>
      <Button size="lg" fullWidth onClick={onHome}>
        Go to home page
      </Button>
      <p className="text-center text-body-xs text-ink-tertiary">
        Changed your mind? You’re always welcome to create a new account.
      </p>
    </>
  );
}

function SupportLine({ onLeave }: Readonly<{ onLeave: () => void }>) {
  return (
    <p className="flex items-center justify-center gap-1.5 text-body-xs text-ink-tertiary">
      <MessageQuestion size={14} color="currentColor" /> Problem with your account?{" "}
      <Link href="/support" onClick={onLeave} className="font-semibold text-brand-text hover:underline">
        Talk to support
      </Link>
    </p>
  );
}

function StepDots({ at }: Readonly<{ at: 1 | 2 | 3 }>) {
  return (
    <span aria-label={`Step ${at} of 3`} className="flex items-center gap-1">
      {[1, 2, 3].map((n) => (
        <span key={n} className={cn("h-1.5 rounded-full transition-all", n === at ? "w-5 bg-error-fg" : n < at ? "w-1.5 bg-error-fg" : "w-1.5 bg-line-strong")} />
      ))}
    </span>
  );
}

/** Top illustration (brand couple + love stickers), like the feedback popup. */
function Illustration({ tone }: Readonly<{ tone: "calm" | "bye" }>) {
  return (
    <div className="relative mx-auto flex h-[120px] w-full items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(180deg,var(--color-bg-brand-subtle),var(--color-surface-card))]">
      <LoveSticker variant="outline" size={36} rotate={-14} className="kyc-pop absolute left-[18%] top-5" />
      <LoveSticker variant={tone === "bye" ? "sparkle" : "outline"} size={34} rotate={12} className="kyc-pop absolute right-[18%] top-4 [animation-delay:120ms]" />
      <Image src="/brand/couple.png" alt="" width={88} height={88} className={cn("kyc-pop h-[88px] w-[88px] rounded-full border-4 border-surface-card object-cover shadow-md", tone === "calm" && "grayscale-[25%]")} />
    </div>
  );
}
