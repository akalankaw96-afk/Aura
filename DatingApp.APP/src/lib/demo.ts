/**
 * Front-end only demo data. There is NO API in this build — every check below
 * is a mock so the prototype is fully clickable. Swap these for real API calls
 * (src/services/api.ts) when the backend is connected.
 */
export const DEMO = {
  /** Already has an account — log in works with DEMO.password */
  registeredMobile: "771234567",
  password: "Vikasitha1",
  /** Logs in but the account is suspended */
  suspendedMobile: "770000000",
  /** Registering with this number simulates "no internet / server error" */
  serverErrorMobile: "779999999",
  /** Correct verification code */
  otp: "482913",
  /** Entering this code simulates an expired code */
  expiredOtp: "000000",
  /** Card number that fails payment */
  failingCard: "4000 0000 0000 0002",
  maxLoginAttempts: 5,
  maxOtpAttempts: 3,
};

export interface RegistrationDraft {
  mobile: string;
  profileFor: string;
  fullName: string;
  gender: string;
  dob: string;
  religion: string;
  district: string;
  height: string;
  education: string;
  profession: string;
  maritalStatus: string;
  livingIn: string;
  about: string;
  photo: string | null;
  plan: "free" | "gold" | "platinum";
  reviewStatus: "submitted" | "changes" | "resubmitted" | "live";
}

const KEY = "vk_registration";

export const emptyDraft: RegistrationDraft = {
  mobile: "",
  profileFor: "Myself",
  fullName: "",
  gender: "",
  dob: "",
  religion: "",
  district: "",
  height: "",
  education: "",
  profession: "",
  maritalStatus: "",
  livingIn: "Sri Lanka",
  about: "",
  photo: null,
  plan: "free",
  reviewStatus: "submitted",
};

export function loadDraft(): RegistrationDraft {
  if (typeof window === "undefined") return emptyDraft;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...emptyDraft, ...JSON.parse(raw) } : emptyDraft;
  } catch {
    return emptyDraft;
  }
}

export function saveDraft(patch: Partial<RegistrationDraft>): RegistrationDraft {
  const next = { ...loadDraft(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode) — keep going in memory */
  }
  return next;
}

/** Age in whole years from a yyyy-mm-dd string */
export function ageFrom(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

/** Detects phone numbers / emails in free text (admins reject these in "About you"). */
export const containsContactDetails = (text: string) =>
  /(\+?\d[\d\s-]{8,}\d)|([\w.+-]+@[\w-]+\.[\w.]+)/.test(text);
