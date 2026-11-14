"use client";

import { useEffect, useState } from "react";
import type { CountryCode } from "@/components/ui/Flag";
import type { FeaturedProfile, MarqueeProfile } from "@/content/home";
import { ApiError, apiService } from "@/services/api";
import type { Profile } from "@/types";

/**
 * Real members from the database (GET /api/profiles), adapted to the shapes the cards use.
 * There is no sample/demo data anywhere: when the database has no members, lists are empty.
 */

const COUNTRY_CODES: Record<string, CountryCode> = {
  "sri lanka": "lk",
  australia: "au",
  "united kingdom": "gb",
  uk: "gb",
  canada: "ca",
  qatar: "qa",
  "middle east": "qa",
  uae: "ae",
  "united arab emirates": "ae",
  italy: "it",
  "new zealand": "nz",
  usa: "us",
  "united states": "us",
};

export const countryCode = (name?: string | null): CountryCode => COUNTRY_CODES[(name || "").trim().toLowerCase()] ?? "lk";

/** "LK-1234" when the profile has a code, otherwise its id. Used in URLs (?id=) and card titles. */
export const profileKey = (p: Profile) => p.code || p.id;

export function toFeatured(p: Profile): FeaturedProfile {
  return {
    id: profileKey(p),
    profileId: p.id,
    verified: p.verified,
    location: [p.location, p.country].filter(Boolean).join(", "),
    country: countryCode(p.country),
    age: p.age,
    height: p.height,
    profession: p.profession,
    religion: p.religion,
    photo: p.photoUrl,
    horoscope: p.horoscopeAvailable,
    gender: p.gender === "female" ? "bride" : "groom",
  };
}

const LANGUAGE: Record<string, string> = { sinhalese: "Sinhala", sinhala: "Sinhala", tamil: "Tamil" };

export function toMarquee(p: Profile): MarqueeProfile {
  const f = toFeatured(p);
  const firstName = (p.details?.displayName || p.name || "").split(" ")[0] || f.id;
  return {
    id: f.id,
    city: p.location,
    country: f.country,
    age: p.age,
    height: p.height,
    profession: p.profession,
    religion: p.religion,
    avatar: p.photoUrl,
    gender: f.gender,
    name: firstName,
    location: f.location,
    language: LANGUAGE[(p.community || "").toLowerCase()] ?? "",
    photo: p.photoUrl,
    verified: p.verified,
  };
}

interface MemberProfilesState {
  profiles: Profile[];
  loading: boolean;
  error: string | null;
}

/** Loads members from the API. `filters` is read once per `key` change. */
export function useMemberProfiles(filters?: Parameters<typeof apiService.getProfiles>[0], key = ""): MemberProfilesState {
  const [state, setState] = useState<MemberProfilesState>({ profiles: [], loading: true, error: null });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiService
      .getProfiles(filters)
      .then((profiles) => alive && setState({ profiles, loading: false, error: null }))
      .catch((err: unknown) =>
        alive && setState({ profiles: [], loading: false, error: err instanceof ApiError || err instanceof Error ? err.message : "Couldn’t load profiles." }),
      );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

/** Sends an interest to a member (POST /api/match-requests). The caller shows the result. */
export async function sendInterest(p: { id: string; profileId?: string }, note?: string): Promise<{ ok: boolean; message: string }> {
  if (!p.profileId) return { ok: false, message: "This profile can’t receive interests yet." };
  try {
    await apiService.sendMatchRequest(p.profileId, note);
    return { ok: true, message: `${p.id} will be notified. We’ll tell you when they reply.` };
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : "We couldn’t send your interest. Please try again." };
  }
}
