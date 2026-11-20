"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { getMySubscription, type MySubscription } from "@/lib/billing";
import { KEYS, readSessionData, storage } from "@/lib/storage";

/**
 * Profile verification (KYC) status and membership plan — read ONLY from the session the API returned
 * (login / register / refresh / GET /auth/me). Nothing here can be changed from the browser (BUG-011).
 *   pending      → profile submitted (or not yet), safety team reviewing
 *   changes      → review rejected some fields (needs the KYC API, Sprint 02 — not returned yet)
 *   resubmitted  → fixes sent, waiting again
 *   live         → approved: every feature unlocked
 */
export type KycStatus = "pending" | "changes" | "resubmitted" | "live";
export type Plan = "free" | "gold" | "platinum";

const KYC_EVENT = "vk-kyc-change";
const PLAN_EVENT = "vk-plan-change";

interface SessionFlags {
  /** Draft · Submitted · ChangesRequested · Resubmitted · Approved · Suspended (Sprint 02) */
  profileStatus?: string;
  isVerified?: boolean;
  isUnderReview?: boolean;
  hasCompletedProfile?: boolean;
  isPremium?: boolean;
  planId?: string;
}

function readSession(): SessionFlags | null {
  return readSessionData<SessionFlags>();
}

/** Not signed in or not approved → "pending" (never assume approved — BUG-012). */
export function readKyc(): KycStatus {
  const s = readSession();
  switch (s?.profileStatus) {
    case "Approved":
      return "live";
    case "ChangesRequested":
      return "changes";
    case "Resubmitted":
      return "resubmitted";
    default:
      return s?.isVerified === true ? "live" : "pending";
  }
}

/**
 * After the member submits their profile: mark the cached session as "under review" so the dashboard
 * shows the review panel straight away. Can't approve anything — approval only comes from the server.
 */
export function setKyc(status: "pending" | "resubmitted") {
  const s = readSessionData();
  if (s) storage.setJSON(KEYS.session, { ...s, isUnderReview: true, isVerified: false, hasCompletedProfile: true, kycStatus: status });
  window.dispatchEvent(new Event(KYC_EVENT));
}

export function readPlan(): Plan {
  const s = readSession();
  if (!s?.isPremium) return "free";
  return s.planId === "platinum" ? "platinum" : "gold";
}

/** The paid plan running now, from GET /api/me/subscription (S04-T06). */
export interface MembershipInfo {
  plan: Exclude<Plan, "free">;
  /** start of the period running now */
  start: Date;
  /** end of the last period bought (renewals included) */
  expires: Date;
  totalDays: number;
  daysLeft: number;
  /** length of the period running now */
  months: number;
  /** a renewal is already bought */
  renewed: boolean;
}

const MEMBERSHIP_EVENT = "vk-membership-change";
let membership: MembershipInfo | null = null;

function toMembership(s: MySubscription): MembershipInfo | null {
  if (s.planId === "free" || !s.endsAt) return null;
  const now = Date.now();
  const current = s.items.find((i) => i.status === "Active" && i.planId === s.planId && new Date(i.startsAt).getTime() <= now);
  if (!current) return null;
  const start = new Date(current.startsAt);
  const expires = new Date(s.endsAt);
  const day = 86_400_000;
  return {
    plan: s.planId,
    start,
    expires,
    totalDays: Math.max(1, Math.round((expires.getTime() - start.getTime()) / day)),
    daysLeft: s.daysLeft,
    months: Math.max(1, Math.round((new Date(current.endsAt).getTime() - start.getTime()) / (30.44 * day))),
    renewed: s.items.some((i) => i.status === "Upcoming"),
  };
}

/** Last membership loaded from the API (null for Free, or until it has loaded). */
export function readMembership(): MembershipInfo | null {
  return membership;
}

/** GET /api/me/subscription → membership (also kept for readMembership()). */
export async function loadMembership(): Promise<MembershipInfo | null> {
  try {
    membership = toMembership(await getMySubscription());
  } catch {
    membership = null;
  }
  window.dispatchEvent(new Event(MEMBERSHIP_EVENT));
  return membership;
}

/** The member's paid plan from the API; reloads when the session's plan changes. */
export function useMembership(): { membership: MembershipInfo | null; loaded: boolean } {
  const { isPaid, plan } = useAccess();
  const [state, setState] = useState<{ membership: MembershipInfo | null; loaded: boolean }>({ membership: null, loaded: false });
  useEffect(() => {
    if (!isPaid) {
      membership = null;
      setState({ membership: null, loaded: true });
      return;
    }
    let alive = true;
    void loadMembership().then((m) => {
      if (alive) setState({ membership: m, loaded: true });
    });
    return () => {
      alive = false;
    };
  }, [isPaid, plan]);
  return state;
}

function useSessionValue<T>(read: () => T, initial: T, events: string[]): T {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    const update = () => setValue(read());
    update();
    for (const e of [...events, "storage", "aura_auth_change"]) window.addEventListener(e, update);
    return () => {
      for (const e of [...events, "storage", "aura_auth_change"]) window.removeEventListener(e, update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

/** Ask the server for the latest status once per page load (approval can happen while the member is away). */
let refreshed = false;
function refreshOnce() {
  if (refreshed || typeof window === "undefined") return;
  refreshed = true;
  void apiService.refreshSession();
}

export function useKyc() {
  useEffect(refreshOnce, []);
  const status = useSessionValue(readKyc, "pending" as KycStatus, [KYC_EVENT]);
  return { status, locked: status !== "live" };
}

/**
 * Everything a page needs to decide what a member can use:
 *  locked  → profile not approved yet
 *  isPaid  → Gold / Platinum
 */
export function useAccess() {
  const kyc = useKyc();
  const plan = useSessionValue(readPlan, "free" as Plan, [PLAN_EVENT]);
  return { ...kyc, plan, isPaid: plan !== "free" };
}
