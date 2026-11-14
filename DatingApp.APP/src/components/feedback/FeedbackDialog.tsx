"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseCircle, Crown1, Heart, MessageQuestion, Star1, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button, Checkbox, FilterChip, Input, LoveSticker, Textarea, useToast } from "@/components/ui";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { requireMember, useSignedIn } from "@/lib/session";
import { useAccess } from "@/lib/verification";
import {
  FEEDBACK_EVENT,
  dontAskFeedbackAgain,
  feedbackDue,
  markFeedbackShown,
  saveFeedback,
  type FeedbackStep,
} from "@/lib/feedback";

/**
 * Feedback popup for paid members (Gold / Platinum). Mounted once in the root layout.
 * Opens automatically on the dashboard after a happy moment (rules in lib/feedback),
 * or from "Share feedback" (profile menu, support page) via openFeedback().
 *
 * Steps: rate (1–5 stars) → happy (4–5: tags, public review, story link)
 *                         → unhappy (1–3: private feedback, support link)
 *        story (success story form) · thanks
 */
type Step = "rate" | "happy" | "unhappy" | "story" | "thanks";

const HAPPY_TAGS = ["Genuine profiles", "Safe and private", "Easy to use", "Good value", "Helpful support"];
const UNHAPPY_TAGS = ["Not enough matches", "Slow replies", "Price", "App problem", "Profile quality"];
const MAX_PHOTOS = 3;

