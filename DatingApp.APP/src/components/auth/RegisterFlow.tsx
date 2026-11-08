"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight2,
  Briefcase,
  Calendar,
  Edit2,
  Gallery,
  GalleryAdd,
  InfoCircle,
  Location,
  MessageText1,
  Profile2User,
  TickCircle,
  Trash,
  User,
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
  Select,
  Stepper,
  Textarea,
  flashToast,
  isPasswordAcceptable,
  isValidSriLankanMobile,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { ageFrom, containsContactDetails, loadDraft, saveDraft, type RegistrationDraft } from "@/lib/demo";
import { AuthShell } from "./AuthShell";
import { DemoTips } from "./DemoTips";
import { DEMO, formatPhone } from "./shared";

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
  const [draft, setDraft] = useState<RegistrationDraft>(() => loadDraft());
  const update = (patch: Partial<RegistrationDraft>) => setDraft(saveDraft(patch));

  const go = (s: RegisterStep) => {
    setStep(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = () => {
    const d = saveDraft({ reviewStatus: "submitted" });
    if (embedded && onComplete) {
      toast.success("Profile submitted", "We’ll review it within 24 hours.");
      onComplete(d);
      return;
    }
    flashToast("success", "Profile submitted", "We’ll SMS you when it’s approved.");
    router.push("/register/status");
  };

  return (
    <AuthShell
      embedded={embedded}
      right={
        <>
          <span className="hidden text-body-md text-ink-secondary sm:inline">Already a member?</span>
          <Link href="/login" className="flex h-[43px] items-center rounded-full border border-line-strong bg-surface-card px-4 text-button-sm text-ink hover:bg-surface-subtle">
            Log in
          </Link>
        </>
      }
    >
      <Stepper step={step} className="max-w-[680px]" />
      <Card className="w-full max-w-[680px] p-5 sm:p-8">
        {step === 1 && <AccountStep draft={draft} update={update} onNext={() => go(2)} />}
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

const PROFILE_FOR = ["Myself", "Son", "Daughter", "Brother", "Sister", "Relative"];

function AccountStep({ draft, update, onNext }: { draft: RegistrationDraft; update: (p: Partial<RegistrationDraft>) => void; onNext: () => void }) {
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

      {taken && (
        <Alert type="error" title="This number is already registered" action={<Link href="/login" className="font-bold text-brand hover:underline">Log in instead →</Link>}>
          {formatPhone(mobile)} already has a Vikasitha account.
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-body-sm font-semibold text-ink">This profile is for</p>
        <div className="flex flex-wrap gap-2">
          {PROFILE_FOR.map((p) => (
            <Chip key={p} size="sm" selected={draft.profileFor === p} onClick={() => update({ profileFor: p })}>
              {p}
            </Chip>
          ))}
        </div>
      </div>

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
    if (value === DEMO.otp) {
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
  gender: ["Female", "Male"],
  religion: ["Buddhist", "Hindu", "Christian", "Catholic", "Islam", "Other"],
  district: ["Colombo", "Gampaha", "Kandy", "Galle", "Matara", "Kurunegala", "Jaffna", "Batticaloa", "Anuradhapura", "Ratnapura", "Badulla", "Other"],
  height: ["4' 10\"", "5' 0\"", "5' 2\"", "5' 4\"", "5' 6\"", "5' 8\"", "5' 10\"", "6' 0\"", "6' 2\""],
  education: ["O/L", "A/L", "Diploma", "Bachelor’s degree", "Master’s degree", "Doctorate", "Professional qualification"],
  profession: ["Doctor", "Engineer", "IT professional", "Accountant", "Lawyer", "Teacher", "Business owner", "Government officer", "Other"],
  marital: ["Never married", "Divorced", "Widowed"],
  livingIn: ["Sri Lanka", "Australia", "United Kingdom", "Canada", "UAE", "Other"],
};

type ProfileKey = "fullName" | "gender" | "dob" | "religion" | "district" | "height" | "education" | "profession" | "maritalStatus" | "livingIn";
const REQUIRED: ProfileKey[] = ["fullName", "gender", "dob", "religion", "district", "education", "profession", "maritalStatus", "livingIn"];

function ProfileStep({ draft, update, onBack, onNext }: { draft: RegistrationDraft; update: (p: Partial<RegistrationDraft>) => void; onBack: () => void; onNext: () => void }) {
  const toast = useToast();
  const [errors, setErrors] = useState<Partial<Record<ProfileKey | "about", string>>>({});
  const [showMissing, setShowMissing] = useState(false);
  const [horoscope, setHoroscope] = useState(false);
  const age = ageFrom(draft.dob);
  const underage = age !== null && age < 18;
  const aboutError = containsContactDetails(draft.about) ? "Please remove phone numbers or emails — members connect safely through Vikasitha" : undefined;

  const set = (k: ProfileKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    update({ [k]: e.target.value } as Partial<RegistrationDraft>);
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    REQUIRED.forEach((k) => {
      if (!String(draft[k] ?? "").trim()) er[k] = "Required";
    });
    if (draft.fullName && draft.fullName.trim().length < 3) er.fullName = "Enter your full name";
    if (underage) er.dob = "You must be at least 18 years old";
    if (aboutError) er.about = aboutError;
    setErrors(er);
    setShowMissing(Object.keys(er).some((k) => er[k as ProfileKey] === "Required"));
    if (Object.keys(er).length) {
      if (!underage) document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <CardTitle title="Tell us about yourself" subtitle="These details help families find the right match. You can edit them anytime." />

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
        <Input label="Full name" placeholder="e.g. Nethmi Perera" icon={<User size={20} color="currentColor" />} value={draft.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" />
        <Select label="Gender" placeholder="Select" options={OPTIONS.gender} value={draft.gender} onChange={set("gender")} error={errors.gender} icon={<Profile2User size={20} color="currentColor" />} />
        <Input
          label="Date of birth"
          type="date"
          icon={<Calendar size={20} color="currentColor" />}
          value={draft.dob}
          onChange={set("dob")}
          max={new Date().toISOString().slice(0, 10)}
          error={errors.dob ?? (underage ? "You must be at least 18 years old" : undefined)}
          helper={age !== null && !underage ? `${age} years` : undefined}
        />
        <Select label="Religion" placeholder="Select" options={OPTIONS.religion} value={draft.religion} onChange={set("religion")} error={errors.religion} />
        <Select label="District" placeholder="Select" options={OPTIONS.district} value={draft.district} onChange={set("district")} error={errors.district} icon={<Location size={20} color="currentColor" />} />
        <Select label="Height" hint="Optional" placeholder="Select" options={OPTIONS.height} value={draft.height} onChange={set("height")} />
        <Select label="Education" placeholder="Select" options={OPTIONS.education} value={draft.education} onChange={set("education")} error={errors.education} />
        <Select label="Profession" placeholder="Select" options={OPTIONS.profession} value={draft.profession} onChange={set("profession")} error={errors.profession} icon={<Briefcase size={20} color="currentColor" />} />
        <Select label="Marital status" placeholder="Select" options={OPTIONS.marital} value={draft.maritalStatus} onChange={set("maritalStatus")} error={errors.maritalStatus} />
        <Select label="Living in" placeholder="Select" options={OPTIONS.livingIn} value={draft.livingIn} onChange={set("livingIn")} error={errors.livingIn} />
      </div>

      <Textarea
        label="About you"
        hint="Optional"
        rows={4}
        placeholder="A few warm lines about you, your family and what you’re looking for…"
        value={draft.about}
        onChange={(v) => update({ about: v })}
        helper="Tip: profiles with a short, warm description get more replies. Don’t add phone numbers here."
        error={errors.about ?? aboutError}
      />
      <Checkbox checked={horoscope} onChange={setHoroscope}>I have a horoscope to share (you can upload it later)</Checkbox>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeft size={18} color="currentColor" />} className="shrink-0">
          Back
        </Button>
        <Button type="submit" fullWidth disabled={underage} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
          Continue
        </Button>
      </div>
      <button type="button" onClick={() => toast.success("Progress saved", "You can come back and finish anytime.")} className="text-center text-body-sm font-semibold text-brand hover:underline">
        Save &amp; finish later
      </button>

      <DemoTips
        tips={[{ label: "Birthday under 18 → blocked" }, { label: "Phone number in About you → error" }, { label: "Continue with empty fields → missing" }]}
        actions={[
          {
            label: "Fill sample profile",
            onClick: () => {
              update({
                fullName: "Nethmi Perera",
                gender: "Female",
                dob: "1997-05-12",
                religion: "Buddhist",
                district: "Kandy",
                height: "5' 4\"",
                education: "Bachelor’s degree",
                profession: "Doctor",
                maritalStatus: "Never married",
                livingIn: "Sri Lanka",
                about: "I’m a doctor working in Kandy, close to my family. I love travelling, reading and cooking Sri Lankan food. Looking for a kind, educated partner who values family.",
              });
              setErrors({});
              setShowMissing(false);
            },
          },
        ]}
      />
    </form>
  );
}

/* ───────────────────────── Step 4 · Photos (05, 05a–05c) ───────────────────────── */

const MAX_MB = 5;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];

function PhotosStep({ draft, update, onBack, onFinish }: { draft: RegistrationDraft; update: (p: Partial<RegistrationDraft>) => void; onBack: () => void; onFinish: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [extra, setExtra] = useState<(string | null)[]>([null, null, null, null]);
  const [target, setTarget] = useState<number>(-1); // -1 main, 0..3 extra
  const [failed, setFailed] = useState<string>();
  const [blur, setBlur] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

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
    if (!draft.photo && !confirmSkip) {
      setConfirmSkip(true);
      return;
    }
    onFinish();
  };

  return (
    <div className="flex flex-col gap-5">
      <CardTitle title="Add your best photos" subtitle="Profiles with clear photos receive more interest — every photo is checked by our team." />
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

      <div className="grid gap-3 sm:grid-cols-[1.1fr_1fr]">
        <PhotoSlot main src={draft.photo} onPick={() => pick(-1)} onRemove={() => update({ photo: null })} />
        <div className="grid grid-cols-2 gap-3">
          {extra.map((src, i) => (
            <PhotoSlot key={i} src={src} label={i === 0 ? "Add photo" : "Optional"} onPick={() => pick(i)} onRemove={() => setExtra((x) => x.map((v, j) => (j === i ? null : v)))} />
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

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeft size={18} color="currentColor" />} className="shrink-0">
          Back
        </Button>
        <Button fullWidth onClick={finish} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
          Finish &amp; go live
        </Button>
      </div>
      <button type="button" onClick={() => setConfirmSkip(true)} className="text-left text-body-sm font-semibold text-brand hover:underline">
        Skip for now — I’ll add photos later
      </button>

      <DemoTips
        tips={[{ label: "Upload any JPG/PNG under 5 MB" }, { label: "Other file types or > 5 MB → upload failed" }, { label: "Finish without a photo → warning" }]}
        actions={[
          { label: "Simulate failed upload", onClick: () => uploadFailed("We couldn’t upload that photo. Check your connection and try again.") },
          { label: "Use sample photo", onClick: () => { update({ photo: "/brand/bride.png" }); setFailed(undefined); toast.success("Photo uploaded", "Looking great! It’ll be checked by our team."); } },
        ]}
      />
    </div>
  );
}

function PhotoSlot({ src, main, label = "Add photo", onPick, onRemove }: { src: string | null; main?: boolean; label?: string; onPick: () => void; onRemove: () => void }) {
  if (src) {
    return (
      <div className={cn("group relative overflow-hidden rounded-lg border border-line bg-surface-muted", main ? "aspect-[4/5]" : "aspect-square")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={main ? "Main photo" : "Photo"} className="h-full w-full object-cover" />
        {main && (
          <span className="absolute left-3 top-3">
            <Badge tone="success">Main photo</Badge>
          </span>
        )}
        <div className="absolute bottom-3 left-3 flex gap-2">
          <button type="button" onClick={onPick} aria-label="Change photo" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-glass-strong text-ink shadow-sm hover:bg-surface-card">
            <Edit2 size={16} color="currentColor" />
          </button>
          <button type="button" onClick={onRemove} aria-label="Remove photo" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-glass-strong text-error-fg shadow-sm hover:bg-surface-card">
            <Trash size={16} color="currentColor" />
          </button>
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-focus bg-brand-subtle text-body-sm font-semibold text-brand transition-colors hover:border-brand hover:bg-surface-card",
        main ? "aspect-[4/5]" : "aspect-square"
      )}
    >
      {main ? <Gallery size={32} color="currentColor" /> : <GalleryAdd size={22} color="currentColor" />}
      {main ? "Add your main photo" : label}
      {main && <span className="text-body-xs font-normal text-ink-tertiary">JPG or PNG, up to 5 MB</span>}
    </button>
  );
}
