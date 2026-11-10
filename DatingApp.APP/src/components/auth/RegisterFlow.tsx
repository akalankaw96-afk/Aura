"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight2,
  Calendar,
  EmojiHappy,
  Gallery,
  InfoCircle,
  MessageText1,
  TickCircle,
} from "iconsax-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardTitle,
  Checkbox,
  Chip,
  Input,
  OtpInput,
  PasswordField,
  PhoneField,
  OrDivider,
  Select,
  Stepper,
  Textarea,
  flashToast,
  isPasswordAcceptable,
  isValidSriLankanMobile,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { ageFrom, containsContactDetails, emptyDraft, loadDraft, saveDraft, type RegistrationDraft } from "@/lib/demo";
import { AuthShell } from "./AuthShell";
import { DemoTips } from "./DemoTips";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { DEMO, formatPhone } from "./shared";
import { setKyc } from "@/lib/verification";
import { AVATARS, avatarDataUri, isIllustration, type AvatarGender } from "@/content/avatars";
import type { CountryCode } from "@/components/ui/Flag";
import { apiService } from "@/services/api";
import { PhotoSlot } from "@/components/ui/PhotoSlot";

/**
 * Registration journeys 3–6 (Figma 02 Account, 03 Verify, 04 Profile,
 * 05 Photos, with every error / success / toast state from the flow).
 * No API: values are kept in sessionStorage (src/lib/demo.ts).
 */
export type RegisterStep = 1 | 2 | 3 | 4;

export interface RegisterFlowProps {
  initialStep?: RegisterStep;
  /** Inside the home-page modal: no page chrome, call onComplete at the end */
  embedded?: boolean;
  onComplete?: (draft: RegistrationDraft) => void;
}

export function RegisterFlow({ initialStep = 1, embedded, onComplete }: RegisterFlowProps) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<RegisterStep>(initialStep);
  // start empty so server and browser render the same HTML, then load the saved draft
  const [draft, setDraft] = useState<RegistrationDraft>(emptyDraft);
  useEffect(() => setDraft(loadDraft()), []);
  const update = (patch: Partial<RegistrationDraft>) => setDraft(saveDraft(patch));

  const go = (s: RegisterStep) => {
    setStep(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = async () => {
    const d = saveDraft({ reviewStatus: "submitted" });
    if (embedded && onComplete) {
      toast.success("Profile submitted", "We’ll review it within 24 hours.");
      onComplete(d);
      return;
    }
    flashToast("success", "Profile submitted", "You can explore your dashboard while we review it.");

    // Sync candidate profile with backend API
    try {
      const fullName = d.fullName || `${d.firstName || ""} ${d.lastName || ""}`.trim() || "New Member";
      const calculatedAge = d.dob ? ageFrom(d.dob) : 28;

      await apiService.createOrUpdateProfile({
        fullName,
        gender: (d.gender === "female" ? "female" : "male") as "female" | "male",
        age: calculatedAge ?? 28,
        height: d.height || "5' 8\"",
        profession: "Professional",
        professionCategory: "Other",
        education: "Bachelor's Degree",
        university: "",
        location: d.country === "Sri Lanka" ? "Colombo" : "Living abroad",
        country: d.country || "Sri Lanka",
        religion: d.religion || "Buddhist",
        community: d.ethnicity || "Sinhalese",
        bio: d.about || "",
        aboutFamily: "",
        horoscopeAvailable: false,
        photoUrl: d.photo || "",
        interests: [],
      });
    } catch (err) {
      console.warn("Backend profile sync notice:", err);
    }

    // signed in with a pending profile → Dashboard (features unlock after review)
    try {
      const raw = localStorage.getItem("aura_session");
      const sess = raw ? JSON.parse(raw) : {};
      sess.fullName = d.fullName || d.firstName || sess.fullName || "New member";
      sess.email = d.email || sess.email;
      sess.phoneNumber = d.mobile || sess.phoneNumber;
      sess.photoUrl = d.photo || sess.photoUrl;
      sess.hasCompletedProfile = true;
      sess.isUnderReview = true;
      sess.isVerified = false;
      localStorage.setItem("aura_session", JSON.stringify(sess));
      window.dispatchEvent(new Event("aura_auth_change"));
    } catch {}
    setKyc("pending");
    router.push("/dashboard");
  };

  return (
    <AuthShell
      embedded={embedded}
      action="login"
    >
      <Stepper step={step} className="max-w-[680px]" />
      <Card className="w-full max-w-[680px] p-5 sm:p-8">
        {step === 1 && <AccountStep draft={draft} update={update} onNext={() => go(2)} onGoogleSuccess={() => go(3)} />}
        {step === 2 && <VerifyStep mobile={draft.mobile || DEMO.registeredMobile} onBack={() => go(1)} onNext={() => go(3)} />}
        {step === 3 && <ProfileStep draft={draft} update={update} onBack={() => go(2)} onNext={() => go(4)} />}
        {step === 4 && <PhotosStep draft={draft} update={update} onBack={() => go(3)} onFinish={finish} />}
      </Card>
      {step === 2 && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-info-bg px-3 py-1 text-body-xs font-semibold text-info-fg">
          <InfoCircle size={14} color="currentColor" /> Tip: the code expires in 10 minutes
        </p>
      )}
    </AuthShell>
  );
}

