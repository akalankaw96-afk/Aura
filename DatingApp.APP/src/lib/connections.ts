"use client";

import { useEffect, useState } from "react";
import type { RequestProfile } from "@/content/dashboard";
import type { CountryCode } from "@/components/ui/Flag";
import { hasSession, useSignedIn } from "@/lib/session";
import { countryCode, profileKey } from "@/lib/profiles";
import { addToShortlist, getShortlist, listInterests, removeFromShortlist, type Interest } from "@/lib/matching";
import type { Profile } from "@/types";

/**
 * Friends (matched), favourites (shortlist), sent and received interests — all from the API (S03-T05, T06).
 * Nothing is kept in localStorage any more: lists survive a reload and follow the member to other devices.
 * One shared store; screens read it through the hooks below and call refreshConnections() after a change.
 */
export type ConnectionProfile = Omit<RequestProfile, "tab" | "country"> & {
  country: CountryCode;
  /** the member's profile id (UUID) — what the API needs */
  profileId?: string;
  /** the interest id (accept / decline / withdraw) */
  requestId?: string;
  status?: Interest["status"];
};

interface Store {
  loaded: boolean;
  favourites: ConnectionProfile[];
  friends: ConnectionProfile[];
  sent: ConnectionProfile[];
  received: ConnectionProfile[];
}

const EMPTY_STORE: Store = { loaded: false, favourites: [], friends: [], sent: [], received: [] };
const CHANGE_EVENT = "vk-connections-change";
let store: Store = EMPTY_STORE;
let inflight: Promise<void> | null = null;

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

function setStore(patch: Partial<Store>) {
  store = { ...store, ...patch };
  emit();
}

/** "Just now", "5 min ago", "3 h ago", "2 d ago", then the date. */
export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const t = new Date(iso.endsWith("Z") || /[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`).getTime();
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** An API profile in the shape the Friends / favourites screens use. */
export function connectionFromProfile(p: Profile, extra: Partial<ConnectionProfile> = {}): ConnectionProfile {
  return {
    ...favouriteProfile({
      id: profileKey(p),
      profileId: p.id,
      name: p.details?.displayName || p.name,
      age: p.age,
      photo: p.photoUrl,
      location: [p.location, p.country].filter(Boolean).join(", "),
      country: countryCode(p.country),
      height: p.height,
      profession: p.profession,
      religion: p.religion,
      horoscope: p.horoscopeAvailable,
      bio: p.bio,
    }),
    ...extra,
  };
}

const fromInterest = (i: Interest): ConnectionProfile =>
  connectionFromProfile(i.profile, {
    requestId: i.id,
    status: i.status,
    time: timeAgo(i.respondedAt ?? i.createdAt),
    note: i.note ?? "",
    isNew: i.direction === "received" && Date.now() - new Date(`${i.createdAt}Z`).getTime() < 86_400_000,
  });

/** Re-reads all four lists from the API (deduplicated). Signed-out → empty. */
export function refreshConnections(): Promise<void> {
  if (!hasSession()) {
    store = EMPTY_STORE;
    emit();
    return Promise.resolve();
  }
  if (inflight) return inflight;
  inflight = Promise.allSettled([getShortlist(), listInterests("matched"), listInterests("sent"), listInterests("received")])
    .then(([fav, matched, sent, received]) => {
      setStore({
        loaded: true,
        favourites: fav.status === "fulfilled" ? fav.value.map((s) => connectionFromProfile(s.profile, { time: timeAgo(s.addedAt) })) : store.favourites,
        friends: matched.status === "fulfilled" ? matched.value.map(fromInterest) : store.friends,
        sent: sent.status === "fulfilled" ? sent.value.map(fromInterest) : store.sent,
        received: received.status === "fulfilled" ? received.value.map(fromInterest) : store.received,
      });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function useStore(): Store {
  const [s, setS] = useState<Store>(store);
  useEffect(() => {
    const update = () => setS(store);
    const reload = () => void refreshConnections();
    update();
    if (!store.loaded) reload();
    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener("aura_auth_change", reload);
    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener("aura_auth_change", reload);
    };
  }, []);
  return s;
}

/**
 * Favourites = the server shortlist. `save` toggles a profile and returns true when it is now saved.
 * The change shows at once; if the API refuses, it is undone.
 */
export function useFavourites() {
  const s = useStore();
  function save(profile: ConnectionProfile): boolean {
    if (!profile.profileId) return false;
    const exists = store.favourites.some((f) => f.id === profile.id);
    const before = store.favourites;
    setStore({ favourites: exists ? before.filter((f) => f.id !== profile.id) : [{ ...profile, time: "Just now" }, ...before] });
    (exists ? removeFromShortlist(profile.profileId) : addToShortlist(profile.profileId)).catch(() => setStore({ favourites: before }));
    return !exists;
  }
  return { profiles: s.favourites, save, loaded: s.loaded };
}

/** Accepted interests (either side). Call refreshConnections() after accepting. */
export function useAddedFriends() {
  const s = useStore();
  return { profiles: s.friends, loaded: s.loaded };
}

/** Interests I sent that are waiting or were declined. `save` shows a just-sent one before the list reloads. */
export function useSentInterests() {
  const s = useStore();
  function save(profile: ConnectionProfile): boolean {
    if (store.sent.some((p) => p.id === profile.id)) return false;
    setStore({ sent: [{ ...profile, status: "Pending" }, ...store.sent] });
    void refreshConnections();
    return true;
  }
  return { profiles: s.sent, save, loaded: s.loaded };
}

/** Interests waiting for my answer. */
export function useReceivedInterests() {
  const s = useStore();
  return { profiles: s.received, loaded: s.loaded };
}

export function useIsConnected(profileId: string) {
  const signedIn = useSignedIn();
  const { profiles } = useAddedFriends();
  return signedIn && profiles.some((profile) => profile.id === profileId || profile.profileId === profileId);
}

/** Adapt a search card to the same profile details panel used on Friends. */
export function favouriteProfile(profile: {
  id: string;
  profileId?: string;
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
    profileId: profile.profileId,
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
