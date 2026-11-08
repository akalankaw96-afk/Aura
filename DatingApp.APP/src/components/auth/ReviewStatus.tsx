"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight2,
  Calendar,
  Clock,
  Crown1,
  Edit2,
  Gallery,
  MessageText1,
  SearchNormal1,
  ShieldTick,
  Star1,
  TickCircle,
} from "iconsax-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardTitle,
  CoupleAvatar,
  Input,
  Stepper,
  Textarea,
  useFlashToast,
  useToast,
  LoveSticker,
  type BadgeTone,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { ageFrom, containsContactDetails, loadDraft, saveDraft, type RegistrationDraft } from "@/lib/demo";
import { AuthShell } from "./AuthShell";
import { DemoTips } from "./DemoTips";

/**
 * Journey 7 · Review & go live
 *   submitted   → 06a  under review (timeline)
 *   changes     → 06b  admin rejected some fields (field status badges)
 *   edit        → 06d / 06e  fix only the flagged fields
 *   resubmitted → 06f  changes sent for review
 *   live        → 06 / 06c  profile approved
 * The admin decision is simulated from the Demo tips panel.
 */
type View = "submitted" | "changes" | "edit" | "resubmitted" | "live";

const FLAGGED = [
  { key: "photo", label: "Main photo", reason: "Face not clearly visible — upload a clear photo", Icon: Gallery },
  { key: "about", label: "About you", reason: "Contains a phone number — please remove it", Icon: MessageText1 },
  { key: "dob", label: "Date of birth", reason: "Doesn’t match your ID — check and update", Icon: Calendar },
] as const;

export function ReviewStatus() {
  const router = useRouter();
  const toast = useToast();
  useFlashToast();
  const [draft, setDraft] = useState<RegistrationDraft | null>(null);
  const [view, setView] = useState<View>("submitted");

  useEffect(() => {
    const d = loadDraft();
    setDraft(d);
    setView(d.reviewStatus === "changes" ? "changes" : d.reviewStatus);
  }, []);

  const setStatus = (v: View) => {
    setView(v);
    if (v !== "edit") setDraft(saveDraft({ reviewStatus: v }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const approve = () => {
    setStatus("live");
    toast.success("Your profile is live!", "Families can now find you on Vikasitha.");
  };
  const requestChanges = () => {
    setStatus("changes");
    toast.warning("Changes needed", "Our safety team flagged 3 fields on your profile.");
  };

  const name = draft?.fullName?.split(" ")[0] || "Nethmi";

  return (
    <AuthShell>
      <Stepper step={5} className="max-w-[680px]" />
      <Card className="w-full max-w-[680px] p-5 sm:p-8">
        {view === "submitted" && <Submitted onBrowse={() => router.push("/")} />}
        {view === "changes" && <ChangesNeeded onFix={() => setStatus("edit")} />}
        {view === "edit" && draft && (
          <FixFields
            draft={draft}
            onCancel={() => setStatus("changes")}
            onResubmit={(patch) => {
              setDraft(saveDraft(patch));
              setStatus("resubmitted");
              toast.success("Changes submitted", "We’ll notify you by SMS once approved.");
            }}
          />
        )}
        {view === "resubmitted" && <Resubmitted onBrowse={() => router.push("/")} />}
        {view === "live" && <Live name={name} onMatches={() => router.push("/")} />}
      </Card>

      <DemoTips
        tips={[
          { label: "Admin review is simulated here" },
          { label: "Status now", value: view },
        ]}
        actions={[
          { label: "Admin approves", onClick: approve },
          { label: "Admin requests changes", onClick: requestChanges },
          { label: "Back to ‘under review’", onClick: () => setStatus("submitted") },
        ]}
      />
    </AuthShell>
  );
}

/* ── shared bits ───────────────────────────────────────── */

/** Figma: Celebration — couple illustration + Love Stickers */
function Celebration() {
  return (
    <div className="relative mx-auto h-[104px] w-[150px]">
      <CoupleAvatar size={96} className="absolute left-1/2 top-1 -translate-x-1/2 shadow-md" />
      <LoveSticker variant="sparkle" size={30} rotate={-10} className="absolute left-0 top-5" />
      <LoveSticker variant="filled" size={34} rotate={14} className="absolute -right-1 top-0" />
      <LoveSticker variant="double" size={28} rotate={8} className="absolute bottom-2 right-2" />
      <LoveSticker variant="outline" size={24} rotate={-12} className="absolute bottom-1 left-3" />
    </div>
  );
}

function StatusRow({ Icon, title, sub, badge, tone, onClick, iconTone = "brand" }: { Icon: typeof Clock; title: string; sub: string; badge?: string; tone?: BadgeTone; onClick?: () => void; iconTone?: "brand" | "success" | "error" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn("flex w-full items-center gap-3 rounded-md bg-surface-subtle px-4 py-3 text-left", onClick && "transition-colors hover:bg-brand-subtle")}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-surface-card",
          iconTone === "brand" && "text-brand",
          iconTone === "success" && "text-success-fg",
          iconTone === "error" && "text-error-fg"
        )}
      >
        <Icon size={20} color="currentColor" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-bold text-ink">{title}</span>
        <span className="block text-body-xs text-ink-tertiary">{sub}</span>
      </span>
      {badge && <Badge tone={tone}>{badge}</Badge>}
      {onClick && <ArrowRight2 size={16} color="currentColor" className="text-ink-tertiary" />}
    </Tag>
  );
}

