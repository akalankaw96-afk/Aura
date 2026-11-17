"use client";

import { useEffect, useState } from "react";
import { hasSession } from "@/lib/session";
import { getDashboard, type DashboardSummary } from "@/lib/matching";

/**
 * The dashboard summary (GET /api/me/dashboard — S03-T09), loaded once and shared by the stats row,
 * "Who viewed you" and the Messages card. Reloads when the window regains focus (at most every 30 s).
 */
let summary: DashboardSummary | null = null;
let inflight: Promise<void> | null = null;
let lastLoad = 0;
const EVENT = "vk-dashboard-change";

export function refreshDashboard(): Promise<void> {
  if (!hasSession()) return Promise.resolve();
  if (inflight) return inflight;
  inflight = getDashboard()
    .then((d) => {
      summary = d;
      lastLoad = Date.now();
      window.dispatchEvent(new Event(EVENT));
    })
    .catch(() => undefined)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useDashboard(): { data: DashboardSummary | null; loaded: boolean } {
  const [data, setData] = useState<DashboardSummary | null>(summary);
  useEffect(() => {
    const update = () => setData(summary);
    const reload = () => {
      if (Date.now() - lastLoad > 30_000) void refreshDashboard();
    };
    update();
    if (!summary || Date.now() - lastLoad > 30_000) void refreshDashboard();
    window.addEventListener(EVENT, update);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("focus", reload);
    };
  }, []);
  return { data, loaded: data !== null };
}
