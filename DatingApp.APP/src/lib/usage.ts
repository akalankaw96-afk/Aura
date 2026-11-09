"use client";

import { useEffect, useState } from "react";
import { readPlan } from "@/lib/verification";

/**
 * Free-plan usage limits (per calendar month). Paid members (Gold / Platinum) are unlimited.
 *   messages  → messages sent in chat
 *   searches  → searches run (filters / sort applied on the Search page)
 *   interests → interests sent ("add friend")
 * When a free member hits a limit, `consume()` returns false and opens the Upgrade prompt.
 * Demo: counts are kept in localStorage. TODO(api): enforce on the server.
 */
export type UsageKind = "messages" | "searches" | "interests";

export const FREE_LIMITS: Record<UsageKind, number> = { messages: 5, searches: 3, interests: 3 };

export const USAGE_LABEL: Record<UsageKind, { title: string; unit: string }> = {
  messages: { title: "Messages", unit: "messages" },
  searches: { title: "Searches", unit: "searches" },
  interests: { title: "Interests", unit: "interests" },
};

const KEY = "vk-usage";
const EVENT = "vk-usage-change";
export const UPGRADE_EVENT = "vk-upgrade-prompt";

type Usage = Record<UsageKind, number> & { month: string };

const thisMonth = () => new Date().toISOString().slice(0, 7);
const empty = (): Usage => ({ month: thisMonth(), messages: 0, searches: 0, interests: 0 });

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

/** Demo helper: reset this month's counts */
export const resetUsage = () => write(empty());

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
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("vk-plan-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const left = (k: UsageKind) => (unlimited ? Infinity : Math.max(0, FREE_LIMITS[k] - usage[k]));
  return { usage, unlimited, left };
}