export function FeedbackDialog() {
  const pathname = usePathname();
  const signedIn = useSignedIn();
  const { locked, isPaid } = useAccess();
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [auto, setAuto] = useState(false);
  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [publicOk, setPublicOk] = useState(true);
  const [story, setStory] = useState({ name: "", partner: "", date: "", city: "", text: "" });
  const [photos, setPhotos] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const [reference, setReference] = useState("");
  const [thanksFor, setThanksFor] = useState<"review" | "private" | "story">("review");

  function reset(to: Step) {
    setStep(to);
    setRating(0);
    setHover(0);
    setTags([]);
    setMessage("");
    setPublicOk(true);
    setStory({ name: "", partner: "", date: "", city: "", text: "" });
    setPhotos([]);
    setConsent(false);
    setTried(false);
  }

  // manual open (profile menu, support page, demo) — paid members only
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ step: FeedbackStep }>).detail;
      if (!requireMember("share feedback")) return;
      if (locked || !isPaid) {
        toast.info("Feedback is for Gold and Platinum members", "For help with your account, use Email, WhatsApp or Hotline on the support page.");
        return;
      }
      reset(detail?.step === "story" ? "story" : "rate");
      setAuto(false);
      setOpen(true);
    };
    window.addEventListener(FEEDBACK_EVENT, onOpen);
    return () => window.removeEventListener(FEEDBACK_EVENT, onOpen);
  }, [locked, isPaid, toast]);

  // automatic open: dashboard only, ~2 s after it settles, when a happy moment is due
  useEffect(() => {
    if (pathname !== "/dashboard" || !signedIn || locked || !isPaid) return;
    const t = window.setTimeout(() => {
      if (!feedbackDue()) return;
      markFeedbackShown();
      reset("rate");
      setAuto(true);
      setOpen(true);
    }, 2000);
    return () => window.clearTimeout(t);
  }, [pathname, signedIn, locked, isPaid]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const prev = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const close = () => setOpen(false);
  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  function pickRating(n: number) {
    setRating(n);
    setTags([]);
    window.setTimeout(() => setStep(n >= 4 ? "happy" : "unhappy"), 260);
  }

  function finish(type: "review" | "private" | "story", extra: Parameters<typeof saveFeedback>[0]) {
    const saved = saveFeedback(extra);
    setReference(saved.reference);
    setThanksFor(type);
    setStep("thanks");
  }

  function sendHappy() {
    finish("review", { type: "review", rating, tags, message: message.trim(), publicOk });
  }

  const unhappyError = tried && !tags.length && message.trim().length < 5 ? "Pick a reason or tell us a little more" : undefined;
  function sendUnhappy() {
    setTried(true);
    if (!tags.length && message.trim().length < 5) return;
    finish("private", { type: "private", rating, tags, message: message.trim() });
  }

  const storyErrors = {
    name: tried && !story.name.trim() ? "Enter your first name" : undefined,
    partner: tried && !story.partner.trim() ? "Enter your partner’s first name" : undefined,
    text: tried && story.text.trim().length < 30 ? "Write at least 30 characters" : undefined,
    consent: tried && !consent,
  };
  function sendStory() {
    setTried(true);
    if (!story.name.trim() || !story.partner.trim() || story.text.trim().length < 30 || !consent) return;
    finish("story", { type: "story", story: { ...story, photos: photos.length } });
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files)
      .slice(0, MAX_PHOTOS - photos.length)
      .forEach((f) => {
        if (!f.type.startsWith("image/") || f.size > 8 * 1024 * 1024) {
          toast.error("Couldn’t add photo", "Use a JPG or PNG under 8 MB.");
          return;
        }
        const r = new FileReader();
        r.onload = () => setPhotos((p) => (p.length < MAX_PHOTOS ? [...p, String(r.result)] : p));
        r.readAsDataURL(f);
      });
  }

  const shown = hover || rating;
  const titleId = "feedback-title";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/45 backdrop:backdrop-blur-md"
    >
      <div className="flex h-full items-end justify-center sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
        <div key={step} className="relative max-h-full w-full max-w-[460px] animate-dialog-in overflow-y-auto rounded-t-[28px] bg-surface-card shadow-xl sm:rounded-[28px]">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 rounded-full p-1 text-ink-tertiary transition-colors hover:bg-surface-card hover:text-ink focus-visible:outline-none focus-visible:shadow-ring-brand"
          >
            <CloseCircle size={24} color="currentColor" />
          </button>

          <Illustration step={step} />

          <div className="flex flex-col gap-4 px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5">
            {step === "rate" && (
              <>
                <div className="flex flex-col gap-1 text-center">
                  <h2 id={titleId} className="text-h5 text-ink">How’s Vikasitha going for you?</h2>
                  <p className="text-body-sm text-ink-secondary">One tap helps us make it better for families like yours.</p>
                </div>
                <Stars value={shown} onHover={setHover} onPick={pickRating} size={40} />
                <p className="h-5 text-center text-label-md text-ink-tertiary" aria-live="polite">
                  {["", "Not good", "Could be better", "It’s okay", "Good", "Love it"][shown]}
                </p>
                <Button variant="outline" size="md" fullWidth onClick={close}>
                  Not now
                </Button>
                {auto && (
                  <button
                    type="button"
                    onClick={() => {
                      dontAskFeedbackAgain();
                      close();
                    }}
                    className="-mt-1 self-center text-label-sm text-ink-tertiary underline-offset-4 hover:text-ink hover:underline"
                  >
                    Don’t ask again
                  </button>
                )}
              </>
            )}

            {step === "happy" && (
              <>
                <Stars value={rating} onPick={pickRating} size={26} />
                <div className="flex flex-col gap-1 text-center">
                  <h2 id={titleId} className="text-h5 text-ink">Glad it’s going well</h2>
                  <p className="text-body-sm text-ink-secondary">What do you like most? Pick any.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {HAPPY_TAGS.map((t) => (
                    <FilterChip key={t} selected={tags.includes(t)} onClick={() => toggleTag(t)} className="h-8 px-3 text-label-sm">
                      {t}
                    </FilterChip>
                  ))}
                </div>
                <Textarea label="Your review" hint="Optional" rows={3} maxLength={300} value={message} onChange={setMessage} placeholder="Tell other families about your experience…" />
                <Checkbox checked={publicOk} onChange={setPublicOk}>
                  OK to show my review with my first name and city on the website
                </Checkbox>
                <button
                  type="button"
                  onClick={() => {
                    setTried(false);
                    setStep("story");
                  }}
                  className="flex items-center gap-3 rounded-[16px] bg-premium-bg p-3 text-left ring-1 ring-inset ring-premium-line transition-transform hover:-translate-y-0.5"
                >
                  <LoveSticker variant="double" size={36} />
                  <span className="flex-1">
                    <span className="block text-label-md text-ink">Found your partner?</span>
                    <span className="block text-body-xs text-ink-secondary">Share your success story and inspire others</span>
                  </span>
                  <Crown1 size={18} color="currentColor" className="text-premium-fg" />
                </button>
                <Button size="lg" fullWidth onClick={sendHappy}>
                  Send review
                </Button>
              </>
            )}

            {step === "unhappy" && (
              <>
                <Stars value={rating} onPick={pickRating} size={26} />
                <div className="flex flex-col gap-1 text-center">
                  <h2 id={titleId} className="text-h5 text-ink">What could we do better?</h2>
                  <p className="text-body-sm text-ink-secondary">Only our team sees this. It’s never published.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {UNHAPPY_TAGS.map((t) => (
                    <FilterChip key={t} selected={tags.includes(t)} onClick={() => toggleTag(t)} className="h-8 px-3 text-label-sm">
                      {t}
                    </FilterChip>
                  ))}
                </div>
                <Textarea label="Tell us what happened" rows={3} maxLength={500} value={message} onChange={setMessage} placeholder="The more you share, the faster we can fix it…" error={unhappyError} />
                <Button size="lg" fullWidth onClick={sendUnhappy}>
                  Send feedback
                </Button>
                <p className="text-center text-body-sm text-ink-tertiary">
                  Need help now?{" "}
                  <Link href="/support" onClick={close} className="font-semibold text-brand-text underline-offset-4 hover:underline">
                    Contact support
                  </Link>
                </p>
              </>
            )}

            {step === "story" && (
              <>
                <div className="flex flex-col gap-1 text-center">
                  <h2 id={titleId} className="text-h5 text-ink">Share your success story</h2>
                  <p className="text-body-sm text-ink-secondary">We check every story and contact you before it goes live.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Your first name" value={story.name} onChange={(e) => setStory({ ...story, name: e.target.value })} error={storyErrors.name} placeholder="Nethmi" />
                  <Input label="Partner’s first name" value={story.partner} onChange={(e) => setStory({ ...story, partner: e.target.value })} error={storyErrors.partner} placeholder="Kasun" />
                  <Input label="Wedding date" hint="Optional" type="date" value={story.date} onChange={(e) => setStory({ ...story, date: e.target.value })} />
                  <Input label="City" hint="Optional" value={story.city} onChange={(e) => setStory({ ...story, city: e.target.value })} placeholder="Kandy" />
                </div>
                <Textarea label="How did you meet on Vikasitha?" rows={4} maxLength={800} value={story.text} onChange={(v) => setStory({ ...story, text: v })} placeholder="How you found each other, the first chat, meeting the families…" error={storyErrors.text} />
                <div className="flex flex-col gap-2">
                  <p className="text-label-md text-ink">
                    Photos <span className="text-ink-tertiary">· optional, up to {MAX_PHOTOS}</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((src, i) => (
                      <PhotoSlot key={i} src={src} className="aspect-square" onPick={() => fileRef.current?.click()} onRemove={() => setPhotos((p) => p.filter((_, j) => j !== i))} />
                    ))}
                    {photos.length < MAX_PHOTOS && <PhotoSlot src={null} className="aspect-square" label="Add" onPick={() => fileRef.current?.click()} />}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
                </div>
                <Checkbox checked={consent} onChange={setConsent} error={storyErrors.consent}>
                  We both agree to publish this story and photos on Vikasitha
                </Checkbox>
                {storyErrors.consent && <p role="alert" className="-mt-2 text-body-xs text-error-fg">Both of you need to agree before we can publish</p>}
                <Button size="lg" fullWidth onClick={sendStory}>
                  Submit story
                </Button>
              </>
            )}

            {step === "thanks" && (
              <div className="flex flex-col items-center gap-3 text-center">
                <h2 id={titleId} className="text-h5 text-ink">
                  {thanksFor === "story" ? "Thank you for sharing your story" : "Thank you for your feedback"}
                </h2>
                <p className="text-body-sm text-ink-secondary">
                  {thanksFor === "story"
                    ? "Our team will read it and contact you before it appears on Vikasitha."
                    : thanksFor === "private"
                      ? "Our team reads every message. We’ll use it to make Vikasitha better."
                      : "It means a lot to us and helps other families trust Vikasitha."}
                </p>
                <span className="rounded-full bg-surface-subtle px-3 py-1 text-label-sm text-ink-secondary">Reference {reference}</span>
                <Button size="lg" fullWidth onClick={close} className="mt-1">
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}

function Stars({ value, onPick, onHover, size }: { value: number; onPick: (n: number) => void; onHover?: (n: number) => void; size: number }) {
  return (
    <div role="radiogroup" aria-label="Your rating" className="flex justify-center gap-1.5" onMouseLeave={() => onHover?.(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => onHover?.(n)}
          onFocus={() => onHover?.(n)}
          onClick={() => onPick(n)}
          className="rounded-full p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:shadow-ring-brand active:scale-95"
        >
          <Star1 size={size} color="currentColor" variant={n <= value ? "Bold" : "Linear"} className={cn("transition-colors", n <= value ? "text-premium-fg" : "text-ink-disabled")} />
        </button>
      ))}
    </div>
  );
}

