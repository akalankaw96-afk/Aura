/**
 * Forgot-password journey: send code → verify code → set new password (S01-T16).
 *
 *   POST /api/auth/forgot-password         { channel, value }        → 202 (always, even if unknown)
 *   POST /api/auth/forgot-password/verify  { channel, value, code }  → { resetToken } | 400 { code, attemptsLeft }
 *   POST /api/auth/reset-password          { resetToken, newPassword } → 204
 *
 * Errors are RFC 7807 ProblemDetails: `title` is the member-facing message, `code` the machine-readable reason.
 */
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Problem {
  title?: string;
  code?: string;
  attemptsLeft?: number;
}

async function post(path: string, body: unknown): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("We couldn’t reach Vikasitha. Check your connection and try again.");
  }
}

async function fail(res: Response, fallback: string): Promise<never> {
  const problem: Problem = await res.json().catch(() => ({}));
  throw new Error(problem.title || fallback);
}

/**
 * Sends a reset code. Resolves the same way whether or not the account exists,
 * so the screen never reveals who is registered (member privacy).
 */
export async function requestResetCode(channel: ResetChannel, value: string): Promise<void> {
  const res = await post("/auth/forgot-password", { channel, value: value.trim() });
  if (!res.ok) await fail(res, "We couldn’t send a code. Please try again.");
}

export async function verifyResetCode(channel: ResetChannel, value: string, code: string): Promise<VerifyResult> {
  const res = await post("/auth/forgot-password/verify", { channel, value: value.trim(), code });
  if (res.ok) {
    const data: { resetToken: string } = await res.json();
    return { ok: true, resetToken: data.resetToken };
  }
  if (res.status !== 400) await fail(res, "We couldn’t check the code. Please try again.");

  const problem: Problem = await res.json().catch(() => ({}));
  const attemptsLeft = problem.attemptsLeft ?? 0;
  switch (problem.code) {
    case "CODE_EXPIRED":
      return { ok: false, reason: "expired", attemptsLeft };
    case "TOO_MANY_ATTEMPTS":
      return { ok: false, reason: "too-many", attemptsLeft: 0 };
    case "CODE_INVALID":
      return { ok: false, reason: attemptsLeft === 0 ? "too-many" : "incorrect", attemptsLeft };
    default:
      throw new Error(problem.title || "Check the code and try again.");
  }
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  const res = await post("/auth/reset-password", { resetToken, newPassword });
  if (!res.ok) await fail(res, "We couldn’t update your password. Please start again.");
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