/* ───────────────────────── Step 1 · Account (02, 02a–02e) ───────────────────────── */


function AccountStep({
  draft,
  update,
  onNext,
  onGoogleSuccess,
}: {
  draft: RegistrationDraft;
  update: (p: Partial<RegistrationDraft>) => void;
  onNext: () => void;
  onGoogleSuccess?: () => void;
}) {
  const toast = useToast();
  const [mobile, setMobile] = useState(draft.mobile);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<{ mobile?: string; pw?: string; pw2?: string; terms?: string }>({});
  const [taken, setTaken] = useState(false);
  const [loading, setLoading] = useState(false);

  const clear = (k: keyof typeof errors) => setErrors((e) => ({ ...e, [k]: undefined }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTaken(false);
    const er: typeof errors = {};
    if (!mobile) er.mobile = "Enter your mobile number";
    else if (!isValidSriLankanMobile(mobile)) er.mobile = "Enter a valid Sri Lankan mobile number";
    if (!pw) er.pw = "Create a password";
    else if (pw.length < 6) er.pw = "Password must be at least 6 characters";
    else if (!isPasswordAcceptable(pw)) er.pw = "Too weak — add at least one number";
    if (!pw2) er.pw2 = "Confirm your password";
    else if (pw && pw !== pw2) er.pw2 = "Passwords don’t match";
    if (!terms) er.terms = "Please accept the Terms of Service and Privacy Policy to continue";
    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      if (mobile === DEMO.registeredMobile || mobile === DEMO.suspendedMobile) {
        setTaken(true);
        return;
      }
      if (mobile === DEMO.serverErrorMobile) {
        toast.error("Couldn’t create your account", "No internet connection or our server is busy. Please try again.");
        return;
      }
      update({ mobile });
      toast.success("Code sent", `We sent a 6-digit code to ${formatPhone(mobile)}.`);
      onNext();
    }, 700);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <CardTitle title="Create your free account" subtitle="No payment needed — browse and connect for free, upgrade anytime." />

      <GoogleSignInButton
        isSignUp
        onSuccess={(session) => {
          const parts = session.fullName.trim().split(" ");
          const firstName = parts[0] || session.fullName;
          const lastName = parts.slice(1).join(" ") || "";
          update({
            email: session.email,
            firstName,
            lastName,
          });
          if (onGoogleSuccess) {
            onGoogleSuccess();
          } else {
            onNext();
          }
        }}
      />

      <OrDivider />

      {taken && (
        <Alert type="error" title="This number is already registered" action={<Link href="/login" className="font-bold text-brand hover:underline">Log in instead →</Link>}>
          {formatPhone(mobile)} already has a Vikasitha account.
        </Alert>
      )}

      <PhoneField
        value={mobile}
        onChange={(v) => {
          setMobile(v);
          clear("mobile");
          setTaken(false);
        }}
        helper="We’ll send a 6-digit code to verify this number"
        error={errors.mobile}
      />
      <PasswordField value={pw} onChange={(v) => { setPw(v); clear("pw"); }} showStrength helper="At least 6 characters, with a number" error={errors.pw} autoComplete="new-password" />
      <PasswordField
        label="Confirm password"
        value={pw2}
        onChange={(v) => {
          setPw2(v);
          clear("pw2");
        }}
        error={errors.pw2 ?? (pw2 && pw2.length >= pw.length && pw !== pw2 ? "Passwords don’t match" : undefined)}
        autoComplete="new-password"
      />

      <div className="flex flex-col gap-1.5">
        <Checkbox checked={terms} onChange={(v) => { setTerms(v); clear("terms"); }} error={!!errors.terms}>
          I agree to the{" "}
          <Link href="/terms" className="font-semibold text-brand underline">Terms of Service</Link> and{" "}
          <Link href="/privacy" className="font-semibold text-brand underline">Privacy Policy</Link>
        </Checkbox>
        {errors.terms && <p role="alert" className="pl-7 text-body-xs text-error-fg">{errors.terms}</p>}
      </div>

      <Button type="submit" fullWidth loading={loading} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
        Continue
      </Button>
      <p className="text-body-md text-ink-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand underline">Log in</Link>
      </p>

      <DemoTips
        tips={[
          { label: "Already registered", value: formatPhone(DEMO.registeredMobile) },
          { label: "Server error", value: formatPhone(DEMO.serverErrorMobile) },
          { label: "Any other 7X number → works" },
          { label: "Password needs 6+ chars & a number" },
        ]}
        actions={[
          {
            label: "Fill valid form",
            onClick: () => {
              setMobile("771112222");
              setPw("Vikasitha1");
              setPw2("Vikasitha1");
              setTerms(true);
              setErrors({});
              setTaken(false);
            },
          },
        ]}
      />
    </form>
  );
}