/** Top illustration: the brand couple in a soft band with love stickers (changes per step). */
function Illustration({ step }: { step: Step }) {
  const badge =
    step === "thanks" ? { Icon: TickCircle, cls: "bg-success-fg" }
    : step === "unhappy" ? { Icon: MessageQuestion, cls: "bg-brand" }
    : step === "story" ? { Icon: Heart, cls: "bg-brand" }
    : { Icon: Star1, cls: "bg-premium-fg" };
  const calm = step === "unhappy";
  return (
    <div className="relative flex h-[148px] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,var(--color-bg-brand-subtle),var(--color-surface-card))]">
      <LoveSticker variant={calm ? "outline" : "double"} size={44} rotate={-14} className="kyc-pop absolute left-[18%] top-6" />
      <LoveSticker variant={calm ? "outline" : "sparkle"} size={40} rotate={12} className="kyc-pop absolute right-[18%] top-5 [animation-delay:120ms]" />
      <LoveSticker variant="filled" size={24} rotate={-8} className={cn("kyc-pop absolute bottom-6 left-[27%] [animation-delay:200ms]", calm && "opacity-50")} />
      <LoveSticker variant="sticker" size={30} rotate={10} className={cn("kyc-pop absolute bottom-5 right-[26%] [animation-delay:260ms]", calm && "opacity-50")} />
      <span className="kyc-pop relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/couple.png" alt="" width={104} height={104} className={cn("h-[104px] w-[104px] rounded-full border-4 border-surface-card object-cover shadow-md", calm && "grayscale-[35%]")} />
        <span className={cn("absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-surface-card text-white", badge.cls)}>
          <badge.Icon size={16} color="currentColor" variant="Bold" />
        </span>
      </span>
    </div>
  );
}
