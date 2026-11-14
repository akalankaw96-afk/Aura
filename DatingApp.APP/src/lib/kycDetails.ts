"use client";

import { loadDraft, type RegistrationDraft } from "@/lib/registrationDraft";
import { SESSION_KEY } from "@/lib/session";
import type { AuthSession } from "@/services/api";
import type { ProfileKycDetails } from "@/types";

// Only keep the fields displayed as read-only. Photos, descriptions and review state have their own flows.
const DETAIL_KEYS = [
  "profileFor", "firstName", "lastName", "fullName", "displayNameFormat", "createdBy",
  "mobile", "email", "whatsapp", "whatsappCountry", "whatsappSameAsMobile",
  "dob", "gender", "height", "civilStatus", "religion", "ethnicity", "caste", "country",
  "district", "zodiacSign", "monthlySalaryRange", "weightKg",
] as const satisfies readonly (keyof RegistrationDraft)[];

type KycDetails = Pick<RegistrationDraft, typeof DETAIL_KEYS[number]>;
type Identity = Pick<AuthSession, "userId" | "profileId" | "phoneNumber" | "email">;

export function profileDetailsFromKyc(draft: RegistrationDraft): ProfileKycDetails {
  const first = draft.firstName.trim();
  const last = draft.lastName.trim();
  const initial = (name: string) => name ? `${Array.from(name)[0]}.` : "";
  const displayNames: Record<string, string> = {
    "First name only": first,
    "Last name only": last,
    "Full name": [first, last].filter(Boolean).join(" "),
    "First name and first letter of last name": [first, initial(last)].filter(Boolean).join(" "),
    "First letter of first name and full last name": [initial(first), last].filter(Boolean).join(" "),
  };
  return {
    displayName: displayNames[draft.displayNameFormat] || first || last,
    createdBy: draft.createdBy,
    civilStatus: draft.civilStatus,
    district: draft.district,
    caste: draft.caste,
    zodiacSign: draft.zodiacSign,
    monthlySalaryRange: draft.monthlySalaryRange,
    weightKg: draft.weightKg,
  };
}

function storageKey(session: Identity) {
  if (session.userId) return `vk-kyc-details:user:${session.userId}`;
  return session.profileId ? `vk-kyc-details:profile:${session.profileId}` : null;
}

const phoneDigits = (value?: string) => value?.replace(/\D/g, "").replace(/^(94|0)(?=\d{9}$)/, "");

function draftBelongsToAccount(draft: RegistrationDraft, session: Identity) {
  const phone = phoneDigits(session.phoneNumber);
  const email = session.email?.trim().toLowerCase();
  return Boolean(
    (phone && phone === phoneDigits(draft.mobile)) ||
    (email && email === draft.email.trim().toLowerCase()),
  );
}

export function saveSubmittedKycDetails(draft: RegistrationDraft, requireMatchingDraft = false) {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as Identity | null;
    if (!session || (requireMatchingDraft && !draftBelongsToAccount(draft, session))) return;
    const key = storageKey(session);
    if (!key) return;
    const details = Object.fromEntries(DETAIL_KEYS.map((field) => [field, draft[field]]));
    localStorage.setItem(key, JSON.stringify(details));
  } catch {
    // The registration draft remains available if browser storage is blocked.
  }
}

export function readSubmittedKycDetails(session: Identity | null): KycDetails | undefined {
  if (!session) return undefined;
  try {
    const key = storageKey(session);
    const stored = key && localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as KycDetails;
  } catch {}

  // Existing registrations may only have the original draft in this tab.
  const draft = loadDraft();
  return draftBelongsToAccount(draft, session) ? draft : undefined;
}
