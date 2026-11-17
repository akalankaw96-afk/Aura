"use client";

import { useEffect, useState } from "react";
import { ApiError, apiJson } from "@/lib/http";
import { hasSession, requireMember } from "@/lib/session";

/**
 * This month's plan usage, from the API (GET /api/me/usage — S03-T03). The server counts and enforces every limit;
 * the web app only shows the numbers and opens the Upgrade prompt early when a limit is clearly used up.
 *   searches     → filtered searches (plain browsing is free)
 *   profileViews → different profiles opened in full (re-opening one this month is free)
 *   interests    → interests sent
 *   chats        → new conversations started (replies are free)
 *   contactShare → asking to share phone numbers — a Gold feature (answering a request is free)
 * The admin can change every limit (Staff area → Plan limits); null = unlimited.
 */
export type UsageKind = "profileViews" | "chats" | "searches" | "interests" | "contactShare";
type MeteredKind = Exclude<UsageKind, "contactShare">;

const FEATURE_KIND: Record<string, UsageKind> = {
  Search: "searches",
  ProfileView: "profileViews",
  Interest: "interests",
  NewChat: "chats",
  ContactShare: "contactShare",
};

export const USAGE_LABEL: Record<UsageKind, { title: string; unit: string; goldTitle?: string; goldMsg?: string }> = {
  profileViews: { title: "Profile views", unit: "profile views" },
  chats: { title: "New chats", unit: "new chats" },
  searches: { title: "Searches", unit: "searches" },
  interests: { title: "Interests", unit: "interests" },
  contactShare: {
    title: "Contact sharing",
    unit: "contact requests",
    goldTitle: "Contact sharing is a Gold feature",
    goldMsg: "Upgrade to Gold to ask for phone and WhatsApp numbers. You can still accept a request someone sends you.",
  },
};

export const UPGRADE_EVENT = "vk-upgrade-prompt";
const EVENT = "vk-usage-change";

interface UsageItemDto { feature: string; used: number; limit: number | null; remaining: number | null }
interface UsageDto { planId: string; periodStart: string; resetsAt: string; items: UsageItemDto[] }

export interface UsageState {
  loaded: boolean;
  planId: string;
  unlimited: boolean;
  used: Record<MeteredKind, number>;
  /** null = unlimited */
  limits: Record<MeteredKind, number | null>;
  resetsAt: string | null;
}

const EMPTY: UsageState = {
  loaded: false,
  planId: "free",
  unlimited: false,
  used: { profileViews: 0, chats: 0, searches: 0, interests: 0 },
  limits: { profileViews: null, chats: null, searches: null, interests: null },
  resetsAt: null,
};

let state: UsageState = EMPTY;
let inflight: Promise<void> | null = null;
let lastLoad = 0;

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export const readUsageState = () => state;

/** Re-reads usage from the API (deduplicated). Signed-out → empty. */
export function refreshUsage(): Promise<void> {
  if (!hasSession()) {
    state = EMPTY;
    emit();
    return Promise.resolve();
  }
  if (inflight) return inflight;
  inflight = apiJson<UsageDto>("/me/usage", { cache: "no-store" })
    .then((dto) => {
      const next: UsageState = { ...EMPTY, used: { ...EMPTY.used }, limits: { ...EMPTY.limits } };
      next.loaded = true;
      next.planId = dto.planId;
      next.resetsAt = dto.resetsAt;
      for (const item of dto.items) {
        const kind = FEATURE_KIND[item.feature];
        if (!kind || kind === "contactShare") continue;
        next.used[kind] = item.used;
        next.limits[kind] = item.limit;
      }
      next.unlimited = dto.planId !== "free" && Object.values(next.limits).every((l) => l === null);
      state = next;
      lastLoad = Date.now();
      emit();
    })
    .catch(() => undefined) // keep the last known numbers; the server still enforces the limits
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** How many of `kind` are left this month (Infinity when unlimited or not known yet). */
export function remaining(kind: UsageKind, s: UsageState = state): number {
  if (kind === "contactShare") return s.planId === "free" ? 0 : Infinity;
  const limit = s.limits[kind];
  if (!s.loaded || limit === null) return Infinity;
  return Math.max(0, limit - s.used[kind]);
}

export function openUpgrade(kind: UsageKind) {
  window.dispatchEvent(new CustomEvent(UPGRADE_EVENT, { detail: { kind } }));
}

/** Early check before an action: false (and the Upgrade prompt) when the limit is already used up. */
export function canUse(kind: UsageKind): boolean {
  if (remaining(kind) > 0) return true;
  openUpgrade(kind);
  return false;
}

/** Signed in + not over the limit. The server makes the final decision (handle its 402 with handleLimitError). */
export function requirePaidAction(kind: UsageKind, action: string): boolean {
  return requireMember(action) && canUse(kind);
}

/**
 * A 402 from the API (LIMIT_REACHED or PLAN_REQUIRED): refresh the counters and open the Upgrade prompt.
 * Returns true when it was a plan-limit error (the caller shouldn't show another message).
 */
export function handleLimitError(err: unknown): boolean {
  if (!(err instanceof ApiError) || err.status !== 402) return false;
  const kind = FEATURE_KIND[err.extras.feature ?? ""] ?? (err.code === "PLAN_REQUIRED" ? "contactShare" : "searches");
  void refreshUsage();
  openUpgrade(kind);
  return true;
}

/** The same for chat-hub errors, which arrive as "CODE: message". */
export function handleHubLimitError(message: string): boolean {
  if (message.includes("LIMIT_REACHED")) {
    void refreshUsage();
    openUpgrade("chats");
    return true;
  }
  if (message.includes("PLAN_REQUIRED")) {
    openUpgrade("contactShare");
    return true;
  }
  return false;
}

/** Searches and profile views both used up → browsing stops until the 1st (or an upgrade). */
export function allSearchLimitsExhausted(s: UsageState = state) {
  return s.loaded && remaining("searches", s) === 0 && remaining("profileViews", s) === 0;
}

export function useUsage() {
  const [usage, setUsage] = useState<UsageState>(state);
  useEffect(() => {
    const update = () => setUsage(state);
    const reload = () => {
      if (Date.now() - lastLoad > 30_000) void refreshUsage();
    };
    const onAuth = () => void refreshUsage();
    update();
    if (!state.loaded || Date.now() - lastLoad > 30_000) void refreshUsage();
    window.addEventListener(EVENT, update);
    window.addEventListener("vk-plan-change", onAuth);
    window.addEventListener("aura_auth_change", onAuth);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("vk-plan-change", onAuth);
      window.removeEventListener("aura_auth_change", onAuth);
      window.removeEventListener("focus", reload);
    };
  }, []);
  return {
    usage,
    unlimited: usage.unlimited,
    loaded: usage.loaded,
    left: (k: UsageKind) => remaining(k, usage),
    limit: (k: MeteredKind) => usage.limits[k],
    used: (k: MeteredKind) => usage.used[k],
  };
}