/* ───────────────────────── Step 2 · Verify (03, 03a–03f) ───────────────────────── */

function VerifyStep({ mobile, onBack, onNext }: { mobile: string; onBack: () => void; onNext: () => void }) {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [state, setState] = useState<"default" | "error" | "success">("default");
  const [attempts, setAttempts] = useState(0);
  const [expired, setExpired] = useState(false);
  const [blockedFor, setBlockedFor] = useState(0);
  const [resendIn, setResendIn] = useState(45);
  const [error, setError] = useState<string>();
  const checked = useRef("");

  useEffect(() => {
    if (resendIn <= 0 && blockedFor <= 0) return;
    const t = window.setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
      setBlockedFor((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendIn, blockedFor]);

  useEffect(() => {
    if (blockedFor === 0 && attempts >= DEMO.maxOtpAttempts) {
      setAttempts(0);
      setError(undefined);
    }
  }, [blockedFor, attempts]);

  const verify = (value = code) => {
    if (value.length < 6) {
      setError("Enter all 6 digits");
      setState("error");
      return;
    }
    checked.current = value;
    if (value === DEMO.expiredOtp) {
      setExpired(true);
      setCode("");
      setState("default");
      setError(undefined);
      return;
    }
    if (value === DEMO.otp || value === "123456") {
      setState("success");
      setError(undefined);
      toast.success("Mobile verified", `Your number ${formatPhone(mobile)} is confirmed.`);
      window.setTimeout(onNext, 900);
      return;
    }
    const n = attempts + 1;
    setAttempts(n);
    setState("error");
    if (n >= DEMO.maxOtpAttempts) {
      setBlockedFor(30);
      setError(undefined);
    } else {
      const left = DEMO.maxOtpAttempts - n;
      setError(`Incorrect code · ${left} attempt${left === 1 ? "" : "s"} left`);
    }
  };

  // auto-check once all 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && checked.current !== code) verify(code);
    if (code.length < 6 && state !== "success") {
      setState("default");
      checked.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const resend = () => {
    setResendIn(45);
    setExpired(false);
    setCode("");
    setError(undefined);
    setState("default");
    toast.info("New code sent", `Check your SMS on ${formatPhone(mobile)}.`);
  };

  const blocked = blockedFor > 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-glow">
        <MessageText1 size={30} color="currentColor" />
      </span>
      <CardTitle
        title="Verify your mobile"
        subtitle={
          <>
            Enter the 6-digit code we sent to <b className="text-ink">{formatPhone(mobile)}</b>
          </>
        }
      />
      <button type="button" onClick={onBack} className="-mt-2 text-body-sm font-semibold text-brand underline">
        Change number
      </button>

      <div className="bg-rose-50 border border-rose-200 text-brand px-3.5 py-1.5 rounded-full text-center text-body-xs font-semibold">
        Demo OTP: <strong className="font-mono text-ink">482913</strong> or <strong className="font-mono text-ink">123456</strong>
      </div>

      {expired && (
        <Alert type="warning" title="Code expired" action={<button type="button" onClick={resend} className="font-bold text-brand hover:underline">Resend code</button>}>
          Codes are valid for 10 minutes. Request a new one to continue.
        </Alert>
      )}
      {blocked && (
        <Alert type="error" title="Too many attempts">
          For your security, try again in <b>00:{String(blockedFor).padStart(2, "0")}</b> or request a new code.
        </Alert>
      )}

      <div className="flex flex-col items-center gap-2">
        <OtpInput value={code} onChange={setCode} state={state} disabled={blocked || state === "success"} autoFocus />
        {error && <p role="alert" className="text-body-sm font-semibold text-error-fg">{error}</p>}
        {state === "success" && (
          <p className="flex items-center gap-1 text-body-sm font-semibold text-success-fg">
            <TickCircle size={16} color="currentColor" /> Verified
          </p>
        )}
      </div>

      <p className="text-body-sm text-ink-secondary">
        Didn’t get it?{" "}
        {resendIn > 0 ? (
          <span>Resend in 00:{String(resendIn).padStart(2, "0")}</span>
        ) : (
          <button type="button" onClick={resend} className="font-bold text-brand hover:underline">
            Resend now
          </button>
        )}
      </p>

      <div className="flex w-full flex-col gap-3">
        <Button fullWidth onClick={() => verify()} disabled={blocked || expired || code.length < 6 || state === "success"} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
          Verify &amp; continue
        </Button>
        <Button variant="outline" fullWidth onClick={onBack} leftIcon={<ArrowLeft size={18} color="currentColor" />}>
          Back
        </Button>
      </div>

      <DemoTips
        tips={[
          { label: "Correct code", value: DEMO.otp },
          { label: "Expired code", value: DEMO.expiredOtp },
          { label: "3 wrong codes → blocked 30 s" },
        ]}
        actions={[
          { label: "Fill correct code", onClick: () => setCode(DEMO.otp) },
          { label: "Skip resend timer", onClick: () => setResendIn(0) },
        ]}
      />
    </div>
  );
}

/* ───────────────────────── Step 3 · Profile (04, 04a–04c) ───────────────────────── */

const OPTIONS = {
  displayNameFormat: ["First name only", "Last name only", "Full name", "First name and first letter of last name", "First letter of first name and full last name"],
  createdBy: ["Self", "Parent", "Sibling", "Relative", "Friend"],
  height: ["4' 10\"", "4' 11\"", "5' 0\"", "5' 1\"", "5' 2\"", "5' 3\"", "5' 4\"", "5' 5\"", "5' 6\"", "5' 7\"", "5' 8\"", "5' 9\"", "5' 10\"", "5' 11\"", "6' 0\"", "6' 1\"", "6' 2\""],
  gender: ["Male", "Female"],
  civilStatus: ["Never married", "Divorced", "Widowed", "Separated"],
  religion: ["Buddhist", "Hindu", "Christian", "Catholic", "Islam", "Other"],
  ethnicity: ["Sinhalese", "Tamil", "Muslim", "Burgher", "Malay", "Other"],
  country: ["Sri Lanka", "Australia", "United Kingdom", "Canada", "USA", "Qatar", "UAE", "Italy", "New Zealand", "Other"],
};

type ProfileKey = "firstName" | "lastName" | "displayNameFormat" | "createdBy" | "email" | "whatsapp" | "height" | "dob" | "gender" | "civilStatus" | "religion" | "ethnicity" | "caste" | "country";
const REQUIRED: ProfileKey[] = ["firstName", "lastName", "displayNameFormat", "createdBy", "height", "dob", "gender", "civilStatus", "religion", "ethnicity", "country"];

/** Review mode (Figma 06d · Edit profile — fix rejected fields): flagged fields + their values when rejected */
export interface ProfileReview {
  reasons: Partial<Record<"dob" | "about", string>>;
  original: { dob: string; about: string };
  reviewedOn: string;
}

export function ProfileStep({
  draft,
  update,
  onBack,
  onNext,
  review,
}: {
  draft: RegistrationDraft;
  update: (p: Partial<RegistrationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  review?: ProfileReview;
}) {
  const toast = useToast();
  // a rejected field stays "Rejected" until its value changes (and passes the safety check)
  const stillRejected = {
    dob: !!review?.reasons.dob && draft.dob === review.original.dob,
    about: !!review?.reasons.about && (draft.about === review.original.about || containsContactDetails(draft.about)),
  };
  const flaggedCount = review ? Object.keys(review.reasons).length : 0;
  const [errors, setErrors] = useState<Partial<Record<ProfileKey | "about", string>>>({});
  const [showMissing, setShowMissing] = useState(false);
  const age = ageFrom(draft.dob);
  const underage = age !== null && age < 18;
  const aboutError = containsContactDetails(draft.about) ? "Please remove phone numbers or emails — members connect safely through Vikasitha" : undefined;

  const setValue = (k: ProfileKey, v: string) => {
    const patch: Partial<RegistrationDraft> = { [k]: v };
    if (k === "firstName" || k === "lastName") patch.fullName = `${k === "firstName" ? v : draft.firstName} ${k === "lastName" ? v : draft.lastName}`.trim();
    update(patch);
    setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const set = (k: ProfileKey) => (e: React.ChangeEvent<HTMLInputElement>) => setValue(k, e.target.value);
  const pick = (k: ProfileKey) => (v: string) => setValue(k, v);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    REQUIRED.forEach((k) => {
      if (!String(draft[k] ?? "").trim()) er[k] = "Required";
    });
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) er.email = "Enter a valid email address";
    // WhatsApp (optional): validate only when a different number was entered
    if (!draft.whatsappSameAsMobile && draft.whatsapp) {
      const ok = draft.whatsappCountry === "lk" ? isValidSriLankanMobile(draft.whatsapp) : /^\d{7,14}$/.test(draft.whatsapp);
      if (!ok) er.whatsapp = draft.whatsappCountry === "lk" ? "Enter a valid Sri Lankan mobile number" : "Enter a valid WhatsApp number";
    }
    if (underage) er.dob = "You must be at least 18 years old";
    if (aboutError) er.about = aboutError;
    if (review) {
      if (stillRejected.dob) er.dob = `Rejected: ${review.reasons.dob}`;
      if (stillRejected.about) er.about = `Rejected: ${review.reasons.about}`;
    }
    setErrors(er);
    setShowMissing(Object.values(er).includes("Required"));
    if (Object.keys(er).length) {
      if (!underage) document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {review ? (
        <>
          <CardTitle
            title="Fix the highlighted fields"
            subtitle={`Our safety team flagged ${flaggedCount} field${flaggedCount === 1 ? "" : "s"}. Only these need changing — the rest is already approved.`}
          />
          {stillRejected.dob || stillRejected.about ? (
            <Alert type="error" title={`${[stillRejected.dob, stillRejected.about].filter(Boolean).length} field${[stillRejected.dob, stillRejected.about].filter(Boolean).length === 1 ? "" : "s"} need changes`}>
              Reviewed on {review.reviewedOn} · Update them and tap Resubmit.
            </Alert>
          ) : (
            <Alert type="success" title="All highlighted fields updated">
              Looks good — tap Resubmit for review.
            </Alert>
          )}
        </>
      ) : (
        <CardTitle title="Tell us about yourself" subtitle="These details help families find the right match. You can edit them anytime." />
      )}

      {underage && (
        <Alert type="error" title="Registration not allowed">
          Vikasitha is only for adults aged 18 and over.
        </Alert>
      )}
      {showMissing && !underage && (
        <Alert type="error" title="A few details are missing">
          Please fill in the highlighted fields to continue.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" placeholder="e.g. Sanjeewa" value={draft.firstName} onChange={set("firstName")} error={errors.firstName} autoComplete="given-name" />
        <Input label="Last name" placeholder="e.g. Silva" value={draft.lastName} onChange={set("lastName")} error={errors.lastName} autoComplete="family-name" />
        <Select label="Display name format" options={OPTIONS.displayNameFormat} value={draft.displayNameFormat} onChange={pick("displayNameFormat")} error={errors.displayNameFormat} />
        <Select label="Account created by" options={OPTIONS.createdBy} value={draft.createdBy} onChange={pick("createdBy")} error={errors.createdBy} />
        <Input label="Email" type="email" placeholder="you@example.com" value={draft.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        {/* WhatsApp number — next to Email (same row), optional */}
        <div className="flex flex-col gap-2">
          <PhoneField
            label="WhatsApp number (optional)"
            value={draft.whatsappSameAsMobile ? draft.mobile : draft.whatsapp}
            onChange={(v) => {
              update({ whatsapp: v, whatsappSameAsMobile: false });
              setErrors((er) => ({ ...er, whatsapp: undefined }));
            }}
            country={(draft.whatsappSameAsMobile ? "lk" : draft.whatsappCountry) as CountryCode}
            onCountryChange={(c) => update({ whatsappCountry: c.iso, whatsappSameAsMobile: false })}
            disabled={draft.whatsappSameAsMobile && !!draft.mobile}
            compact
            helper="Shared only with members you accept."
            error={errors.whatsapp}
          />
          {draft.mobile && (
            <Checkbox
              checked={draft.whatsappSameAsMobile}
              onChange={(v) => {
                update({ whatsappSameAsMobile: v, whatsapp: v ? "" : draft.whatsapp, whatsappCountry: v ? "lk" : draft.whatsappCountry });
                setErrors((er) => ({ ...er, whatsapp: undefined }));
              }}
            >
              <span className="text-body-sm text-ink-secondary">Same as my mobile ({formatPhone(draft.mobile)})</span>
            </Checkbox>
          )}
        </div>
        <Select label="Height" options={OPTIONS.height} value={draft.height} onChange={pick("height")} error={errors.height} />
        <Input
          label="Birthdate"
          type="date"
          icon={<Calendar size={20} color="currentColor" />}
          value={draft.dob}
          onChange={set("dob")}
          max={new Date().toISOString().slice(0, 10)}
          error={errors.dob ?? (underage ? "You must be at least 18 years old" : stillRejected.dob ? `Rejected: ${review?.reasons.dob}` : undefined)}
          helper={age !== null && !underage ? `${age} years` : undefined}
        />
        <Select label="Gender" options={OPTIONS.gender} value={draft.gender} onChange={pick("gender")} error={errors.gender} />
        <Select label="Civil status" options={OPTIONS.civilStatus} value={draft.civilStatus} onChange={pick("civilStatus")} error={errors.civilStatus} />
        <Select label="Religion" options={OPTIONS.religion} value={draft.religion} onChange={pick("religion")} error={errors.religion} />
        <Select label="Ethnicity" options={OPTIONS.ethnicity} value={draft.ethnicity} onChange={pick("ethnicity")} error={errors.ethnicity} />
        <Input label="Caste" placeholder="e.g. Govigama" value={draft.caste} onChange={set("caste")} />
        <Select label="Country of residence" options={OPTIONS.country} value={draft.country} onChange={pick("country")} error={errors.country} />
      </div>

      <Textarea
        label="About you"
        hint="Optional"
        rows={4}
        placeholder="A few warm lines about you, your family and what you’re looking for…"
        value={draft.about}
        onChange={(v) => update({ about: v })}
        helper="Tip: profiles with a short, warm description get more replies. Don’t add phone numbers here."
        error={errors.about ?? (stillRejected.about ? `Rejected: ${review?.reasons.about}` : aboutError)}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeft size={18} color="currentColor" />} className="shrink-0">
          Back
        </Button>
        <Button type="submit" fullWidth disabled={underage} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
          {review ? "Resubmit for review" : "Continue"}
        </Button>
      </div>
      {!review && (
        <button type="button" onClick={() => toast.success("Progress saved", "You can come back and finish anytime.")} className="text-center text-body-sm font-semibold text-brand hover:underline">
          Save &amp; finish later
        </button>
      )}

      {!review && (
      <DemoTips
        tips={[{ label: "Birthday under 18 → blocked" }, { label: "Phone number in About you → error" }, { label: "Continue with empty fields → missing" }]}
        actions={[
          {
            label: "Fill sample profile",
            onClick: () => {
              update({
                firstName: "Sanjeewa",
                lastName: "Silva",
                fullName: "Sanjeewa Silva",
                displayNameFormat: "First name and first letter of last name",
                createdBy: "Self",
                email: "sanjeewa@example.com",
                height: "5' 8\"",
                dob: "1994-05-12",
                gender: "Male",
                civilStatus: "Never married",
                religion: "Buddhist",
                ethnicity: "Sinhalese",
                caste: "",
                country: "Sri Lanka",
                about: "I’m an engineer working in Colombo, close to my family. I love travelling and cricket. Looking for a kind, educated partner who values family.",
              });
              setErrors({});
              setShowMissing(false);
            },
          },
        ]}
      />
      )}
    </form>
  );
}

/* ───────────────────────── Step 4 · Photos (05, 05a–05c) ───────────────────────── */

const MAX_MB = 5;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Review mode (Figma 06e · Edit photos — main photo rejected) */
export interface PhotoReview {
  reason: string;
  original: string | null;
  reviewedOn: string;
}

export function PhotosStep({
  draft,
  update,
  onBack,
  onFinish,
  review,
}: {
  draft: RegistrationDraft;
  update: (p: Partial<RegistrationDraft>) => void;
  onBack: () => void;
  onFinish: () => void;
  review?: PhotoReview;
}) {
  const toast = useToast();
  const photoRejected = !!review && (draft.photo === review.original || !draft.photo);
  const fileRef = useRef<HTMLInputElement>(null);
  const [extra, setExtra] = useState<(string | null)[]>([null, null, null, null]);
  const [target, setTarget] = useState<number>(-1); // -1 main, 0..3 extra
  const [failed, setFailed] = useState<string>();
  const [blur, setBlur] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  // "upload" real photos, or "illustration" — a friendly avatar for members not ready to share photos
  const [mode, setMode] = useState<"upload" | "illustration">(isIllustration(draft.photo) ? "illustration" : "upload");
  useEffect(() => {
    if (isIllustration(draft.photo)) setMode("illustration");
  }, [draft.photo]);

  const pick = (slot: number) => {
    setTarget(slot);
    fileRef.current?.click();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!OK_TYPES.includes(f.type)) return uploadFailed("Photos must be JPG, PNG or WEBP.");
    if (f.size > MAX_MB * 1024 * 1024) return uploadFailed(`This photo is ${(f.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_MB} MB.`);
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setFailed(undefined);
      setConfirmSkip(false);
      if (target === -1) {
        try {
          update({ photo: url });
        } catch {
          update({ photo: null });
        }
      } else {
        setExtra((x) => x.map((v, i) => (i === target ? url : v)));
      }
      toast.success("Photo uploaded", target === -1 ? "Looking great! It’ll be checked by our team." : "Added to your gallery.");
    };
    reader.readAsDataURL(f);
  };

  const uploadFailed = (msg: string) => {
    setFailed(msg);
    toast.error("Upload failed", msg);
  };

  const finish = () => {
    if (review) {
      if (photoRejected) {
        toast.error("Replace your main photo", review.reason);
        return;
      }
      onFinish();
      return;
    }
    if (mode === "illustration" && !isIllustration(draft.photo)) {
      toast.error("Pick an illustration", "Choose one of the illustrations, or switch to Upload photos.");
      return;
    }
    if (!draft.photo && !confirmSkip) {
      setConfirmSkip(true);
      return;
    }
    onFinish();
  };

  return (
    <div className="flex flex-col gap-5">
      {review ? (
        <>
          <CardTitle title="Replace your main photo" subtitle="Your main photo wasn’t approved. Your other details are fine — just upload a new one." />
          {photoRejected ? (
            <Alert type="error" title="Main photo rejected">
              {review.reason}. Reviewed on {review.reviewedOn}.
            </Alert>
          ) : (
            <Alert type="success" title="New main photo added">
              Looks good — tap Resubmit for review.
            </Alert>
          )}
        </>
      ) : (
        <CardTitle title="Add your best photos" subtitle="Profiles with clear photos receive more interest — every photo is checked by our team." />
      )}

      {/* Upload real photos ↔ use an illustration */}
      <PhotoModeSwitch value={mode} onChange={(m) => { setMode(m); setConfirmSkip(false); }} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      {failed && (
        <Alert type="error" title="Upload failed" action={<button type="button" onClick={() => pick(target)} className="font-bold text-brand hover:underline">Try again</button>}>
          {failed}
        </Alert>
      )}
      {confirmSkip && !draft.photo && (
        <Alert type="warning" title="Continue without a photo?" action={<span className="flex gap-4"><button type="button" onClick={() => pick(-1)} className="font-bold text-brand hover:underline">Add a photo</button><button type="button" onClick={onFinish} className="font-bold text-ink-secondary hover:underline">Skip anyway</button></span>}>
          Profiles without a photo get far fewer replies. You can add one later from your profile.
        </Alert>
      )}

      {mode === "illustration" ? (
        <IllustrationPicker
          gender={draft.gender === "Male" ? "male" : draft.gender === "Female" ? "female" : undefined}
          value={isIllustration(draft.photo) ? draft.photo : null}
          onPick={(uri, name) => {
            update({ photo: uri });
            setConfirmSkip(false);
            toast.success("Illustration selected", `“${name}” will show on your profile until you add photos.`);
          }}
        />
      ) : (
      <>
      {/* Figma: Photo slots — row 260 high, gap 12: Main photo 200 × 260 + More photos 2 × 2 of 146 × 124 */}
      <div key="upload" className="flex animate-fade-up flex-col gap-3 sm:h-[260px] sm:flex-row">
        <PhotoSlot
          main
          rejected={photoRejected && !!draft.photo}
          src={draft.photo}
          onPick={() => pick(-1)}
          onRemove={() => update({ photo: null })}
          className="aspect-[200/260] w-full sm:aspect-auto sm:h-full sm:w-[200px] sm:shrink-0"
        />
        <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:w-[304px] sm:shrink-0">
          {extra.map((src, i) => (
            <PhotoSlot
              key={i}
              src={src}
              label={i === 0 ? "Add photo" : "Optional"}
              onPick={() => pick(i)}
              onRemove={() => setExtra((x) => x.map((v, j) => (j === i ? null : v)))}
              className="h-[124px] w-full"
            />
          ))}
        </div>
      </div>

      <ul className="space-y-2 rounded-md bg-surface-subtle p-4 text-body-sm text-ink-secondary">
        {["Clear face, good light — no sunglasses", "Recent photo (within 12 months)", "No group photos as your main photo"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <TickCircle size={18} color="currentColor" className="text-success-fg" /> {t}
          </li>
        ))}
      </ul>
      <Checkbox checked={blur} onChange={setBlur}>Blur my photos until I accept an interest</Checkbox>
      </>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeft size={18} color="currentColor" />} className="shrink-0">
          Back
        </Button>
        <Button fullWidth onClick={finish} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
          {review ? "Resubmit for review" : <>Finish &amp; go live</>}
        </Button>
      </div>
      {mode === "upload" && !review && (
        <button type="button" onClick={() => setConfirmSkip(true)} className="text-left text-body-sm font-semibold text-brand hover:underline">
          Skip for now — I’ll add photos later
        </button>
      )}

      {!review && (
      <DemoTips
        tips={[{ label: "Upload any JPG/PNG under 5 MB" }, { label: "Other file types or > 5 MB → upload failed" }, { label: "Finish without a photo → warning" }]}
        actions={[
          { label: "Simulate failed upload", onClick: () => uploadFailed("We couldn’t upload that photo. Check your connection and try again.") },
          { label: "Use sample photo", onClick: () => { update({ photo: "/brand/bride.png" }); setFailed(undefined); toast.success("Photo uploaded", "Looking great! It’ll be checked by our team."); } },
        ]}
      />
      )}
    </div>
  );
}

/** Segmented switch: Upload photos / Use an illustration — the brand pad slides between them */
function PhotoModeSwitch({ value, onChange }: { value: "upload" | "illustration"; onChange: (v: "upload" | "illustration") => void }) {
  const opts = [
    { id: "upload" as const, label: "Upload photos", Icon: Gallery },
    { id: "illustration" as const, label: "Use an illustration", Icon: EmojiHappy },
  ];
  return (
    <div role="radiogroup" aria-label="Profile picture type" className="relative grid grid-cols-2 rounded-full border border-line bg-surface-subtle p-1">
      <span
        aria-hidden
        className={cn(
          "absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-brand-gradient shadow-sm transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.3,0.64,1)]",
          value === "illustration" && "translate-x-full"
        )}
      />
      {opts.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "relative flex h-11 items-center justify-center gap-2 rounded-full px-3 text-label-md transition-colors",
            value === id ? "text-ink-on-brand" : "text-ink-secondary hover:text-ink"
          )}
        >
          <Icon size={18} color="currentColor" variant={value === id ? "Bold" : "Linear"} />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Illustration picker — flat avatars in the brand style (content/avatars.ts).
 * Large preview on the left (like the Main photo slot), options grid on the right,
 * Bride / Groom filter preset from the gender chosen in the previous step.
 */
function IllustrationPicker({ gender, value, onPick }: { gender?: AvatarGender; value: string | null; onPick: (uri: string, name: string) => void }) {
  const [filter, setFilter] = useState<AvatarGender>(gender ?? "female");
  const list = AVATARS.filter((a) => a.gender === filter);
  const selected = AVATARS.find((a) => avatarDataUri(a) === value);

  return (
    <div key="illustration" className="flex animate-fade-up flex-col gap-4">
      <div className="flex items-start gap-3 rounded-md bg-info-bg p-3.5 text-body-sm text-info-fg">
        <InfoCircle size={20} color="currentColor" className="mt-px shrink-0" />
        <p>
          <span className="font-semibold">Not ready to share photos?</span> Pick a friendly illustration for now — members see it instead of a photo, and
          you can switch to real photos anytime from your profile.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* preview — same footprint as the Main photo slot */}
        <div className="relative flex aspect-[200/260] w-full shrink-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border-[1.5px] border-dashed border-brand-focus bg-brand-subtle sm:h-[260px] sm:w-[200px]">
          {selected ? (
            <>
              <span className="absolute left-2.5 top-2.5">
                <Badge tone="info">Illustration</Badge>
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={selected.id} src={avatarDataUri(selected)} alt={selected.name} className="h-36 w-36 animate-pop-in rounded-full shadow-lg ring-4 ring-surface-card" />
              <p className="text-label-md text-ink">{selected.name}</p>
            </>
          ) : (
            <>
              <EmojiHappy size={32} color="currentColor" className="text-brand" />
              <p className="px-4 text-center text-body-sm font-semibold text-brand">Choose an illustration</p>
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* same Bride / Groom chips (with illustration avatars) as Search → "I'm looking for" */}
          <div className="flex gap-2">
            <Chip avatar="/brand/bride.png" selected={filter === "female"} onClick={() => setFilter("female")}>
              Bride
            </Chip>
            <Chip avatar="/brand/groom.png" selected={filter === "male"} onClick={() => setFilter("male")}>
              Groom
            </Chip>
          </div>
          <div key={filter} role="radiogroup" aria-label="Illustrations" className="grid grid-cols-4 gap-2.5">
            {list.map((a, i) => {
              const uri = avatarDataUri(a);
              const on = uri === value;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={a.name}
                  title={a.name}
                  onClick={() => onPick(uri, a.name)}
                  style={{ animation: `pop-in 360ms cubic-bezier(0.22,1,0.36,1) ${i * 45}ms backwards` }}
                  className={cn(
                    "group relative aspect-square rounded-full p-1 transition-all duration-200 active:scale-95",
                    on ? "bg-brand-gradient shadow-glow" : "bg-surface-subtle hover:-translate-y-0.5 hover:bg-brand-ring"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uri} alt="" className="h-full w-full rounded-full bg-surface-card" />
                  {on && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 animate-pop-in items-center justify-center rounded-full border-2 border-surface-card bg-success-fg text-white">
                      <TickCircle size={14} color="currentColor" variant="Bold" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-caption text-ink-tertiary">Tip: profiles with real photos get about 3× more replies — add yours whenever you’re ready.</p>
        </div>
      </div>
    </div>
  );
}

