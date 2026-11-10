"use client";

import { useEffect, useState } from "react";
import { FRIENDS, friendProfileId, type RequestProfile } from "@/content/dashboard";
import type { CountryCode } from "@/components/ui/Flag";
import { SESSION_KEY, useSignedIn } from "@/lib/session";

export type ConnectionProfile = Omit<RequestProfile, "tab" | "country"> & { country: CountryCode };

const CHANGE_EVENT = "vk-connections-change";
const EMPTY: ConnectionProfile[] = [];
type ConnectionList = "favourites" | "friends" | "sent-interests";

function storageKey(list: ConnectionList) {
  const userId = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}").userId;
  return userId ? `vk-${list}:${userId}` : null;
}

function readProfiles(list: ConnectionList) {
  try {
    const key = storageKey(list);
    const saved = key && JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(saved) ? saved as ConnectionProfile[] : EMPTY;
  } catch {
    return EMPTY;
  }
}

function useStoredProfiles(list: ConnectionList) {
  const [profiles, setProfiles] = useState(EMPTY);
  useEffect(() => {
    const refresh = () => setProfiles(readProfiles(list));
    const events = [CHANGE_EVENT, "storage", "aura_auth_change"];
    refresh();
    events.forEach((event) => window.addEventListener(event, refresh));
    return () => events.forEach((event) => window.removeEventListener(event, refresh));
  }, [list]);

  function save(profile: ConnectionProfile) {
    try {
      const key = storageKey(list);
      if (!key) return false;
      const current = readProfiles(list);
      const existing = current.some((entry) => entry.id === profile.id);
      if (existing && list !== "favourites") return list === "friends";
      const next = existing ? current.filter((entry) => entry.id !== profile.id) : [profile, ...current];
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return !existing;
    } catch {
      return false;
    }
  }

  return { profiles, save };
}

export const useFavourites = () => useStoredProfiles("favourites");
export const useAddedFriends = () => useStoredProfiles("friends");
export const useSentInterests = () => useStoredProfiles("sent-interests");

export function useIsConnected(profileId: string) {
  const signedIn = useSignedIn();
  const { profiles } = useAddedFriends();
  return signedIn && (profiles.some((profile) => profile.id === profileId) || FRIENDS.some((friend) => friendProfileId(friend) === profileId));
}

/** Adapt a search card to the same profile details panel used on Requests. */
export function favouriteProfile(profile: {
  id: string;
  name?: string;
  age: number;
  photo: string;
  location: string;
  country: CountryCode;
  height: string;
  profession: string;
  religion: string;
  horoscope?: boolean;
  bio?: string;
}): ConnectionProfile {
  const name = profile.name || profile.id;
  return {
    id: profile.id,
    age: profile.age,
    photo: profile.photo,
    location: profile.location,
    country: profile.country,
    horoscope: profile.horoscope,
    name,
    fullName: name,
    meta: [profile.location, profile.religion, profile.profession].filter(Boolean).join(" · "),
    time: "",
    note: "",
    about: profile.bio || "",
    details: [
      { icon: "calendar", label: "Age", value: `${profile.age} years` },
      { icon: "ruler", label: "Height", value: profile.height },
      { icon: "book", label: "Religion", value: profile.religion },
      { icon: "briefcase", label: "Profession", value: profile.profession },
      { icon: "location", label: "Living in", value: profile.location },
    ],
  };
}
