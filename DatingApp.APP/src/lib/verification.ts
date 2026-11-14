"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/services/api";

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

const SESSION_KEY = "aura_session";
const KYC_EVENT = "vk-kyc-change";
const PLAN_EVENT = "vk-plan-change";

interface SessionFlags {
  isVerified?: boolean;
  isUnderReview?: boolean;
  hasCompletedProfile?: boolean;
  isPremium?: boolean;
  planId?: string;
}

function readSession(): SessionFlags | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionFlags) : null;
  } catch {
    return null;
  }
}

/** Not signed in or not approved → "pending" (never assume approved — BUG-012). */
export function readKyc(): KycStatus {
  const s = readSession();
  return s?.isVerified === true ? "live" : "pending";
}

/**
 * After the member submits their profile: mark the cached session as "under review" so the dashboard
 * shows the review panel straight away. Can't approve anything — approval only comes from the server.
 */
export function setKyc(status: "pending" | "resubmitted") {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, isUnderReview: true, isVerified: false, hasCompletedProfile: true, kycStatus: status }));
    }
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(KYC_EVENT));
}

export function readPlan(): Plan {
  const s = readSession();
  if (!s?.isPremium) return "free";
  return s.planId === "platinum" ? "platinum" : "gold";
}

/** Plan start / expiry. The API doesn't return subscriptions yet (Sprint 04), so this is null for now. */
export interface MembershipInfo {
  plan: Exclude<Plan, "free">;
  start: Date;
  expires: Date;
  totalDays: number;
  daysLeft: number;
  months: number;
}
export function readMembership(): MembershipInfo | null {
  return null;
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
