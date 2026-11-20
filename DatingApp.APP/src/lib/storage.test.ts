import { describe, expect, it, vi } from "vitest";
import { KEYS, LEGACY_KEYS, readSessionData, storage } from "./storage";

describe("storage", () => {
  it("reads, writes and removes in localStorage by default", () => {
    expect(storage.get("k")).toBeNull();
    expect(storage.set("k", "v")).toBe(true);
    expect(localStorage.getItem("k")).toBe("v");
    expect(storage.get("k")).toBe("v");
    storage.remove("k");
    expect(storage.get("k")).toBeNull();
  });

  it("keeps sessionStorage separate", () => {
    storage.set("k", "session-value", "session");
    expect(sessionStorage.getItem("k")).toBe("session-value");
    expect(storage.get("k")).toBeNull();
    expect(storage.get("k", "session")).toBe("session-value");
  });

  it("round-trips JSON", () => {
    expect(storage.setJSON("obj", { a: 1, list: ["x"] })).toBe(true);
    expect(storage.getJSON("obj", null)).toEqual({ a: 1, list: ["x"] });
  });

  it("returns the fallback when the value is missing, empty or not JSON", () => {
    expect(storage.getJSON("missing", { d: true })).toEqual({ d: true });
    localStorage.setItem("empty", "");
    expect(storage.getJSON("empty", 5)).toBe(5);
    localStorage.setItem("broken", "{not json");
    expect(storage.getJSON("broken", "fallback")).toBe("fallback");
  });

  it("never throws: a failed write returns false, a failed read returns null", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(storage.set("k", "v")).toBe(false);
    expect(storage.setJSON("k", { a: 1 })).toBe(false);
    expect(storage.get("k")).toBeNull();
    expect(storage.getJSON("k", "fallback")).toBe("fallback");
    expect(() => storage.remove("k")).not.toThrow();
  });

  it("clear() empties only the chosen area", () => {
    storage.set("a", "1");
    storage.set("b", "2", "session");
    storage.clear("session");
    expect(storage.get("b", "session")).toBeNull();
    expect(storage.get("a")).toBe("1");
  });

  it("removeLegacy() deletes every old key and nothing else", () => {
    for (const k of LEGACY_KEYS) localStorage.setItem(k, "old");
    localStorage.setItem(KEYS.theme, "dark");
    storage.removeLegacy();
    for (const k of LEGACY_KEYS) expect(localStorage.getItem(k)).toBeNull();
    expect(localStorage.getItem(KEYS.theme)).toBe("dark");
  });

  it("readSessionData() returns the stored member details or null", () => {
    expect(readSessionData()).toBeNull();
    storage.setJSON(KEYS.session, { profileId: "p1", fullName: "Nimali" });
    expect(readSessionData<{ profileId: string }>()?.profileId).toBe("p1");
    localStorage.setItem(KEYS.session, "{oops");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readSessionData()).toBeNull();
  });

  it("every key name is unique", () => {
    const names = Object.values(KEYS);
    expect(new Set(names).size).toBe(names.length);
  });
});
