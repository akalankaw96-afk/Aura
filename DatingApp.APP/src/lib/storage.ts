import { log } from "@/lib/log";

/**
 * Browser storage in one place (S05-T06, TD-05): every key the web app keeps in localStorage / sessionStorage is
 * listed here, and every read / write goes through these helpers. They never throw — private browsing, a full disk
 * or a server render just mean "nothing stored" (logged in development).
 *
 * What is kept: the signed-in member's session details (never a token), display preferences, small "seen it"
 * markers and the sign-up draft. Nothing here decides what a member may do — the API does (BUG-011).
 * Exception: the theme is also read by the inline script in `app/layout.tsx` (before React loads) — keep the name.
 */
export const KEYS = {
  /** signed-in member details from the API (no token) — also `SESSION_KEY` in lib/http */
  session: "aura_session",
  theme: "vk-theme",
  language: "vk-lang",
  backgroundAnimation: "vk-background-animation",
  /** toast shown after a page change (sessionStorage) */
  flashToast: "vk_flash_toast",
  /** where to go after logging in (sessionStorage) */
  returnTo: "vk-return-to",
  /** sign-up steps typed so far (sessionStorage) */
  registrationDraft: "vk_registration",
  planCardOpen: "vk-plan-card-open",
  usageCardOpen: "vk-usage-card-open",
  installDismissed: "vk-install-dismissed",
  tourStatus: "vk-tour-status",
  tourLaterAt: "vk-tour-later-at",
  feedbackState: "vk-feedback",
  feedbackSubmissions: "vk-feedback-submissions",
  contactAcceptedAt: "vk-contact-accepted-at",
  safetyEventAt: "vk-safety-event-at",
  planRenewedAt: "vk-plan-renewed-at",
  /** submitted KYC details for the signed-in member: `vk-kyc-details:user:<id>` or `…:profile:<id>` */
  kycDetailsPrefix: "vk-kyc-details:",
} as const;

/** Keys older builds wrote — removed on sign-in / sign-out so nothing stale is trusted (BUG-011, BUG-017). */
export const LEGACY_KEYS = [
  "aura_token",
  "aura_auth_user",
  "aura_review_status",
  "vk-kyc",
  "vk-plan",
  "vk-payment-pending",
  "vk-profile-hidden",
] as const;

export type StorageArea = "local" | "session";

function area(which: StorageArea): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return which === "session" ? window.sessionStorage : window.localStorage;
  } catch (err) {
    log.warn("storage unavailable", err); // e.g. blocked by browser settings
    return null;
  }
}

export const storage = {
  get(key: string, which: StorageArea = "local"): string | null {
    try {
      return area(which)?.getItem(key) ?? null;
    } catch (err) {
      log.warn(`storage read failed: ${key}`, err);
      return null;
    }
  },

  /** Returns false when the value couldn't be saved (quota, private mode). */
  set(key: string, value: string, which: StorageArea = "local"): boolean {
    try {
      const s = area(which);
      if (!s) return false;
      s.setItem(key, value);
      return true;
    } catch (err) {
      log.warn(`storage write failed: ${key}`, err);
      return false;
    }
  },

  remove(key: string, which: StorageArea = "local"): void {
    try {
      area(which)?.removeItem(key);
    } catch (err) {
      log.warn(`storage remove failed: ${key}`, err);
    }
  },

  /** Parsed JSON, or `fallback` when missing or not valid JSON. */
  getJSON<T>(key: string, fallback: T, which: StorageArea = "local"): T {
    const raw = storage.get(key, which);
    if (raw == null || raw === "") return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      log.warn(`storage value is not JSON: ${key}`, err);
      return fallback;
    }
  },

  setJSON(key: string, value: unknown, which: StorageArea = "local"): boolean {
    return storage.set(key, JSON.stringify(value), which);
  },

  clear(which: StorageArea): void {
    try {
      area(which)?.clear();
    } catch (err) {
      log.warn("storage clear failed", err);
    }
  },

  removeLegacy(): void {
    for (const k of LEGACY_KEYS) storage.remove(k);
  },
};

/** The signed-in member details the API returned (no token), or null. */
export function readSessionData<T extends object = Record<string, unknown>>(): T | null {
  return storage.getJSON<T | null>(KEYS.session, null);
}
