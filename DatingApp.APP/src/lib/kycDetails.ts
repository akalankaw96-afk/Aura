"use client";

import { KEYS, readSessionData, storage } from "@/lib/storage";
import { loadDraft, type RegistrationDraft } from "@/lib/registrationDraft";
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

/** The name other members see, for a "Display name format" choice (also used for the live preview). */
export function displayNameFor(format: string, firstName: string, lastName: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  const initial = (name: string) => (name ? `${Array.from(name)[0]}.` : "");
  const displayNames: Record<string, string> = {
    "First name only": first,
    "Last name only": last,
    "Full name": [first, last].filter(Boolean).join(" "),
    "First name and first letter of last name": [first, initial(last)].filter(Boolean).join(" "),
    "First letter of first name and full last name": [initial(first), last].filter(Boolean).join(" "),
  };
  return displayNames[format] || first || last;
}

export function profileDetailsFromKyc(draft: RegistrationDraft): ProfileKycDetails {
  return {
    displayName: displayNameFor(draft.displayNameFormat, draft.firstName, draft.lastName),
    createdBy: draft.createdBy,
    civilStatus: draft.civilStatus,
    district: draft.district,
    caste: draft.caste,
    zodiacSign: draft.zodiacSign,
    monthlySalaryRange: draft.monthlySalaryRange,
    weightKg: draft.weightKg,
    profileFor: draft.profileFor,
    // private: kept for the contact share in chat, never shown on the public profile
    whatsApp: draft.whatsapp.trim(),
  };
}

function storageKey(session: Identity) {
  if (session.userId) return `${KEYS.kycDetailsPrefix}user:${session.userId}`;
  return session.profileId ? `${KEYS.kycDetailsPrefix}profile:${session.profileId}` : null;
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
  // The registration draft remains available if browser storage is blocked.
  const session = readSessionData<Identity>();
  if (!session || (requireMatchingDraft && !draftBelongsToAccount(draft, session))) return;
  const key = storageKey(session);
  if (!key) return;
  const details = Object.fromEntries(DETAIL_KEYS.map((field) => [field, draft[field]]));
  storage.setJSON(key, details);
}

export function readSubmittedKycDetails(session: Identity | null): KycDetails | undefined {
  if (!session) return undefined;
  const key = storageKey(session);
  const stored = key ? storage.getJSON<KycDetails | null>(key, null) : null;
  if (stored) return stored;

  // Existing registrations may only have the original draft in this tab.
  const draft = loadDraft();
  return draftBelongsToAccount(draft, session) ? draft : undefined;
}
