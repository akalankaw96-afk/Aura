"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { hasSession } from "@/lib/session";
import { allSearchLimitsExhausted, handleLimitError, refreshUsage } from "@/lib/usage";
import { openProfile } from "@/lib/matching";
import type { FeaturedProfile } from "@/content/home";
import { toProposal, type CandidateProposal } from "./searchQuery";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Options {
  /** ?id= on first load */
  initialId: string;
  /** "home" / "dashboard": Back returns there */
  openedFrom: string | null;
  candidatePool: CandidateProposal[];
  loading: boolean;
}

/**
 * Full-page profile view on Search (?id=) — results list on the left, profile on the right (S05-T07: own hook).
 * Opening goes through GET /api/profiles/{id}: for members this records the view and counts one profile view
 * (re-opening one this month is free) — 402 opens the Upgrade prompt, 404 = hidden or gone.
 * Browser Back / Forward follow it.
 */
export function useProfileDetail({ initialId, openedFrom, candidatePool, loading }: Options) {
  const toast = useToast();
  const [viewing, setViewing] = useState<CandidateProposal | null>(null);
  const pendingIdRef = useRef<string | null>(initialId || null);
  const pushedRef = useRef(false);
  const fromHome = openedFrom === "home";
  const fromDashboard = openedFrom === "dashboard";

  const openDetail = async (p: { id: string; profileId?: string }, history: "push" | "replace" | "none"): Promise<boolean> => {
    if (hasSession() && allSearchLimitsExhausted()) return false;
    let full: CandidateProposal | null = candidatePool.find((c) => c.id === p.id) ?? null;
    if (p.profileId) {
      try {
        full = toProposal(await openProfile(p.profileId));
        if (hasSession()) void refreshUsage();
      } catch (err) {
        if (!handleLimitError(err)) toast.error("Profile not available", err instanceof Error ? err.message : "Please try again.");
        return false;
      }
    }
    if (!full) return false;
    if (history !== "none") {
      const url = new URL(window.location.href);
      url.searchParams.set("id", full.id);
      // first open adds a history entry (browser Back returns to results); switching profiles replaces it
      if (history === "replace") window.history.replaceState(null, "", url);
      else {
        window.history.pushState(null, "", url);
        pushedRef.current = true;
      }
    }
    setViewing(full);
    return true;
  };

  const findInPool = (id: string) =>
    candidatePool.find((c) => c.id.toLowerCase() === id.toLowerCase() || c.profileId?.toLowerCase() === id.toLowerCase());

  // ?id= on first load — once the first results are in (a profile id that isn't in them is opened directly)
  useEffect(() => {
    const id = pendingIdRef.current;
    if (!id || loading) return;
    pendingIdRef.current = null;
    const known = findInPool(id);
    if (known) void openDetail(known, "none");
    else if (GUID.test(id)) void openDetail({ id, profileId: id }, "none");
    // runs once the results arrive; openDetail / findInPool read the same pool
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, candidatePool]);

  // Follow browser back / forward
  useEffect(() => {
    const onPop = () => {
      pushedRef.current = false;
      const id = new URLSearchParams(window.location.search).get("id");
      if (!id) {
        setViewing(null);
        return;
      }
      const known = findInPool(id);
      if (known) void openDetail(known, "none");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // re-bound when the pool changes; openDetail / findInPool read the same pool
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatePool]);

  const open = (p: FeaturedProfile) => void openDetail(p, viewing ? "replace" : "push");

  const close = () => {
    if (fromHome || fromDashboard) {
      // came from Home / Dashboard: go back there (history keeps the scroll position); direct visit → open it
      const cameFromSite = document.referrer.startsWith(window.location.origin);
      if (cameFromSite && window.history.length > 1) window.history.back();
      else window.location.assign(fromHome ? "/" : "/dashboard#matches");
      return;
    }
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      window.history.replaceState(null, "", url);
    }
    setViewing(null);
  };

  const backTo: "home" | "dashboard" | "results" = fromHome ? "home" : fromDashboard ? "dashboard" : "results";

  return { viewing, open, close, backTo };
}
