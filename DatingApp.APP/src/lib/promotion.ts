"use client";

import { useEffect, useState } from "react";

/**
 * Profile promotion ("boost") — Pro members only, after KYC approval.
 * One product for now: 7 days at the top of matching searches for LKR 500.
 * Boost status comes from GET /boosts/me (Sprint 04); until then no member is shown as promoted.
 */
export const BOOST = { days: 7, price: 500, currency: "LKR" } as const;

const EVENT = "vk-boost-change";

export interface BoostState {
  active: boolean;
  start: Date | null;
  ends: Date | null;
  daysLeft: number;
  totalDays: number;
  /** extra views / interests while promoted */
  views: number;
  interests: number;
}

const NO_BOOST: BoostState = { active: false, start: null, ends: null, daysLeft: 0, totalDays: 0, views: 0, interests: 0 };

/** No boosts until GET /boosts/me exists (Sprint 04). */
function read(): BoostState {
  return NO_BOOST;
}

/** Buying a boost needs the payments API (Sprint 04): the boost is created on the server after payment. */

export function useBoost(): BoostState {
  const [s, setS] = useState<BoostState>({ active: false, start: null, ends: null, daysLeft: 0, totalDays: 0, views: 0, interests: 0 });
  useEffect(() => {
    const update = () => setS(read());
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return s;
}

export const OPEN_PROMOTE_EVENT = "vk-open-promote";
/** Opens the promote flow from anywhere on the dashboard. */
export function openPromote() {
  window.dispatchEvent(new Event(OPEN_PROMOTE_EVENT));
}
