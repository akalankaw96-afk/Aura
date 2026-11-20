"use client";

import { KEYS, storage } from "@/lib/storage";

/**
 * Gold / Platinum guided tour (popup with screenshots). Opened from the dashboard welcome card
 * and the How to use page. Status is per browser for now (planned: store on the member profile).
 */
export const TOUR_EVENT = "vk-tour-open";
const STATUS_KEY = KEYS.tourStatus; // "done" | "later"
const LATER_KEY = KEYS.tourLaterAt;

/** Tour items, in order (ids from content/howToUse.ts → full tour). */
export const TOUR_ITEM_IDS = ["search", "interest", "chat", "contact", "report", "promote"] as const;

export const openTour = () => window.dispatchEvent(new Event(TOUR_EVENT));

export function readTourStatus(): "done" | "later" | null {
  const s = storage.get(STATUS_KEY);
  if (s === "later") {
    // "Later" hides the welcome card for 3 days
    const at = Number(storage.get(LATER_KEY) || 0);
    return Date.now() - at < 3 * 86_400_000 ? "later" : null;
  }
  return s === "done" ? "done" : null;
}

export function setTourStatus(s: "done" | "later") {
  storage.set(STATUS_KEY, s);
  if (s === "later") storage.set(LATER_KEY, String(Date.now()));
  window.dispatchEvent(new Event("vk-tour-status"));
}
