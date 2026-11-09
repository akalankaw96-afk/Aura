"use client";

import { useEffect, useState } from "react";

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
