"use client";

import { useEffect, useState } from "react";
import type { RequestProfile } from "@/content/dashboard";
import type { CountryCode } from "@/components/ui/Flag";
import { SESSION_KEY, useSignedIn } from "@/lib/session";

export type ConnectionProfile = Omit<RequestProfile, "tab" | "country"> & { country: CountryCode };

const CHANGE_EVENT = "vk-connections-change";
const EMPTY: never[] = [];
type ConnectionList = "favourites" | "friends" | "sent-interests" | "declined-interests";

function storageKey(list: ConnectionList) {
  const userId = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}").userId;
  return userId ? `vk-${list}:${userId}` : null;
}

function readProfiles<T extends { id: string }>(list: ConnectionList) {
  try {
    const key = storageKey(list);
    const saved = key && JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(saved) ? saved as T[] : EMPTY;
  } catch {
    return EMPTY;
  }
}

function useStoredProfiles<T extends { id: string }>(list: ConnectionList) {
  const [profiles, setProfiles] = useState<T[]>(EMPTY);
  useEffect(() => {
    const refresh = () => setProfiles(readProfiles<T>(list));
    const events = [CHANGE_EVENT, "storage", "aura_auth_change"];
    refresh();
    events.forEach((event) => window.addEventListener(event, refresh));
    return () => events.forEach((event) => window.removeEventListener(event, refresh));
  }, [list]);

  function save(profile: T) {
    try {
      const key = storageKey(list);
      if (!key) return false;
      const current = readProfiles<T>(list);
      const existing = current.some((entry) => entry.id === profile.id);
      if (existing && list !== "favourites") return list !== "sent-interests";
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

export const useFavourites = () => useStoredProfiles<ConnectionProfile>("favourites");
export const useAddedFriends = () => useStoredProfiles<ConnectionProfile>("friends");
export const useSentInterests = () => useStoredProfiles<ConnectionProfile>("sent-interests");
export const useDeclinedInterests = () => useStoredProfiles<{ id: string }>("declined-interests");

export function useIsConnected(profileId: string) {
  const signedIn = useSignedIn();
  const { profiles } = useAddedFriends();
  return signedIn && profiles.some((profile) => profile.id === profileId);
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
