import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/* Test setup (S05-T10). Runs before every test file. */

/*
 * Newer Node versions (25+) have their own `localStorage` / `sessionStorage` / `Storage` globals, which are empty
 * shells unless Node is started with --localstorage-file. Vitest keeps globals that already exist, so they hide
 * jsdom's working ones ("Cannot read properties of undefined (reading 'clear')"). Put jsdom's back.
 */
const dom = (globalThis as { jsdom?: { window: Record<string, unknown> } }).jsdom;
if (dom) {
  for (const key of ["localStorage", "sessionStorage", "Storage"]) {
    Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
  }
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.style.overflow = "";
});

/*
 * jsdom has <dialog> but not showModal() / close(). This stand-in toggles the `open` attribute the way the browser
 * does, so `Modal` runs its real code. (jsdom can't send Esc to a dialog: tests fire the `cancel` event instead,
 * which is what the browser fires when Esc is pressed.)
 */
const dialogProto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void; close?: () => void };
if (typeof dialogProto.showModal !== "function") {
  dialogProto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
}
if (typeof dialogProto.close !== "function") {
  dialogProto.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
