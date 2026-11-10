// Display preferences shared by every effect: theme, motion, and pointer type.
//
// One tiny store instead of React context, so effects can subscribe without
// re-rendering the app. The result is mirrored onto <html> as
//   data-theme="dark|light"  and  data-motion="on|off"
// which is what the CSS keys off.
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "continuityos:prefs";
const hasDOM = typeof window !== "undefined" && typeof document !== "undefined";

function query(media) {
  return hasDOM && typeof window.matchMedia === "function" ? window.matchMedia(media) : null;
}

const reducedMotion = query("(prefers-reduced-motion: reduce)");
const finePointer = query("(hover: hover) and (pointer: fine)");

function readStored() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function writeStored(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, sandboxed frames). Not fatal.
  }
}

// motionPref: "auto" follows the operating system, "on" / "off" is an explicit
// choice made with the switch in the top bar.
function build(theme, motionPref) {
  const systemAllowsMotion = !reducedMotion?.matches;
  return Object.freeze({
    theme,
    motionPref,
    motion: motionPref === "auto" ? systemAllowsMotion : motionPref === "on",
    finePointer: Boolean(finePointer?.matches),
  });
}

const stored = hasDOM ? readStored() : {};
let snapshot = build(
  stored.theme === "light" ? "light" : "dark",
  stored.motion === "on" || stored.motion === "off" ? stored.motion : "auto",
);

const listeners = new Set();

function apply() {
  if (!hasDOM) return;
  const root = document.documentElement;
  root.dataset.theme = snapshot.theme;
  root.dataset.motion = snapshot.motion ? "on" : "off";
}

function commit(theme, motionPref, persist) {
  snapshot = build(theme, motionPref);
  apply();
  if (persist) writeStored({ theme, motion: motionPref });
  listeners.forEach((listener) => listener());
}

const refresh = () => commit(snapshot.theme, snapshot.motionPref, false);
reducedMotion?.addEventListener?.("change", refresh);
finePointer?.addEventListener?.("change", refresh);

// Applied as soon as this module loads, i.e. before React paints anything.
apply();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => snapshot;

/** { theme, motion, motionPref, finePointer } — re-renders when any changes. */
export function usePrefs() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setTheme(theme) {
  commit(theme === "light" ? "light" : "dark", snapshot.motionPref, true);
}

export function setMotion(enabled) {
  commit(snapshot.theme, enabled ? "on" : "off", true);
}

export const getPrefs = getSnapshot;
