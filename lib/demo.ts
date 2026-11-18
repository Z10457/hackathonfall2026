"use client";

/** Tiny event channel so any component (e.g. the top bar badge) can open the demo panel. */
export const DEMO_TOGGLE_EVENT = "ramhub:demo-toggle";

export function toggleDemoPanel(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEMO_TOGGLE_EVENT));
}

/** Fast-forward multiplier used by demo mode. */
export const DEMO_FAST_FORWARD = 20;
