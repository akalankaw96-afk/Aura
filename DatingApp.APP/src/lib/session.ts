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
