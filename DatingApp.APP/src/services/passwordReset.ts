/**
 * Forgot-password journey: send code → verify code → set new password.
 *
 * DEMO ADAPTER — there is no reset API yet (planned: S01-T03/T05, see docs/API_GUIDELINES.md).
 * Each function below maps 1:1 to the planned endpoint, so connecting the API means
 * replacing the body of these three functions only — the screen does not change.
 *
 *   POST /api/auth/forgot-password         { channel, value }        → 202 (always, even if unknown)
 *   POST /api/auth/forgot-password/verify  { channel, value, code }  → { resetToken } | 400 { code, attemptsLeft }
 *   POST /api/auth/reset-password          { resetToken, newPassword } → 204
 */
import { DEMO } from "@/lib/demo";

export type ResetChannel = "email" | "phone";

export const RESET_RULES = {
  codeLength: 6,
  resendSeconds: 60,
  maxAttempts: 5,
  maxResends: 3,
} as const;

export type VerifyResult =
  | { ok: true; resetToken: string }
  | { ok: false; reason: "incorrect" | "expired" | "too-many"; attemptsLeft: number };

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/** Demo-only memory of failed attempts for the current code. */
let failedAttempts = 0;

const isKnownAccount = (channel: ResetChannel, value: string) =>
  channel === "phone"
    ? value === DEMO.registeredMobile || value === DEMO.suspendedMobile
    : value.trim().toLowerCase() === DEMO.registeredEmail;

/**
 * Sends a reset code. Resolves the same way whether or not the account exists,
 * so the screen never reveals who is registered (member privacy).
 */
export async function requestResetCode(_channel: ResetChannel, _value: string): Promise<void> {
  await wait(600);
  failedAttempts = 0;
}

export async function verifyResetCode(channel: ResetChannel, value: string, code: string): Promise<VerifyResult> {
  await wait(500);
  if (failedAttempts >= RESET_RULES.maxAttempts) return { ok: false, reason: "too-many", attemptsLeft: 0 };
  if (code === DEMO.expiredOtp) return { ok: false, reason: "expired", attemptsLeft: RESET_RULES.maxAttempts - failedAttempts };
  if (isKnownAccount(channel, value) && code === DEMO.otp) {
    failedAttempts = 0;
    return { ok: true, resetToken: "demo-reset-token" };
  }
  failedAttempts += 1;
  const attemptsLeft = Math.max(0, RESET_RULES.maxAttempts - failedAttempts);
  return { ok: false, reason: attemptsLeft === 0 ? "too-many" : "incorrect", attemptsLeft };
}

export async function resetPassword(_resetToken: string, _newPassword: string): Promise<void> {
  await wait(600);
}

/** "+94 77 ••• ••67" / "de•••@auramatrimony.lk" — shown on the code step. */
export function maskIdentifier(channel: ResetChannel, value: string): string {
  if (channel === "phone") {
    const d = value.replace(/\D/g, "");
    return `+94 ${d.slice(0, 2)} ••• ••${d.slice(-2)}`;
  }
  const [local = "", domain = ""] = value.trim().split("@");
  return `${local.slice(0, 2)}•••@${domain}`;
}
