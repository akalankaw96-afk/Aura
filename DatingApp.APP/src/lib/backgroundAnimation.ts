"use client";

import { KEYS, storage } from "@/lib/storage";
import { useSyncExternalStore } from "react";

const KEY = KEYS.backgroundAnimation;
const CHANGE_EVENT = "vk-background-animation-change";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
let inMemoryPreference: boolean | undefined;

function getState(): "on" | "off" | "reduced" {
  if (window.matchMedia(REDUCED_MOTION).matches) return "reduced";
  if (inMemoryPreference !== undefined) return inMemoryPreference ? "on" : "off";
  return storage.get(KEY) === "off" ? "off" : "on";
}

function subscribe(update: () => void) {
  const motion = window.matchMedia(REDUCED_MOTION);
  const syncStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      inMemoryPreference = undefined;
      update();
    }
  };
  window.addEventListener(CHANGE_EVENT, update);
  window.addEventListener("storage", syncStorage);
  motion.addEventListener("change", update);
  return () => {
    window.removeEventListener(CHANGE_EVENT, update);
    window.removeEventListener("storage", syncStorage);
    motion.removeEventListener("change", update);
  };
}

function setEnabled(enabled: boolean) {
  // storage blocked → remember it for this visit only
  inMemoryPreference = storage.set(KEY, enabled ? "on" : "off") ? undefined : enabled;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const getServerState = () => "on" as const;

export function useBackgroundAnimation() {
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  return { enabled: state === "on", reducedMotion: state === "reduced", setEnabled };
}
