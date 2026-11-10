"use client";

import { useSyncExternalStore } from "react";

const KEY = "vk-background-animation";
const CHANGE_EVENT = "vk-background-animation-change";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
let inMemoryPreference: boolean | undefined;

function getState(): "on" | "off" | "reduced" {
  if (window.matchMedia(REDUCED_MOTION).matches) return "reduced";
  if (inMemoryPreference !== undefined) return inMemoryPreference ? "on" : "off";
  try {
    return localStorage.getItem(KEY) === "off" ? "off" : "on";
  } catch {
    return "on";
  }
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
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
    inMemoryPreference = undefined;
  } catch {
    inMemoryPreference = enabled;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const getServerState = () => "on" as const;

export function useBackgroundAnimation() {
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  return { enabled: state === "on", reducedMotion: state === "reduced", setEnabled };
}
