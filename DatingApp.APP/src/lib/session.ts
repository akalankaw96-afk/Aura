"use client";

import { useEffect, useState } from "react";
import { apiService, AuthSession } from "@/services/api";
import { Profile } from "@/types";

/** Same key the API service writes on login (services/api.ts). */
export const SESSION_KEY = "aura_session";

export function hasSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!window.localStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}

/** true once we know a member is signed in (false on the server / first paint). */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const update = () => setSignedIn(hasSession());
    update();
    window.addEventListener("aura_auth_change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("aura_auth_change", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return signedIn;
}

/** Where "home" is for the current visitor: the dashboard once signed in. */
export function useHomeHref(): string {
  return useSignedIn() ? "/dashboard" : "/";
}

/**
 * Reactive hook providing the currently authenticated user's session and candidate profile.
 */
export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const s = JSON.parse(raw) as AuthSession;
          setSession(s);
        } else {
          setSession(null);
          setProfile(null);
        }
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    update();
    window.addEventListener("aura_auth_change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("aura_auth_change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  // Fetch candidate profile from backend if session has token
  useEffect(() => {
    if (!session?.token) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    apiService.getMyProfile().then((p) => {
      if (!cancelled && p) {
        setProfile(p);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  const fullName = profile?.name || session?.fullName || "";
  const firstName = fullName ? fullName.trim().split(" ")[0] : "Member";
  const photoUrl = profile?.photoUrl || session?.photoUrl || "";
  const profileCode = profile?.code || (session?.profileId ? `AM-${session.profileId.slice(0, 6).toUpperCase()}` : "");
  const isVerified = profile?.verified ?? session?.isVerified ?? false;
  const isUnderReview = session?.isUnderReview ?? (!isVerified && Boolean(profile || session?.hasCompletedProfile));
  const isPaid = profile?.premium ?? session?.isPremium ?? false;
  const planId = profile?.premium ? "premium" : (session?.planId || "free");
  const hasCompletedProfile = Boolean(profile || session?.hasCompletedProfile);

  return {
    session,
    profile,
    loading,
    isAuthenticated: Boolean(session),
    fullName,
    firstName,
    photoUrl,
    profileCode,
    isVerified,
    isUnderReview,
    isPaid,
    planId,
    hasCompletedProfile,
  };
}

/* ------------------------------------------------------------------ */
/* Guest gate — actions on profiles need an account                    */
/* ------------------------------------------------------------------ */
const RETURN_KEY = "vk-return-to";
const safePath = (p: string | null | undefined) => (p && p.startsWith("/") && !p.startsWith("//") ? p : null);

export const LOGIN_REQUIRED_EVENT = "vk-login-required";

/**
 * Guests (not logged in) who tap an action — send interest, message, shortlist, share, report —
 * see the "Log in to continue" dialog (components/layout/LoginRequiredModal) with
 * Log in · Create account · Cancel. After logging in they come back to the same page.
 * Returns true when the visitor is a member and the action may continue.
 */
export function requireMember(action = "continue"): boolean {
  if (hasSession()) return true;
  const here = window.location.pathname + window.location.search;
  try {
    sessionStorage.setItem(RETURN_KEY, here);
  } catch {}
  window.dispatchEvent(new CustomEvent(LOGIN_REQUIRED_EVENT, { detail: { action, next: here } }));
  return false;
}

/** Where to go after logging in: ?next=… or the page the guest came from, else the dashboard. */
export function takeReturnTo(fallback = "/dashboard"): string {
  let next: string | null = null;
  try {
    next = safePath(new URLSearchParams(window.location.search).get("next")) ?? safePath(sessionStorage.getItem(RETURN_KEY));
    sessionStorage.removeItem(RETURN_KEY);
  } catch {}
  return next ?? fallback;
}
