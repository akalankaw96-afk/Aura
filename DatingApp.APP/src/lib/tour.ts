"use client";

/**
 * Gold / Platinum guided tour (popup with screenshots). Opened from the dashboard welcome card
 * and the How to use page. Status is per browser for now (planned: store on the member profile).
 */
export const TOUR_EVENT = "vk-tour-open";
const STATUS_KEY = "vk-tour-status"; // "done" | "later"
const LATER_KEY = "vk-tour-later-at";

/** Tour items, in order (ids from content/howToUse.ts → full tour). */
export const TOUR_ITEM_IDS = ["search", "interest", "chat", "contact", "report", "promote"] as const;

export const openTour = () => window.dispatchEvent(new Event(TOUR_EVENT));

export function readTourStatus(): "done" | "later" | null {
  try {
    const s = localStorage.getItem(STATUS_KEY);
    if (s === "later") {
      // "Later" hides the welcome card for 3 days
      const at = Number(localStorage.getItem(LATER_KEY) || 0);
      return Date.now() - at < 3 * 86_400_000 ? "later" : null;
    }
    return s === "done" ? "done" : null;
  } catch {
    return null;
  }
}

export function setTourStatus(s: "done" | "later") {
  try {
    localStorage.setItem(STATUS_KEY, s);
    if (s === "later") localStorage.setItem(LATER_KEY, String(Date.now()));
  } catch {}
  window.dispatchEvent(new Event("vk-tour-status"));
}
