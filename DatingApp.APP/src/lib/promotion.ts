"use client";

import { useEffect, useState } from "react";
import { apiJson, hasStoredSession } from "@/lib/http";

/**
 * Profile promotion ("boost") — approved Gold / Platinum members (S04-T05).
 * One product for now: 7 days at the top of matching searches. Paid by bank transfer like plans
 * (/plans/checkout?product=boost); staff approve the receipt and the boost starts (or is added after the current one).
 * BOOST.price is only the fallback — the real price comes from GET /api/plans (product "boost").
 */
export const BOOST = { days: 7, price: 500, currency: "LKR" } as const;

const EVENT = "vk-boost-change";

export interface BoostState {
  active: boolean;
  start: Date | null;
  ends: Date | null;
  daysLeft: number;
  totalDays: number;
  /** views / interests since the boost started */
  views: number;
  interests: number;
  /** approved profile + paid plan → can buy */
  canBuy: boolean;
  loaded: boolean;
}

interface BoostStatusDto {
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  daysLeft: number;
  totalDays: number;
  views: number;
  interests: number;
  canBuy: boolean;
}

const NO_BOOST: BoostState = { active: false, start: null, ends: null, daysLeft: 0, totalDays: 0, views: 0, interests: 0, canBuy: false, loaded: false };

/** GET /api/boosts/me */
export async function getMyBoost(): Promise<BoostState> {
  const d = await apiJson<BoostStatusDto>("/boosts/me", { cache: "no-store" });
  return {
    active: d.active,
    start: d.startsAt ? new Date(d.startsAt) : null,
    ends: d.endsAt ? new Date(d.endsAt) : null,
    daysLeft: d.daysLeft,
    totalDays: d.totalDays,
    views: d.views,
    interests: d.interests,
    canBuy: d.canBuy,
    loaded: true,
  };
}

/** Ask every useBoost() on the page to reload. */
export function refreshBoost() {
  window.dispatchEvent(new Event(EVENT));
}

export function useBoost(): BoostState {
  const [s, setS] = useState<BoostState>(NO_BOOST);
  useEffect(() => {
    let alive = true;
    const update = () => {
      if (!hasStoredSession()) {
        setS({ ...NO_BOOST, loaded: true });
        return;
      }
      getMyBoost()
        .then((b) => {
          if (alive) setS(b);
        })
        .catch(() => {
          if (alive) setS({ ...NO_BOOST, loaded: true });
        });
    };
    update();
    window.addEventListener(EVENT, update);
    return () => {
      alive = false;
      window.removeEventListener(EVENT, update);
    };
  }, []);
  return s;
}

export const OPEN_PROMOTE_EVENT = "vk-open-promote";
/** Opens the promote flow from anywhere on the dashboard. */
export function openPromote() {
  window.dispatchEvent(new Event(OPEN_PROMOTE_EVENT));
}
