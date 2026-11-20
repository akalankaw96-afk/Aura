import { KEYS, storage } from "@/lib/storage";
/**
 * Registration draft: what the member has typed so far in the sign-up steps, kept in sessionStorage so a
 * refresh doesn't lose it. Submitted to the API on the last step (POST /api/profiles).
 */

export interface RegistrationDraft {
  mobile: string;
  /** Account step chips: Myself / Son / Daughter … */
  profileFor: string;
  // ── Profile step (Figma 04 Register — 3 Profile) ──
  firstName: string;
  lastName: string;
  /** derived: first + last (kept for screens that show the full name) */
  fullName: string;
  displayNameFormat: string;
  createdBy: string;
  email: string;
  /** WhatsApp number (digits only, no country code) — shared only after a match accepts */
  whatsapp: string;
  /** dial country for the WhatsApp number, e.g. "lk" */
  whatsappCountry: string;
  /** legacy: the "same as my mobile" option was removed (2026-11-16); always false for new drafts */
  whatsappSameAsMobile: boolean;
  height: string;
  /** free text, e.g. "Software engineer" */
  profession: string;
  /** one of PROFESSION_CATEGORIES (API enum) */
  professionCategory: string;
  /** highest education, e.g. "Bachelor's degree" */
  education: string;
  /** yyyy-mm-dd, built from the Year / Month / Day selects */
  dob: string;
  gender: string;
  civilStatus: string;
  religion: string;
  ethnicity: string;
  caste: string;
  country: string;
  district: string;
  zodiacSign: string;
  monthlySalaryRange: string;
  weightKg: string;
  about: string;
  photo: string | null;
  plan: "free" | "gold" | "platinum";
  reviewStatus: "submitted" | "changes" | "resubmitted" | "live";
}

const KEY = KEYS.registrationDraft;

export const emptyDraft: RegistrationDraft = {
  mobile: "",
  profileFor: "Myself",
  firstName: "",
  lastName: "",
  fullName: "",
  displayNameFormat: "",
  createdBy: "",
  email: "",
  whatsapp: "",
  whatsappCountry: "lk",
  whatsappSameAsMobile: false,
  height: "",
  profession: "",
  professionCategory: "",
  education: "",
  dob: "",
  gender: "",
  civilStatus: "",
  religion: "",
  ethnicity: "",
  caste: "",
  country: "Sri Lanka",
  district: "",
  zodiacSign: "",
  monthlySalaryRange: "",
  weightKg: "",
  about: "",
  photo: null,
  plan: "free",
  reviewStatus: "submitted",
};

export function loadDraft(): RegistrationDraft {
  return { ...emptyDraft, ...storage.getJSON<Partial<RegistrationDraft>>(KEY, {}, "session") };
}

/** After the profile is submitted: the server has everything, so the browser copy is dropped. */
export function clearDraft(): void {
  storage.remove(KEY, "session");
}

export function saveDraft(patch: Partial<RegistrationDraft>): RegistrationDraft {
  const next = { ...loadDraft(), ...patch };
  storage.setJSON(KEY, next, "session"); // private mode: keeps going in memory
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
