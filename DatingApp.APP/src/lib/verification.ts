"use client";

import { useCallback, useEffect, useState } from "react";
import { saveDraft } from "@/lib/demo";

/**
 * Profile verification (KYC) state for a newly registered member.
 *   pending      → profile submitted, safety team reviewing
 *   changes      → review rejected some fields — member must fix & resubmit
 *   resubmitted  → fixes sent, waiting again
 *   live         → approved: every feature unlocked
 * Demo: stored in localStorage (no API yet). `/dashboard?kyc=pending|changes|live` previews a state.
 * TODO(api): read this from the member's profile status (PendingAdminApproval / Published).
 */
export type KycStatus = "pending" | "changes" | "resubmitted" | "live";

const KEY = "vk-kyc";
const EVENT = "vk-kyc-change";

export function readKyc(): KycStatus {
  if (typeof window === "undefined") return "live";
  try {
    const q = new URLSearchParams(window.location.search).get("kyc");
    if (q === "pending" || q === "changes" || q === "resubmitted" || q === "live") return q;
    const v = localStorage.getItem(KEY);
    return v === "pending" || v === "changes" || v === "resubmitted" ? v : "live";
  } catch {
    return "live";
  }
}

export function setKyc(status: KycStatus) {
  try {
    if (status === "live") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, status);
    // keep the registration review screen (/register/status) in step
    saveDraft({ reviewStatus: status === "pending" ? "submitted" : status });
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function useKyc() {
  const [status, setStatus] = useState<KycStatus>("live");
  useEffect(() => {
    const update = () => setStatus(readKyc());
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const set = useCallback((s: KycStatus) => {
    // drop a ?kyc= preview param so the new state sticks
    if (typeof window !== "undefined" && window.location.search.includes("kyc=")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("kyc");
      window.history.replaceState(null, "", url.toString());
    }
    setKyc(s);
  }, []);
  return { status, locked: status !== "live", setStatus: set };
}

/* ------------------------------------------------------------------ */
/* Membership plan — free members get limited features, paid get all   */
/* ------------------------------------------------------------------ */
export type Plan = "free" | "gold" | "platinum";
const PLAN_KEY = "vk-plan";
const PLAN_EVENT = "vk-plan-change";

export function readPlan(): Plan {
  if (typeof window === "undefined") return "free";
  try {
    const q = new URLSearchParams(window.location.search).get("plan");
    if (q === "free" || q === "gold" || q === "platinum") return q;
    const v = localStorage.getItem(PLAN_KEY);
    return v === "gold" || v === "platinum" ? v : "free";
  } catch {
    return "free";
  }
}

export function setPlan(plan: Plan) {
  try {
    if (plan === "free") localStorage.removeItem(PLAN_KEY);
    else localStorage.setItem(PLAN_KEY, plan);
  } catch {}
  window.dispatchEvent(new Event(PLAN_EVENT));
}

/**
 * Everything a page needs to decide what a member can use:
 *  locked  → profile not approved yet (KYC pending / changes)
 *  isPaid  → Gold / Platinum: every feature
 */
export function useAccess() {
  const kyc = useKyc();
  const [plan, setP] = useState<Plan>("free");
  useEffect(() => {
    const update = () => setP(readPlan());
    update();
    window.addEventListener(PLAN_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(PLAN_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return { ...kyc, plan, isPaid: plan !== "free", setPlan };
}
