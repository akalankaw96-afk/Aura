/**
 * Account settings: take a break (hide profile) and delete account with an SMS code.
 *
 * Endpoints (S04-T08):
 *   POST /api/account/visibility            { hidden: boolean, reason? }        → 204
 *   POST /api/account/delete/send-code      {}                                  → { resendAvailableInSeconds }
 *   POST /api/account/delete                { code, reason, comment? }          → 204 | 400 { code, attemptsLeft }
 * The "hidden" flag comes from the session (profileHidden), so every device agrees.
 * An API without these endpoints (404) still switches to the labelled demo in development builds only.
 */
import { SESSION_KEY, apiRequest } from "@/lib/http";
import { apiService } from "@/services/api";

export const DELETE_RULES = { codeLength: 6, resendSeconds: 60, maxAttempts: 5 } as const;
export const DEMO_CODE = "123456";
const DEV = process.env.NODE_ENV !== "production";

export type DeleteVerify = { ok: true } | { ok: false; reason: "incorrect" | "expired" | "too-many"; attemptsLeft: number };

interface Problem {
  title?: string;
  code?: string;
  attemptsLeft?: number;
}

export class NotAvailableYet extends Error {
  constructor() {
    super("Deleting your account here isn’t available yet. Please contact support and we’ll do it for you.");
  }
}

async function post(path: string, body: unknown): Promise<Response | "demo"> {
  let res: Response;
  try {
    res = await apiRequest(path, { method: "POST", json: body });
  } catch (e) {
    if (DEV) return "demo";
    throw e;
  }
  if (res.status === 404 || res.status === 405) {
    if (DEV) return "demo";
    throw new NotAvailableYet();
  }
  return res;
}

async function fail(res: Response, fallback: string): Promise<never> {
  const p: Problem = await res.json().catch(() => ({}));
  throw new Error(p.title || fallback);
}

/** Hide or show the profile in search ("take a break"). Chats and friends are kept. */
export async function setProfileHidden(hidden: boolean, reason?: string): Promise<{ demo: boolean }> {
  const res = await post("/account/visibility", { hidden, reason });
  if (res !== "demo" && !res.ok) await fail(res, "We couldn’t update your profile. Please try again.");
  if (res !== "demo") await apiService.refreshSession(); // session.profileHidden follows the server
  window.dispatchEvent(new Event("vk-visibility-change"));
  return { demo: res === "demo" };
}

/** From the session the API returned (login / refresh / GET /auth/me). */
export function readProfileHidden(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}") as { profileHidden?: boolean };
    return s.profileHidden === true;
  } catch {
    return false;
  }
}

/** Sends the SMS code to the member's verified mobile. `demo: true` = server endpoint not built yet (dev only). */
export async function sendDeleteCode(): Promise<{ demo: boolean; resendSeconds: number }> {
  const res = await post("/account/delete/send-code", {});
  if (res === "demo") return { demo: true, resendSeconds: DELETE_RULES.resendSeconds };
  if (!res.ok) await fail(res, "We couldn’t send the code. Please try again.");
  const data: { resendAvailableInSeconds?: number } = await res.json().catch(() => ({}));
  return { demo: false, resendSeconds: data.resendAvailableInSeconds ?? DELETE_RULES.resendSeconds };
}

let demoAttempts: number = DELETE_RULES.maxAttempts;

export async function confirmDelete(code: string, reason: string, comment: string, demo: boolean): Promise<DeleteVerify> {
  if (demo) {
    await new Promise((r) => setTimeout(r, 600));
    if (code === DEMO_CODE) return { ok: true };
    demoAttempts -= 1;
    return demoAttempts <= 0 ? { ok: false, reason: "too-many", attemptsLeft: 0 } : { ok: false, reason: "incorrect", attemptsLeft: demoAttempts };
  }
  const res = await post("/account/delete", { code, reason, comment: comment.trim() || undefined });
  if (res === "demo") return code === DEMO_CODE ? { ok: true } : { ok: false, reason: "incorrect", attemptsLeft: DELETE_RULES.maxAttempts - 1 };
  if (res.ok) return { ok: true };
  if (res.status !== 400) await fail(res, "We couldn’t check the code. Please try again.");
  const p: Problem = await res.json().catch(() => ({}));
  const left = p.attemptsLeft ?? 0;
  if (p.code === "CODE_EXPIRED") return { ok: false, reason: "expired", attemptsLeft: left };
  if (p.code === "TOO_MANY_ATTEMPTS" || left === 0) return { ok: false, reason: "too-many", attemptsLeft: 0 };
  return { ok: false, reason: "incorrect", attemptsLeft: left };
}

export function resetDemoAttempts() {
  demoAttempts = DELETE_RULES.maxAttempts;
}
