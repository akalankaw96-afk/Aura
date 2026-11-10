"use client";

import { useEffect, useState } from "react";

/**
 * Profile promotion ("boost") — Pro members only, after KYC approval.
 * One product for now: 7 days at the top of matching searches for LKR 500.
 * Stored in localStorage until the API exists.
 */
export const BOOST = { days: 7, price: 500, currency: "LKR" } as const;

const KEY = "vk-boost";
const EVENT = "vk-boost-change";
const DAY = 86_400_000;

interface BoostRecord {
  startedAt: string; // ISO
  days: number;
}

export interface BoostState {
  active: boolean;
  start: Date | null;
  ends: Date | null;
  daysLeft: number;
  totalDays: number;
  /** demo results while promoted */
  views: number;
  interests: number;
}

function read(): BoostState {
  let r: BoostRecord | null = null;
  try {
    r = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {}
  if (!r) return { active: false, start: null, ends: null, daysLeft: 0, totalDays: 0, views: 0, interests: 0 };
  const start = new Date(r.startedAt);
  const ends = new Date(start.getTime() + r.days * DAY);
  const msLeft = ends.getTime() - Date.now();
  const elapsed = Math.max(0, (Date.now() - start.getTime()) / DAY);
  return {
    active: msLeft > 0,
    start,
    ends,
    daysLeft: Math.max(0, Math.ceil(msLeft / DAY)),
    totalDays: r.days,
    // grows with time (demo): ~35 extra views and ~1 interest a day, a few on day one
    views: Math.round(24 + elapsed * 35),
    interests: Math.round(1 + elapsed * 0.9),
  };
}

/** Buys a boost. If one is running, the new days are added to its end. */
export function startBoost(days: number = BOOST.days) {
  const cur = read();
  const rec: BoostRecord =
    cur.active && cur.start
      ? { startedAt: cur.start.toISOString(), days: cur.totalDays + days }
      : { startedAt: new Date().toISOString(), days };
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** Demo helpers */
export function setBoostRecord(rec: BoostRecord | null) {
  try {
    if (rec) localStorage.setItem(KEY, JSON.stringify(rec));
    else localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

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
