"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight2,
  Calendar,
  Camera,
  DocumentText,
  Personalcard,
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
import { ageFrom, clearDraft, containsContactDetails, emptyDraft, loadDraft, saveDraft, type RegistrationDraft } from "@/lib/registrationDraft";
import {
  MISSING_LABELS,
  checkFile,
  deletePhoto,
  listMyDocuments,
  listMyPhotos,
  setMainPhoto,
  submitForReview,
  uploadDocument,
  uploadPhoto,
  type KycDocumentDto,
  type KycDocumentType,
  type PhotoDto,
} from "@/lib/media";
import { displayNameFor, profileDetailsFromKyc, saveSubmittedKycDetails } from "@/lib/kycDetails";
import { AuthShell } from "./AuthShell";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { formatPhone } from "./shared";

/** Same as the API (AuthRules.CodeMaxAttempts). */
const CODE_MAX_ATTEMPTS = 5;
import { AVATARS, avatarDataUri, avatarRef, isIllustration, type AvatarGender } from "@/content/avatars";
import { DISTRICT_OPTIONS } from "@/content/search";
import type { CountryCode } from "@/components/ui/Flag";
import { ApiError, apiService, type CreateProfilePayload } from "@/services/api";
import type { Profile } from "@/types";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";

/**
 * Registration journeys 3–6 (Figma 02 Account, 03 Verify, 04 Profile,
 * 05 Photos, with every error / success / toast state from the flow).
 * Draft kept in sessionStorage (src/lib/registrationDraft.ts); steps call the auth + profile APIs.
 */
export type RegisterStep = 1 | 2 | 3 | 4 | 5;

export interface RegisterFlowProps {
  initialStep?: RegisterStep;
  /** Inside the home-page modal: no page chrome, call onComplete at the end */
  embedded?: boolean;
  onComplete?: (draft: RegistrationDraft) => void;
}

/** POST /api/profiles with exactly what the member entered. Throws ApiError when the API refuses it. */
export async function saveProfileDraft(d: RegistrationDraft): Promise<void> {
  const fullName = [d.firstName.trim(), d.lastName.trim()].filter(Boolean).join(" ");
  await apiService.createOrUpdateProfile({
    fullName,
    email: d.email.trim() || undefined,
    gender: d.gender.toLowerCase() === "female" ? "female" : "male",
    dateOfBirth: d.dob,
    age: ageFrom(d.dob) ?? 0,
    height: d.height,
    profession: d.profession.trim(),
    professionCategory: (PROFESSION_CATEGORY[d.professionCategory] ?? "Other") as CreateProfilePayload["professionCategory"],
    education: d.education,
    university: "",
    location: d.district,
    country: d.country,
    religion: d.religion,
    community: d.ethnicity,
    bio: d.about.trim(),
    aboutFamily: "",
    horoscopeAvailable: false,
    // avatars as "avatar:<id>"; uploaded photos are managed by /api/photos ("photo:<id>" is ignored by the API)
    photoUrl: avatarRef(d.photo),
    interests: [],
    details: profileDetailsFromKyc(d),
  });
  saveSubmittedKycDetails(d);
}

