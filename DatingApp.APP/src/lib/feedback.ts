"use client";

import { FRIENDS } from "@/content/dashboard";
import { readKyc, readMembership } from "@/lib/verification";

/**
 * Feedback popup rules (paid members only). Demo: stored in localStorage until the API exists.
 * Planned API: POST /api/feedback { type, rating, tags, message, publicOk, story? } → { reference }.
 *
 * Shows automatically on the dashboard only after a "happy moment":
 *   contact  → 3 days after a contact share was accepted
 *   upgrade  → 14 days after paying, with at least 1 accepted interest (friend)
 *   renewal  → after the plan was renewed / extended
 * Never: first 3 days after paying · 7 days after a report / block · "Don't ask again".
 * At most once every 30 days; no automatic popup for 6 months after sending feedback.
 */
export type FeedbackStep = "rate" | "story";
export type FeedbackMoment = "contact" | "upgrade" | "renewal";

export const FEEDBACK_EVENT = "vk-feedback-open";
const STATE_KEY = "vk-feedback";
const SUBMISSIONS_KEY = "vk-feedback-submissions";
const CONTACT_KEY = "vk-contact-accepted-at";
const SAFETY_KEY = "vk-safety-event-at";
export const RENEWED_KEY = "vk-plan-renewed-at";

const DAY = 86_400_000;

interface FeedbackState {
  lastShownAt?: string;
  dontAsk?: boolean;
  submittedAt?: string;
}

export interface FeedbackSubmission {
  reference: string;
  type: "review" | "private" | "story";
  rating?: number;
  tags?: string[];
  message?: string;
  publicOk?: boolean;
  story?: { name: string; partner: string; date: string; city: string; text: string; photos: number };
  createdAt: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
const since = (iso?: string | null) => (iso ? (Date.now() - new Date(iso).getTime()) / DAY : Infinity);

/** Opens the popup (any page). "story" jumps straight to the success-story form. */
export function openFeedback(step: FeedbackStep = "rate") {
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail: { step, manual: true } }));
}

/** Call when a contact share becomes "accepted" (first time only). */
export function markContactAccepted() {
  try {
    if (!localStorage.getItem(CONTACT_KEY)) write(CONTACT_KEY, new Date().toISOString());
  } catch {}
}

/** Call after the member reports or blocks someone. */
export function markSafetyEvent() {
  write(SAFETY_KEY, new Date().toISOString());
}

export function markFeedbackShown() {
  write(STATE_KEY, { ...readJson<FeedbackState>(STATE_KEY, {}), lastShownAt: new Date().toISOString() });
}

export function dontAskFeedbackAgain() {
  write(STATE_KEY, { ...readJson<FeedbackState>(STATE_KEY, {}), dontAsk: true });
}

export function saveFeedback(sub: Omit<FeedbackSubmission, "reference" | "createdAt">): FeedbackSubmission {
  const now = new Date();
  const ref = `VK-${String(now.getDate()).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const full: FeedbackSubmission = { ...sub, reference: ref, createdAt: now.toISOString() };
  write(SUBMISSIONS_KEY, [full, ...readJson<FeedbackSubmission[]>(SUBMISSIONS_KEY, [])].slice(0, 20));
  if (sub.type !== "story") write(STATE_KEY, { ...readJson<FeedbackState>(STATE_KEY, {}), submittedAt: full.createdAt });
  return full;
}

/** Which happy moment (if any) allows the automatic popup right now. */
export function feedbackDue(): FeedbackMoment | null {
  if (readKyc() !== "live") return null;
  const m = readMembership();
  if (!m) return null; // Free plan

  const state = readJson<FeedbackState>(STATE_KEY, {});
  if (state.dontAsk) return null;
  if (since(state.submittedAt) < 180) return null;
  if (since(state.lastShownAt) < 30) return null;

  const paidDays = since(m.start.toISOString());
  if (paidDays < 3) return null;
  if (since(readJson<string | null>(SAFETY_KEY, null)) < 7) return null;

  const contact = readJson<string | null>(CONTACT_KEY, null);
  if (contact && since(contact) >= 3) return "contact";

  const renewed = readJson<string | null>(RENEWED_KEY, null);
  if (renewed && (!state.lastShownAt || new Date(renewed) > new Date(state.lastShownAt))) return "renewal";

  if (paidDays >= 14 && FRIENDS.length > 0) return "upgrade";
  return null;
}

/** Demo only: clears the popup history so it can be tried again. */
export function resetFeedbackDemo() {
  try {
    [STATE_KEY, CONTACT_KEY, SAFETY_KEY, RENEWED_KEY].forEach((k) => localStorage.removeItem(k));
  } catch {}
}