function UpgradeNudge() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-premium-line bg-premium-bg px-4 py-3">
      <Crown1 size={22} color="currentColor" className="text-premium-fg" />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-bold text-premium-fg">Want to connect faster?</p>
        <p className="text-body-xs text-ink-secondary">Upgrade to Gold anytime for unlimited interests and contact details.</p>
      </div>
      <Link href="/plans" className="text-body-sm font-bold text-brand hover:underline">
        See plans
      </Link>
    </div>
  );
}

/* ── 06a · submitted ───────────────────────────────────── */

function Submitted({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Celebration />
      <CardTitle title="Profile submitted!" subtitle="Our team reviews every profile to keep Vikasitha safe. This usually takes less than 24 hours." />
      <div className="space-y-2">
        <StatusRow Icon={TickCircle} iconTone="success" title="Submitted" sub="Today, 4:12 PM" badge="Done" tone="success" />
        <StatusRow Icon={Clock} title="Under review" sub="Usually within 24 hours" badge="Pending" tone="warning" />
        <StatusRow Icon={ShieldTick} title="Profile live" sub="We’ll send an SMS" />
      </div>
      <Button fullWidth onClick={onBrowse} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
        Browse profiles while you wait
      </Button>
      <UpgradeNudge />
    </div>
  );
}

/* ── 06b · changes needed ──────────────────────────────── */

function ChangesNeeded({ onFix }: { onFix: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Celebration />
      <CardTitle title="Your profile needs a few changes" subtitle="Please fix the items below and resubmit. Nothing is shown to other members until it’s approved." />
      <Alert type="error" title="3 fields need changes">
        Reviewed on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} by our safety team. Everything else is approved.
      </Alert>
      <div className="space-y-2">
        {FLAGGED.map((f) => (
          <StatusRow key={f.key} Icon={f.Icon} iconTone="error" title={f.label} sub={f.reason} badge="Rejected" tone="error" onClick={onFix} />
        ))}
        <StatusRow Icon={TickCircle} iconTone="success" title="Basic, family & education" sub="All other details look good" badge="Approved" tone="success" />
      </div>
      <Button fullWidth onClick={onFix} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
        Edit &amp; resubmit
      </Button>
    </div>
  );
}

/* ── 06d / 06e · fix only the flagged fields ───────────── */