/** The member's saved profile → form values, so a signed-in member can finish or fix it on any device. */
export function profileToDraft(p: Profile, session?: { phoneNumber?: string; email?: string }): Partial<RegistrationDraft> {
  const [firstName, ...rest] = (p.name || "").trim().split(/\s+/);
  const category = Object.entries(PROFESSION_CATEGORY).find(([, v]) => v === p.professionCategory)?.[0] ?? "";
  const d = p.details ?? {};
  return {
    mobile: session?.phoneNumber ?? "",
    email: session?.email ?? "",
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    fullName: p.name,
    displayNameFormat: d.displayName ? "First name only" : "",
    createdBy: d.createdBy ?? "",
    profileFor: d.profileFor ?? "Myself",
    whatsapp: d.whatsApp ?? "",
    whatsappSameAsMobile: false,
    height: p.height,
    profession: p.profession,
    professionCategory: category,
    education: p.education,
    dob: p.dateOfBirth ?? "",
    gender: p.gender === "female" ? "Female" : "Male",
    civilStatus: d.civilStatus ?? "",
    religion: p.religion,
    ethnicity: p.community,
    caste: d.caste ?? "",
    country: p.country,
    district: d.district ?? p.location,
    zodiacSign: d.zodiacSign ?? "",
    monthlySalaryRange: d.monthlySalaryRange ?? "",
    weightKg: d.weightKg ?? "",
    about: p.bio,
    photo: p.photoUrl?.startsWith("data:image/svg") ? p.photoUrl : null,
  };
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

  /** POST /api/profiles with exactly what the member entered (step 3 → 4, and again when an avatar is chosen). */
  const saveProfile = async (d: RegistrationDraft): Promise<boolean> => {
    try {
      await saveProfileDraft(d);
      return true;
    } catch (err) {
      toast.error("Couldn’t save your profile", err instanceof Error ? err.message : "Please try again.");
      return false;
    }
  };

  /** Last step: POST /api/profiles/me/submit → the profile joins the review queue. */
  const finish = async () => {
    const d = saveDraft({ fullName: [draft.firstName.trim(), draft.lastName.trim()].filter(Boolean).join(" "), reviewStatus: "submitted" });
    if (embedded && onComplete) {
      onComplete(d);
      return;
    }
    try {
      await submitForReview();
    } catch (err) {
      const missing = err instanceof ApiError ? (err.extras as { missing?: string[] }).missing : undefined;
      const message = missing?.length
        ? `Still needed: ${missing.map((m) => MISSING_LABELS[m] ?? m).join(", ")}.`
        : err instanceof Error ? err.message : "Please try again.";
      toast.error("Couldn’t submit your profile", message);
      return;
    }
    await apiService.refreshSession(); // status now comes from the server: "Submitted"
    clearDraft();
    flashToast("success", "Profile submitted", "We’ll review it within 24 hours and let you know by SMS.");
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
        {step === 2 && <VerifyStep mobile={draft.mobile} onBack={() => go(1)} onNext={() => go(3)} />}
        {step === 3 && (
          <ProfileStep
            draft={draft}
            update={update}
            onBack={() => go(2)}
            onNext={async () => {
              if (await saveProfile(loadDraft())) go(4);
            }}
          />
        )}
        {step === 4 && (
          <PhotosStep
            draft={draft}
            update={update}
            onBack={() => go(3)}
            onFinish={async () => {
              // an avatar is part of the profile; uploaded photos are already on the server
              if (isIllustration(draft.photo) && !(await saveProfile(loadDraft()))) return;
              go(5);
            }}
          />
        )}
        {step === 5 && <IdentityStep onBack={() => go(4)} onFinish={finish} />}
      </Card>
      {step === 2 && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-info-bg px-3 py-1 text-body-xs font-semibold text-info-fg">
          <InfoCircle size={14} color="currentColor" /> Tip: the code expires in 5 minutes
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
  // the draft is read after mount (sessionStorage), so pick up the number typed on the home page sign-up form
  useEffect(() => {
    if (draft.mobile) setMobile((m) => m || draft.mobile);
  }, [draft.mobile]);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<{ mobile?: string; pw?: string; pw2?: string; terms?: string }>({});
  const [taken, setTaken] = useState(false);
  const [loading, setLoading] = useState(false);

  const clear = (k: keyof typeof errors) => setErrors((e) => ({ ...e, [k]: undefined }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaken(false);
    const er: typeof errors = {};
    if (!mobile) er.mobile = "Enter your mobile number";
    else if (!isValidSriLankanMobile(mobile)) er.mobile = "Enter a valid Sri Lankan mobile number";
    if (!pw) er.pw = "Create a password";
    else if (pw.length < 8) er.pw = "Password must be at least 8 characters";
    else if (!isPasswordAcceptable(pw)) er.pw = "Too weak, use at least one letter and one number";
    if (!pw2) er.pw2 = "Confirm your password";
    else if (pw && pw !== pw2) er.pw2 = "Passwords don’t match";
    if (!terms) er.terms = "Please accept the Terms of Service and Privacy Policy to continue";
    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    try {
      // Creates the account (or takes over an unconfirmed sign-up with this number). No session yet:
      // the member is signed in once the SMS code is confirmed on the next step.
      await apiService.register({ phoneNumber: mobile, password: pw }); // POST /api/auth/register
      update({ mobile });
      try {
        await apiService.sendOtp(mobile); // POST /api/auth/send-otp
        toast.success("Code sent", `We sent a 6-digit code to ${formatPhone(mobile)}.`);
      } catch (err) {
        // Account is created; the member can resend from the next step.
        toast.warning("Couldn’t send the code yet", err instanceof Error ? err.message : "Tap Resend on the next step.");
      }
      onNext();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setTaken(true);
      } else {
        toast.error("Couldn’t create your account", err instanceof Error ? err.message : "Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <CardTitle title="Create your free account" subtitle="No payment needed, browse and connect for free, upgrade anytime." />

      {/* details typed on the home page "Ready to meet your life partner?" form */}
      {(draft.firstName || draft.lastName || draft.email) && (
        <div className="flex items-start gap-3 rounded-[16px] bg-brand-subtle p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-label-md text-ink-on-brand">
            {(draft.firstName[0] || draft.lastName[0] || "V").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-label-md text-ink">
              {[draft.firstName, draft.lastName].filter(Boolean).join(" ") || "Your details"}
            </p>
            <p className="truncate text-body-sm text-ink-secondary">
              {[draft.email, draft.mobile && formatPhone(draft.mobile)].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-1 text-body-xs text-ink-tertiary">We’ve saved these for your profile. You can change them in the profile step.</p>
          </div>
        </div>
      )}

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
      <PasswordField value={pw} onChange={(v) => { setPw(v); clear("pw"); }} showStrength helper="At least 8 characters, with a letter and a number" error={errors.pw} autoComplete="new-password" />
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

    </form>
  );
}

/* ───────────────────────── Step 2 · Verify (03, 03a–03f) ───────────────────────── */

function VerifyStep({ mobile, onBack, onNext }: Readonly<{ mobile: string; onBack: () => void; onNext: () => void }>) {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [state, setState] = useState<"default" | "error" | "success">("default");
  const [attempts, setAttempts] = useState(0);
  const [expired, setExpired] = useState(false);
  const [blockedFor, setBlockedFor] = useState(0);
  const [resendIn, setResendIn] = useState(60);
  const [error, setError] = useState<string>();
  const checked = useRef("");
  const verifying = useRef(false);

  useEffect(() => {
    if (resendIn <= 0 && blockedFor <= 0) return;
    const t = window.setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
      setBlockedFor((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendIn, blockedFor]);

  useEffect(() => {
    if (blockedFor === 0 && attempts >= CODE_MAX_ATTEMPTS) {
      setAttempts(0);
      setError(undefined);
    }
  }, [blockedFor, attempts]);

  const verify = async (value = code) => {
    if (value.length < 6) {
      setError("Enter all 6 digits");
      setState("error");
      return;
    }
    // One check at a time: the code is single-use, so a second request (auto-check + button press) would fail.
    if (verifying.current) return;
    verifying.current = true;
    checked.current = value;
    try {
      await apiService.verifyOtp(mobile, value); // POST /api/auth/verify-otp — marks the number verified
      setState("success");
      setError(undefined);
      toast.success("Mobile verified", `Your number ${formatPhone(mobile)} is confirmed.`);
      window.setTimeout(onNext, 900);
    } catch (err) {
      setState("error");
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.code === "CODE_EXPIRED") {
        setExpired(true);
        setCode("");
        setState("default");
        setError(undefined);
      } else if (apiErr?.code === "TOO_MANY_ATTEMPTS") {
        setAttempts(CODE_MAX_ATTEMPTS);
        setBlockedFor(30);
        setError(undefined);
      } else if (apiErr?.code === "CODE_INVALID") {
        const left = apiErr.extras.attemptsLeft ?? 0;
        setAttempts(CODE_MAX_ATTEMPTS - left);
        setError(`Incorrect code · ${left} attempt${left === 1 ? "" : "s"} left`);
      } else {
        setError(err instanceof Error ? err.message : "Couldn’t check the code. Please try again.");
      }
    } finally {
      verifying.current = false;
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

  const resend = async () => {
    try {
      const res = await apiService.sendOtp(mobile); // POST /api/auth/send-otp
      setResendIn(res.resendAvailableInSeconds ?? 60);
      setExpired(false);
      setCode("");
      setError(undefined);
      setState("default");
      setAttempts(0);
      setBlockedFor(0);
      toast.info("New code sent", `Check your SMS on ${formatPhone(mobile)}.`);
    } catch (err) {
      const wait = err instanceof ApiError ? err.extras.retryAfterSeconds : undefined;
      if (wait) setResendIn(Math.min(wait, 59));
      toast.error("Couldn’t send a new code", err instanceof Error ? err.message : "Please try again.");
    }
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
          Codes are valid for 5 minutes. Request a new one to continue.
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

    </div>
  );
}

/* ───────────────────────── Step 3 · Profile (04, 04a–04c) ───────────────────────── */

const OPTIONS = {
  district: DISTRICT_OPTIONS,
  zodiacSign: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
  monthlySalaryRange: [
    "Below LKR 50,000", "LKR 50,000–99,999", "LKR 100,000–149,999", "LKR 150,000–249,999",
    "LKR 250,000–499,999", "LKR 500,000 or more", "Prefer not to say",
  ],
  displayNameFormat: ["First name only", "Last name only", "Full name", "First name and first letter of last name", "First letter of first name and full last name"],
  createdBy: ["Self", "Parent", "Sibling", "Relative", "Friend"],
  height: ["4' 10\"", "4' 11\"", "5' 0\"", "5' 1\"", "5' 2\"", "5' 3\"", "5' 4\"", "5' 5\"", "5' 6\"", "5' 7\"", "5' 8\"", "5' 9\"", "5' 10\"", "5' 11\"", "6' 0\"", "6' 1\"", "6' 2\""],
  gender: ["Male", "Female"],
  civilStatus: ["Never married", "Divorced", "Widowed", "Separated"],
  religion: ["Buddhist", "Hindu", "Christian", "Catholic", "Islam", "Other"],
  ethnicity: ["Sinhalese", "Tamil", "Muslim", "Burgher", "Malay", "Other"],
  country: ["Sri Lanka", "Australia", "United Kingdom", "Canada", "USA", "Qatar", "UAE", "Italy", "New Zealand", "Other"],
  professionCategory: ["Medical / Doctor", "Engineering", "IT / Software", "Finance / Accounting", "Legal", "Business / Management", "Other"],
  education: ["O/L or below", "A/L", "Diploma / Certificate", "Bachelor's degree", "Master's degree", "Doctorate (PhD)", "Professional qualification"],
};

/** Field-of-work label → the API's ProfessionCategory value (also used by search filters). */
const PROFESSION_CATEGORY: Record<string, string> = {
  "Medical / Doctor": "Doctor",
  Engineering: "Engineer",
  "IT / Software": "IT",
  "Finance / Accounting": "Finance",
  Legal: "Legal",
  "Business / Management": "Business",
  Other: "Other",
};

type ProfileKey = "firstName" | "lastName" | "displayNameFormat" | "createdBy" | "email" | "whatsapp" | "height" | "dob" | "gender" | "civilStatus" | "religion" | "ethnicity" | "caste" | "country" | "district" | "profession" | "professionCategory" | "education" | "zodiacSign" | "monthlySalaryRange" | "weightKg";
const REQUIRED: ProfileKey[] = ["firstName", "lastName", "displayNameFormat", "createdBy", "height", "dob", "gender", "civilStatus", "religion", "ethnicity", "country", "profession", "professionCategory", "education"];

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
  const aboutError = containsContactDetails(draft.about) ? "Please remove phone numbers or emails. Members connect safely through Vikasitha" : undefined;

  const setValue = (k: ProfileKey, v: string) => {
    const patch: Partial<RegistrationDraft> = { [k]: v };
    if (k === "firstName" || k === "lastName") {
      const first = k === "firstName" ? v : draft.firstName;
      const last = k === "lastName" ? v : draft.lastName;
      patch.fullName = [first.trim(), last.trim()].filter(Boolean).join(" ");
    }
    if (k === "country" && v !== "Sri Lanka") patch.district = "";
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
    if (draft.whatsapp) {
      const ok = draft.whatsappCountry === "lk" ? isValidSriLankanMobile(draft.whatsapp) : /^\d{7,14}$/.test(draft.whatsapp);
      if (!ok) er.whatsapp = draft.whatsappCountry === "lk" ? "Enter a valid Sri Lankan mobile number" : "Enter a valid WhatsApp number";
    }
    if (underage) er.dob = "You must be at least 18 years old";
    if (draft.weightKg && (!Number.isFinite(Number(draft.weightKg)) || Number(draft.weightKg) <= 0)) {
      er.weightKg = "Enter a valid weight in kilograms";
    }
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
            subtitle={`Our safety team flagged ${flaggedCount} field${flaggedCount === 1 ? "" : "s"}. Only these need changing. The rest is already approved.`}
          />
          {stillRejected.dob || stillRejected.about ? (
            <Alert type="error" title={`${[stillRejected.dob, stillRejected.about].filter(Boolean).length} field${[stillRejected.dob, stillRejected.about].filter(Boolean).length === 1 ? "" : "s"} need changes`}>
              Reviewed on {review.reviewedOn} · Update them and tap Resubmit.
            </Alert>
          ) : (
            <Alert type="success" title="All highlighted fields updated">
              Looks good, tap Resubmit for review.
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
        <div className="flex flex-col gap-2">
          <Select label="Display name format" options={OPTIONS.displayNameFormat} value={draft.displayNameFormat} onChange={pick("displayNameFormat")} error={errors.displayNameFormat} />
          {/* live preview of the name other members will see */}
          <DisplayNamePreview format={draft.displayNameFormat} first={draft.firstName} last={draft.lastName} />
        </div>
        <Select label="Account created by" options={OPTIONS.createdBy} value={draft.createdBy} onChange={pick("createdBy")} error={errors.createdBy} />
        <Input label="Email" type="email" placeholder="you@example.com" value={draft.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        {/* WhatsApp number — next to Email (same row), optional; the member types it */}
        <PhoneField
          label="WhatsApp number (optional)"
          value={draft.whatsapp}
          onChange={(v) => {
            update({ whatsapp: v, whatsappSameAsMobile: false });
            setErrors((er) => ({ ...er, whatsapp: undefined }));
          }}
          country={(draft.whatsappCountry || "lk") as CountryCode}
          onCountryChange={(c) => update({ whatsappCountry: c.iso, whatsappSameAsMobile: false })}
          compact
          error={errors.whatsapp}
        />
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
        {draft.country === "Sri Lanka" && <Select label="District" hint="Optional" options={OPTIONS.district} value={draft.district} onChange={pick("district")} />}
        <Input label="Profession" placeholder="e.g. Software engineer" value={draft.profession} onChange={set("profession")} error={errors.profession} autoComplete="organization-title" />
        <Select label="Field of work" options={OPTIONS.professionCategory} value={draft.professionCategory} onChange={pick("professionCategory")} error={errors.professionCategory} />
        <Select label="Highest education" options={OPTIONS.education} value={draft.education} onChange={pick("education")} error={errors.education} />
        <Select label="Zodiac sign" hint="Optional" options={OPTIONS.zodiacSign} value={draft.zodiacSign} onChange={pick("zodiacSign")} />
        <Select label="Monthly salary range" hint="Optional" options={OPTIONS.monthlySalaryRange} value={draft.monthlySalaryRange} onChange={pick("monthlySalaryRange")} helper="Choose your monthly income in LKR or its equivalent." />
        <Input label="Weight (kg)" hint="Optional" type="number" min={1} step="any" value={draft.weightKg} onChange={set("weightKg")} error={errors.weightKg} />
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
    </form>
  );
}

/* ───────────────────────── Step 4 · Photos (05, 05a–05c) ───────────────────────── */


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
  const fileRef = useRef<HTMLInputElement>(null);
  // Photos live on the server (POST /api/photos) — nothing but the avatar choice is kept in the browser
  const [photos, setPhotos] = useState<PhotoDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<number>(-1); // -1 main, 0..3 extra
  const [failed, setFailed] = useState<string>();
  const [confirmSkip, setConfirmSkip] = useState(false);
  // "upload" real photos, or "illustration" — a friendly avatar for members not ready to share photos
  const [mode, setMode] = useState<"upload" | "illustration">(isIllustration(draft.photo) ? "illustration" : "upload");
  useEffect(() => {
    if (isIllustration(draft.photo)) setMode("illustration");
  }, [draft.photo]);

  const reload = async () => {
    try {
      setPhotos(await listMyPhotos());
    } catch {
      /* first visit before the profile exists, or offline — slots stay empty */
    }
  };
  useEffect(() => {
    void reload();
  }, []);

  const visible = photos.filter((p) => p.status !== "Rejected" || p.isMain);
  const main = visible.find((p) => p.isMain) ?? null;
  const extras = visible.filter((p) => !p.isMain).sort((a, b) => a.sortOrder - b.sortOrder);
  const slots: (PhotoDto | null)[] = [0, 1, 2, 3].map((i) => extras[i] ?? null);
  const photoRejected = !!review && (!main || main.status === "Rejected");
  const hasPhoto = !!main && main.status !== "Rejected";

  const pick = (slot: number) => {
    setTarget(slot);
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const problem = checkFile(f, false);
    if (problem) return uploadFailed(problem);

    setBusy(true);
    try {
      const replacing = target === -1 ? main : slots[target];
      const added = await uploadPhoto(f);
      if (target === -1 && !added.isMain) await setMainPhoto(added.id);
      if (replacing) await deletePhoto(replacing.id);
      if (target === -1) update({ photo: added.ref }); // the photo replaces any avatar
      setFailed(undefined);
      setConfirmSkip(false);
      toast.success("Photo uploaded", target === -1 ? "Looking great! It’ll be checked by our team." : "Added to your gallery.");
      await reload();
    } catch (err) {
      uploadFailed(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (photo: PhotoDto) => {
    setBusy(true);
    try {
      await deletePhoto(photo.id);
      if (photo.isMain && draft.photo === photo.ref) update({ photo: null });
      await reload();
    } catch (err) {
      toast.error("Couldn’t remove the photo", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const makeMain = async (photo: PhotoDto) => {
    setBusy(true);
    try {
      await setMainPhoto(photo.id);
      update({ photo: photo.ref });
      await reload();
    } catch (err) {
      toast.error("Couldn’t change your main photo", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
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
      toast.error("Choose an avatar", "Pick an avatar below, or switch to Upload photos.");
      return;
    }
    if (mode === "upload" && !hasPhoto) {
      // a main photo (or an avatar) is needed for the review
      setConfirmSkip(true);
      return;
    }
    onFinish();
  };

  return (
    <div className="flex flex-col gap-5">
      {review ? (
        <>
          <CardTitle title="Replace your main photo" subtitle="Your main photo wasn’t approved. Your other details are fine, just upload a new one." />
          {photoRejected ? (
            <Alert type="error" title="Main photo rejected">
              {review.reason}. Reviewed on {review.reviewedOn}.
            </Alert>
          ) : (
            <Alert type="success" title="New main photo added">
              Looks good, tap Resubmit for review.
            </Alert>
          )}
        </>
      ) : (
        <CardTitle title="Add your best photos" subtitle="Profiles with clear photos receive more interest. Every photo is checked by our team." />
      )}

      {/* Upload real photos ↔ use an illustration */}
      <PhotoModeSwitch value={mode} onChange={(m) => { setMode(m); setConfirmSkip(false); }} />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />

      {failed && (
        <Alert type="error" title="Upload failed" action={<button type="button" onClick={() => pick(target)} className="font-bold text-brand hover:underline">Try again</button>}>
          {failed}
        </Alert>
      )}
      {confirmSkip && !hasPhoto && (
        <Alert type="warning" title="Add a main photo or an avatar" action={<span className="flex gap-4"><button type="button" onClick={() => pick(-1)} className="font-bold text-brand hover:underline">Add a photo</button><button type="button" onClick={() => setMode("illustration")} className="font-bold text-ink-secondary hover:underline">Choose an avatar</button></span>}>
          Our team needs a picture to review your profile. If you’re not ready to share photos, pick an avatar for now.
        </Alert>
      )}

      {mode === "illustration" ? (
        <IllustrationPicker
          gender={draft.gender === "Male" ? "male" : draft.gender === "Female" ? "female" : undefined}
          value={isIllustration(draft.photo) ? draft.photo : null}
          onPick={(uri, name) => {
            update({ photo: uri });
            setConfirmSkip(false);
            toast.success("Avatar selected", `“${name}” will show on your profile until you add photos.`);
          }}
        />
      ) : (
      <>
      {/* Figma: Photo slots — row 260 high, gap 12: Main photo 200 × 260 + More photos 2 × 2 of 146 × 124 */}
      <div key="upload" className={cn("flex animate-fade-up flex-col gap-3 sm:h-[260px] sm:flex-row", busy && "pointer-events-none opacity-60")} aria-busy={busy}>
        <PhotoSlot
          main
          rejected={!!main && main.status === "Rejected"}
          inReview={!!main && main.status === "Pending"}
          src={main?.ref ?? null}
          onPick={() => pick(-1)}
          onRemove={main ? () => void remove(main) : undefined}
          className="aspect-[200/260] w-full sm:aspect-auto sm:h-full sm:w-[200px] sm:shrink-0"
        />
        <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:w-[304px] sm:shrink-0">
          {slots.map((photo, i) => (
            <PhotoSlot
              key={photo?.id ?? `empty-${i}`}
              src={photo?.ref ?? null}
              rejected={photo?.status === "Rejected"}
              inReview={photo?.status === "Pending"}
              label={i === 0 ? "Add photo" : "Optional"}
              onPick={() => pick(i)}
              onRemove={photo ? () => void remove(photo) : undefined}
              onMakeMain={photo && photo.status !== "Rejected" ? () => void makeMain(photo) : undefined}
              className="h-[124px] w-full"
            />
          ))}
        </div>
      </div>

      <ul className="space-y-2 rounded-md bg-surface-subtle p-4 text-body-sm text-ink-secondary">
        {["Clear face, good light, no sunglasses", "Recent photo (within 12 months)", "No group photos as your main photo"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <TickCircle size={18} color="currentColor" className="text-success-fg" /> {t}
          </li>
        ))}
      </ul>
      </>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeft size={18} color="currentColor" />} className="shrink-0">
          Back
        </Button>
        <Button fullWidth onClick={finish} disabled={busy} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
          {review ? "Resubmit for review" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

/* ───────────────────────── Step 5 · Identity (Sprint 02 — S02-T09) ───────────────────────── */

const DOCUMENT_SLOTS: Record<"nic" | "passport", { type: KycDocumentType; label: string; hint: string }[]> = {
  nic: [
    { type: "NicFront", label: "NIC — front", hint: "The side with your photo" },
    { type: "NicBack", label: "NIC — back", hint: "The side with the address" },
  ],
  passport: [{ type: "Passport", label: "Passport photo page", hint: "The page with your photo and details" }],
};

/**
 * Identity check: NIC (front + back) or passport, plus a selfie. Files go straight to the API
 * (POST /api/kyc/documents) and are only seen by our safety team. Then the profile is submitted for review.
 */
export function IdentityStep({ onBack, onFinish }: Readonly<{ onBack: () => void; onFinish: () => Promise<void> | void }>) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<KycDocumentDto[]>([]);
  const [kind, setKind] = useState<"nic" | "passport">("nic");
  const [target, setTarget] = useState<KycDocumentType>("NicFront");
  const [busy, setBusy] = useState<KycDocumentType | "submit" | null>(null);

  useEffect(() => {
    listMyDocuments()
      .then((list) => {
        setDocs(list);
        if (list.some((d) => d.type === "Passport")) setKind("passport");
      })
      .catch(() => undefined);
  }, []);

  const has = (t: KycDocumentType) => docs.some((d) => d.type === t && d.status !== "Rejected");
  const idDone = kind === "nic" ? has("NicFront") && has("NicBack") : has("Passport");
  const ready = idDone && has("Selfie");

  const pick = (t: KycDocumentType) => {
    setTarget(t);
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const problem = checkFile(f, target !== "Selfie");
    if (problem) {
      toast.error("Upload failed", problem);
      return;
    }
    setBusy(target);
    try {
      const saved = await uploadDocument(target, f);
      setDocs((list) => [...list.filter((d) => d.type !== saved.type), saved]);
      toast.success("Uploaded", "Only our safety team can see this file.");
    } catch (err) {
      toast.error("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!ready) {
      toast.error("A few files are missing", kind === "nic" ? "Upload both sides of your NIC and a selfie." : "Upload your passport photo page and a selfie.");
      return;
    }
    setBusy("submit");
    try {
      await onFinish();
    } finally {
      setBusy(null);
    }
  };

  const slot = (type: KycDocumentType, label: string, hint: string) => {
    const done = has(type);
    return (
      <li key={type} className="flex items-center gap-3 rounded-lg border border-line bg-surface-card p-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", done ? "bg-success-bg text-success-fg" : "bg-brand-subtle text-icon-brand")}>
          {done ? <TickCircle size={22} color="currentColor" /> : type === "Selfie" ? <Camera size={22} color="currentColor" /> : <DocumentText size={22} color="currentColor" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-label-lg text-ink">{label}</span>
          <span className="text-body-sm text-ink-secondary">{done ? "Uploaded — waiting for review" : hint}</span>
        </span>
        <Button size="sm" variant={done ? "outline" : "primary"} onClick={() => pick(type)} disabled={busy !== null} loading={busy === type}>
          {done ? "Replace" : "Upload"}
        </Button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <CardTitle title="Verify your identity" subtitle="Every member is checked by our safety team. Your documents are private and are never shown on your profile." />
      <input
        ref={fileRef}
        type="file"
        accept={target === "Selfie" ? "image/jpeg,image/png,image/webp" : "image/jpeg,image/png,image/webp,application/pdf"}
        capture={target === "Selfie" ? "user" : undefined}
        className="hidden"
        onChange={onFile}
      />

      <SegmentedSwitch
        label="Identity document"
        options={[
          { id: "nic", label: "National ID (NIC)", Icon: Personalcard },
          { id: "passport", label: "Passport", Icon: DocumentText },
        ]}
        value={kind}
        onChange={(v) => setKind(v as "nic" | "passport")}
      />

      <ul className="flex flex-col gap-3">
        {DOCUMENT_SLOTS[kind].map((d) => slot(d.type, d.label, d.hint))}
        {slot("Selfie", "Selfie", "A clear photo of your face, no sunglasses")}
      </ul>

      <ul className="space-y-2 rounded-md bg-surface-subtle p-4 text-body-sm text-ink-secondary">
        {["JPG, PNG, WebP or PDF, up to 8 MB", "All four corners visible, no glare", "The name and photo must match your profile"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <TickCircle size={18} color="currentColor" className="text-success-fg" /> {t}
          </li>
        ))}
      </ul>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeft size={18} color="currentColor" />} className="shrink-0">
          Back
        </Button>
        <Button fullWidth onClick={submit} disabled={busy !== null} loading={busy === "submit"} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
          Submit for review
        </Button>
      </div>
    </div>
  );
}

/** Segmented switch for uploading photos or choosing an avatar. */
function PhotoModeSwitch({ value, onChange }: Readonly<{ value: "upload" | "illustration"; onChange: (v: "upload" | "illustration") => void }>) {
  return (
    <SegmentedSwitch
      label="Profile picture type"
      options={[
        { id: "upload", label: "Upload photos", Icon: Gallery },
        { id: "illustration", label: "Choose an avatar", Icon: EmojiHappy },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

/**
 * Illustration picker — flat avatars in the brand style (content/avatars.ts).
 * Large preview on the left (like the Main photo slot), options grid on the right,
 * Bride / Groom filter preset from the gender chosen in the previous step.
 */
function IllustrationPicker({ gender, value, onPick }: Readonly<{ gender?: AvatarGender; value: string | null; onPick: (uri: string, name: string) => void }>) {
  const [filter, setFilter] = useState<AvatarGender>(gender ?? "female");
  const list = AVATARS.filter((a) => a.gender === filter);
  const selected = AVATARS.find((a) => avatarDataUri(a) === value);

  return (
    <div key="illustration" className="flex animate-fade-up flex-col gap-4">
      <div className="flex items-start gap-3 rounded-md bg-info-bg p-3.5 text-body-sm text-info-fg">
        <InfoCircle size={20} color="currentColor" className="mt-px shrink-0" />
        <p>
          <span className="font-semibold">Not ready to share photos?</span> Choose an illustrated avatar for now. Members see it instead of a photo, and
          you can switch to real photos anytime from your profile.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* preview — same footprint as the Main photo slot */}
        <div className="relative flex aspect-[200/260] w-full shrink-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border-[1.5px] border-dashed border-brand-focus bg-brand-subtle sm:h-[260px] sm:w-[200px]">
          {selected ? (
            <>
              <span className="absolute left-2.5 top-2.5">
                <Badge tone="info">Avatar</Badge>
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={selected.id} src={avatarDataUri(selected)} alt={selected.name} className="h-36 w-36 animate-pop-in rounded-full shadow-lg ring-4 ring-surface-card" />
              <p className="text-label-md text-ink">{selected.name}</p>
            </>
          ) : (
            <>
              <EmojiHappy size={32} color="currentColor" className="text-brand" />
              <p className="px-4 text-center text-body-sm font-semibold text-brand">Choose an avatar</p>
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
          <div key={filter} role="radiogroup" aria-label="Avatars" className="grid grid-cols-4 gap-2.5">
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
          <p className="text-caption text-ink-tertiary">Tip: profiles with real photos get about 3× more replies. Add yours whenever you’re ready.</p>
        </div>
      </div>
    </div>
  );
}

/** "Members will see: Sanjeewa S." — updates as the member types their name or changes the format. */
function DisplayNamePreview({ format, first, last }: Readonly<{ format: string; first: string; last: string }>) {
  const hasName = !!(first.trim() || last.trim());
  const shown = format ? displayNameFor(format, first, last) : "";
  if (!format) {
    return <p className="text-body-xs text-ink-tertiary">Choose how your name appears to other members.</p>;
  }
  return (
    <div aria-live="polite" className="flex items-center gap-2.5 rounded-md bg-brand-subtle px-3 py-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-label-sm text-ink-on-brand">
        {(shown || "?").replace(/[^\p{L}]/gu, "").slice(0, 1).toUpperCase() || "?"}
      </span>
      <p className="min-w-0 text-body-sm text-ink-secondary">
        {hasName ? (
          <>
            Members will see <b className="font-bold text-ink">{shown}</b>
          </>
        ) : (
          "Enter your first and last name to see a preview"
        )}
      </p>
    </div>
  );
}
