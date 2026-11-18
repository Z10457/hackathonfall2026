"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Typed localStorage helpers. This is the only persistence layer in the MVP.
 * To move to Supabase later, replace the bodies of readStored / writeStored
 * (or wrap them in a repository) and keep the same keys as table names.
 */
export const STORAGE_KEYS = {
  student: "ramhub:student",
  reservations: "ramhub:reservations",
  joinedGroups: "ramhub:joined-groups",
  customGroups: "ramhub:custom-groups",
  chats: "ramhub:chats",
  blocked: "ramhub:blocked",
  reported: "ramhub:reported",
  dismissedAlerts: "ramhub:dismissed-alerts",
  plannerPrefs: "ramhub:planner-prefs",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const CHANGE_EVENT = "ramhub:storage";
const isBrowser = (): boolean => typeof window !== "undefined";

/** Parsed-value cache so useSyncExternalStore gets a stable snapshot. */
const cache = new Map<string, { raw: string | null; value: unknown }>();

export function readStored<T>(key: StorageKey, fallback: T): T {
  if (!isBrowser()) return fallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return (hit.value ?? fallback) as T;
  let value: unknown = null;
  if (raw !== null) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = null;
    }
  }
  cache.set(key, { raw, value });
  return (value ?? fallback) as T;
}

export function writeStored<T>(key: StorageKey, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode). The app keeps working in memory for this render.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

export function removeStored(key: StorageKey): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

/** Clears every Ram Hub key. Pass keepStudent to stay signed in (used by demo reset). */
export function clearAllStored(options: { keepStudent?: boolean } = {}): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    if (options.keepStudent && key === STORAGE_KEYS.student) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: "*" }));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * React state backed by localStorage and shared across every component using the same key.
 * `fallback` must be a stable reference (module-level constant), not an inline literal.
 * Returns the fallback during server render and hydration.
 */
export function useStoredState<T>(
  key: StorageKey,
  fallback: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readStored(key, fallback),
    () => fallback,
  );
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStored(key, fallback);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeStored(key, resolved);
    },
    [key, fallback],
  );
  return [value, setValue];
}

/** True once the component has hydrated on the client (localStorage is readable). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
