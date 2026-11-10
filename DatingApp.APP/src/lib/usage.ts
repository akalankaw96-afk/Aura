"use client";

import { useEffect, useState } from "react";
import { readPlan } from "@/lib/verification";
import { hasSession, requireMember } from "@/lib/session";

/**
 * Free-plan usage limits (per calendar month). Paid members (Gold / Platinum) are unlimited.
 *   messages  → messages sent in chat
 *   searches  → searches run (filters / sort applied on the Search page)
 *   interests → interests sent ("add friend")
 *   profileViews → different profiles opened in full (re-opening one already seen this month is free)
 * When a free member hits a limit, `consume()` returns false and opens the Upgrade prompt.
 * Demo: counts are kept in localStorage. TODO(api): enforce on the server.
 */
export type UsageKind = "profileViews" | "chats" | "messages" | "searches" | "interests";

export const FREE_LIMITS: Record<UsageKind, number> = {
  profileViews: 5,
  chats: 0,
  messages: 0,
  searches: 3,
  interests: 0,
};

export const USAGE_LABEL: Record<UsageKind, { title: string; unit: string; limitReachedTitle?: string; limitReachedMsg?: string }> = {
  profileViews: {
    title: "Profile views",
    unit: "profile views",
    limitReachedTitle: "You’ve viewed your 5 free profiles",
    limitReachedMsg: "Free members can open 5 profiles a month — your allowance resets on the 1st. Upgrade to view unlimited profiles right now.",
  },
  chats: {
    title: "Free Chat Connections",
    unit: "connections",
    limitReachedTitle: "Chat is a Gold feature",
    limitReachedMsg: "Upgrade to Gold to connect and chat with members.",
  },
  messages: {
    title: "Messages",
    unit: "messages",
    limitReachedTitle: "Messaging is a Gold feature",
    limitReachedMsg: "You can still view profile details with your free allowance. Upgrade to Gold to send messages.",
  },
  searches: { title: "Searches", unit: "searches" },
  interests: {
    title: "Interest requests",
    unit: "interests",
    limitReachedTitle: "Interest requests are a Gold feature",
    limitReachedMsg: "Upgrade to Gold to send and respond to interest requests.",
  },
};

const KEY = "vk-usage";
const EVENT = "vk-usage-change";
export const UPGRADE_EVENT = "vk-upgrade-prompt";

type Usage = Record<UsageKind, number> & { month: string };

const thisMonth = () => new Date().toISOString().slice(0, 7);
const empty = (): Usage => ({
  month: thisMonth(),
  profileViews: 0,
  chats: 0,
  messages: 0,
  searches: 0,
  interests: 0,
});

export function readUsage(): Usage {
  if (typeof window === "undefined") return empty();
  try {
    const u = JSON.parse(localStorage.getItem(KEY) || "null") as Usage | null;
    return u && u.month === thisMonth() ? { ...empty(), ...u } : empty(); // resets every month
  } catch {
    return empty();
  }
}

function write(u: Usage) {
  try {
    localStorage.setItem(KEY, JSON.stringify(u));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export const isUnlimited = () => readPlan() !== "free";

const SEARCH_LIMITS = ["searches", "profileViews"] as const;

export function exhaustedSearchLimit(usage = readUsage(), unlimited = isUnlimited()) {
  if (unlimited) return undefined;
  return SEARCH_LIMITS.find((kind) => usage[kind] >= FREE_LIMITS[kind]);
}

export function allSearchLimitsExhausted(usage = readUsage(), unlimited = isUnlimited()) {
  return !unlimited && SEARCH_LIMITS.every((kind) => usage[kind] >= FREE_LIMITS[kind]);
}

/** How many of `kind` a free member has left this month (Infinity for paid members). */
export function remaining(kind: UsageKind) {
  if (isUnlimited()) return Infinity;
  return Math.max(0, FREE_LIMITS[kind] - readUsage()[kind]);
}

/**
 * Use one of `kind`. Returns true if allowed (and counts it);
 * false when the free limit is reached — the Upgrade prompt opens.
 */
export function consume(kind: UsageKind): boolean {
  if (isUnlimited()) return true;
  const u = readUsage();
  if (u[kind] >= FREE_LIMITS[kind]) {
    window.dispatchEvent(new CustomEvent(UPGRADE_EVENT, { detail: { kind } }));
    return false;
  }
  write({ ...u, [kind]: u[kind] + 1 });
  return true;
}

export function requirePaidAction(kind: "messages" | "interests", action: string): boolean {
  return requireMember(action) && consume(kind);
}

/**
 * Open a profile in full. Free members can view FREE_LIMITS.profileViews different profiles a month;
 * re-opening one they already viewed this month doesn't count. Guests aren't counted here
 * (their actions are gated by the login popup). Returns false (and opens the Upgrade prompt) at the limit.
 */
const VIEWED_KEY = "vk-viewed";
export function consumeProfileView(id: string): boolean {
  if (!hasSession() || isUnlimited()) return true;
  let viewed: { month: string; ids: string[] } = { month: thisMonth(), ids: [] };
  try {
    const v = JSON.parse(localStorage.getItem(VIEWED_KEY) || "null");
    if (v?.month === thisMonth() && Array.isArray(v.ids)) viewed = v;
  } catch {}
  if (viewed.ids.includes(id)) return true;
  if (!consume("profileViews")) return false;
  try {
    localStorage.setItem(VIEWED_KEY, JSON.stringify({ month: viewed.month, ids: [...viewed.ids, id] }));
  } catch {}
  return true;
}

/** Demo helper: reset this month's counts */
export const resetUsage = () => {
  try {
    localStorage.removeItem(VIEWED_KEY);
  } catch {}
  write(empty());
};

export function useUsage() {
  const [usage, setUsage] = useState<Usage>(empty());
  const [unlimited, setUnlimited] = useState(false);
  useEffect(() => {
    const update = () => {
      setUsage(readUsage());
      setUnlimited(isUnlimited());
    };
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("vk-plan-change", update);
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("vk-plan-change", update);
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
    };
  }, []);
  const left = (k: UsageKind) => (unlimited ? Infinity : Math.max(0, FREE_LIMITS[k] - usage[k]));
  return { usage, unlimited, left };
}
