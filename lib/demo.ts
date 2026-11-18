"use client";

import { isDemoStudent } from "./accounts/shared";
import { SCOPED_KEYS, STORAGE_KEYS, clearAccountData } from "./storage";
import type { Student } from "./types";
import { vanSim } from "./vanSimulation";

/** Tiny event channel so any component (e.g. the top bar badge) can open the demo panel. */
export const DEMO_TOGGLE_EVENT = "ramhub:demo-toggle";

export function toggleDemoPanel(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEMO_TOGGLE_EVENT));
}

/** Fast-forward multiplier used by demo mode. */
export const DEMO_FAST_FORWARD = 20;

/**
 * Resets demo data only:
 * - always: the simulated vans and the seat reservations held on them (both are simulated);
 * - for the demo profile: everything it stored in this browser (groups, chats, blocks, prefs).
 * Never touches accounts, profiles, real group memberships, or any other account's data.
 */
export function resetDemoData(student: Student | null): void {
  vanSim.reset();
  const keys = student && isDemoStudent(student) ? SCOPED_KEYS : [STORAGE_KEYS.reservations];
  clearAccountData(keys);
}