function FixFields({ draft, onCancel, onResubmit }: { draft: RegistrationDraft; onCancel: () => void; onResubmit: (p: Partial<RegistrationDraft>) => void }) {
  const toast = useToast();
  const [dob, setDob] = useState(draft.dob || "1997-05-12");
  const [about, setAbout] = useState(
    draft.about && containsContactDetails(draft.about) ? draft.about : `${draft.about || "I’m a doctor working in Kandy, close to my family."} Call me on 077 123 4567.`
  );
  const [photo, setPhoto] = useState<string | null>(draft.photo);
  const [photoReplaced, setPhotoReplaced] = useState(false);
  const [dobChanged, setDobChanged] = useState(false);
  const [tried, setTried] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const aboutBad = containsContactDetails(about);
  const age = ageFrom(dob);
  const dobBad = !dobChanged || age === null || age < 18;
  const remaining = [!photoReplaced, aboutBad, dobBad].filter(Boolean).length;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > 5 * 1024 * 1024) {
      toast.error("Upload failed", "Photos must be JPG or PNG, under 5 MB.");
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      setPhoto(String(r.result));
      setPhotoReplaced(true);
      toast.success("Photo uploaded", "Your new main photo will be checked again.");
    };
    r.readAsDataURL(f);
  };

  const submit = () => {
    setTried(true);
    if (remaining > 0) {
      toast.error("Still needs changes", `${remaining} flagged field${remaining > 1 ? "s are" : " is"} not fixed yet.`);
      return;
    }
    onResubmit({ dob, about, photo });
  };

  return (
    <div className="flex flex-col gap-5">
      <CardTitle title="Fix the highlighted fields" subtitle="Our safety team flagged 3 fields. Only these need changing — the rest is already approved." />
      <Alert type={remaining ? "error" : "success"} title={remaining ? `${remaining} field${remaining > 1 ? "s" : ""} need changes` : "All flagged fields fixed"}>
        {remaining ? "Update them and tap Resubmit for review." : "Great — send your changes for review."}
      </Alert>

      {/* Main photo (06e) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-body-sm font-semibold">Main photo</p>
          {photoReplaced ? <Badge tone="success">Updated</Badge> : <Badge tone="error">Rejected</Badge>}
        </div>
        <div className="flex items-center gap-4">
          <div className={cn("relative h-28 w-24 shrink-0 overflow-hidden rounded-md border-[3px] bg-surface-muted", photoReplaced ? "border-success-fg" : "border-error-line")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo || "/brand/bride.png"} alt="Main photo" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-2">
            <p className={cn("text-body-xs", photoReplaced ? "text-success-fg" : "text-error-fg")}>
              {photoReplaced ? "New photo added — it will be checked again." : "Rejected: face not clearly visible — upload a clear, recent photo of just you."}
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" leftIcon={<Edit2 size={16} color="currentColor" />} onClick={() => fileRef.current?.click()}>
                Replace photo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setPhoto("/brand/bride.png"); setPhotoReplaced(true); toast.success("Photo uploaded", "Your new main photo will be checked again."); }}>
                Use sample
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Date of birth (06d) */}
      <div className="relative">
        <span className="absolute right-0 top-0">{dobBad ? <Badge tone="error">Rejected</Badge> : <Badge tone="success">Updated</Badge>}</span>
        <Input
          label="Date of birth"
          type="date"
          icon={<Calendar size={20} color="currentColor" />}
          value={dob}
          onChange={(e) => {
            setDob(e.target.value);
            setDobChanged(true);
          }}
          error={dobBad ? (dobChanged && age !== null && age < 18 ? "You must be at least 18 years old" : "Rejected: doesn’t match your ID — check and update") : undefined}
          helper={!dobBad ? "Looks good" : undefined}
        />
      </div>

      {/* About you (06d) */}
      <div className="relative">
        <span className="absolute right-0 top-0">{aboutBad ? <Badge tone="error">Rejected</Badge> : <Badge tone="success">Updated</Badge>}</span>
        <Textarea
          label="About you"
          value={about}
          onChange={setAbout}
          error={aboutBad ? "Rejected: contains a phone number — please remove it" : undefined}
          helper={!aboutBad ? "Looks good" : undefined}
        />
      </div>

      {tried && remaining > 0 && <p className="text-center text-body-sm font-semibold text-error-fg">Fix the fields marked Rejected to resubmit.</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} leftIcon={<ArrowLeft size={18} color="currentColor" />} className="shrink-0">
          Back
        </Button>
        <Button fullWidth onClick={submit} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
          Resubmit for review
        </Button>
      </div>
    </div>
  );
}

/* ── 06f · resubmitted ─────────────────────────────────── */

function Resubmitted({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Celebration />
      <CardTitle title="Changes sent for review" subtitle="Thanks! We’ll only re-check the fields you updated — usually within 24 hours." />
      <div className="space-y-2">
        <StatusRow Icon={SearchNormal1} iconTone="error" title="Changes requested" sub="Main photo, About you, Date of birth" badge="3 fields" tone="error" />
        <StatusRow Icon={TickCircle} iconTone="success" title="Resubmitted" sub="Just now" badge="Done" tone="success" />
        <StatusRow Icon={Clock} title="Under review" sub="Usually within 24 hours" badge="Pending" tone="warning" />
      </div>
      <Button fullWidth onClick={onBrowse} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
        Browse profiles while you wait
      </Button>
      <UpgradeNudge />
    </div>
  );
}

/* ── 06 / 06c · live ───────────────────────────────────── */

function Live({ name, onMatches }: { name: string; onMatches: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Celebration />
      <CardTitle title="Your profile is live!" subtitle={`Welcome to Vikasitha, ${name}. Families can now find you — and you can start browsing verified proposals.`} />
      <div className="space-y-2">
        <StatusRow Icon={SearchNormal1} title="Browse your matches" sub="Based on your preferences" onClick={onMatches} />
        <StatusRow Icon={Star1} title="Add your horoscope" sub="Families often ask for it" onClick={() => {}} />
        <StatusRow Icon={ShieldTick} title="Get ID-verified" sub="Earn the Verified badge" onClick={() => {}} />
      </div>
      <Button fullWidth onClick={onMatches} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
        See my matches
      </Button>
      <UpgradeNudge />
    </div>
  );
}
