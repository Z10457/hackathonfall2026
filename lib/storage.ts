"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Typed localStorage helpers for data that lives in this browser.
 *
 * Keys are split in two:
 * - GLOBAL keys belong to the browser (the signed-in session, the local mock account registry,
 *   dismissed alerts).
 * - Every other key is SCOPED to the signed-in account: it is stored as `<key>@<studentId>`, so
 *   one account's tickets, groups and chats never show up for the next account on this device,
 *   and signing out never deletes them.
 */
export const STORAGE_KEYS = {
  student: "ramhub:student",
  /** Local mock backend only: account registry keyed by normalized email. */
  accounts: "ramhub:accounts",
  /** Local mock backend only: group memberships of every local account. */
  groupMembers: "ramhub:group-members",
  /** Local mock backend only: id of the authenticated local account (set before onboarding ends). */
  localSession: "ramhub:local-session",
  dismissedAlerts: "ramhub:dismissed-alerts",
  // Scoped to the signed-in account:
  reservations: "ramhub:reservations",
  joinedGroups: "ramhub:joined-groups",
  customGroups: "ramhub:custom-groups",
  chats: "ramhub:chats",
  blocked: "ramhub:blocked",
  reported: "ramhub:reported",
  plannerPrefs: "ramhub:planner-prefs",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const GLOBAL_KEYS = new Set<StorageKey>([
  STORAGE_KEYS.student,
  STORAGE_KEYS.accounts,
  STORAGE_KEYS.groupMembers,
  STORAGE_KEYS.localSession,
  STORAGE_KEYS.dismissedAlerts,
]);

/** Keys whose data belongs to one account. */
export const SCOPED_KEYS: StorageKey[] = Object.values(STORAGE_KEYS).filter((key) => !GLOBAL_KEYS.has(key));

const CHANGE_EVENT = "ramhub:storage";
const GUEST_SCOPE = "guest";
const isBrowser = (): boolean => typeof window !== "undefined";

function rawGet(fullKey: string): string | null {
  try {
    return window.localStorage.getItem(fullKey);
  } catch {
    return null;
  }
}

/** Id of the signed-in account, read straight from the session key. */
function currentScope(): string {
  const raw = rawGet(STORAGE_KEYS.student);
  if (!raw) return GUEST_SCOPE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "id" in parsed && typeof parsed.id === "string" && parsed.id) {
      return parsed.id;
    }
  } catch {
    // fall through
  }
  return GUEST_SCOPE;
}

/** The real localStorage key for `key` and the given (or current) account. */
export function storageKeyFor(key: StorageKey, scope?: string): string {
  return GLOBAL_KEYS.has(key) ? key : `${key}@${scope ?? currentScope()}`;
}

/** Parsed-value cache so useSyncExternalStore gets a stable snapshot. */
const cache = new Map<string, { raw: string | null; value: unknown }>();

export function readStored<T>(key: StorageKey, fallback: T): T {
  if (!isBrowser()) return fallback;
  const fullKey = storageKeyFor(key);
  const raw = rawGet(fullKey);
  const hit = cache.get(fullKey);
  if (hit && hit.raw === raw) return (hit.value ?? fallback) as T;
  let value: unknown = null;
  if (raw !== null) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = null;
    }
  }
  cache.set(fullKey, { raw, value });
  return (value ?? fallback) as T;
}

function notify(detail: string): void {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail }));
}

export function writeStored<T>(key: StorageKey, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(storageKeyFor(key), JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode). The app keeps working in memory for this render.
  }
  notify(key);
}

export function removeStored(key: StorageKey): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(storageKeyFor(key));
  } catch {
    // ignore
  }
  notify(key);
}

/**
 * Clears this browser's data for ONE account (default: the signed-in one). Never touches the
 * session, the account registry, or any other account's data.
 */
export function clearAccountData(keys: StorageKey[] = SCOPED_KEYS, scope?: string): void {
  if (!isBrowser()) return;
  const owner = scope ?? currentScope();
  keys
    .filter((key) => !GLOBAL_KEYS.has(key))
    .forEach((key) => {
      try {
        window.localStorage.removeItem(storageKeyFor(key, owner));
      } catch {
        // ignore
      }
    });
  notify("*");
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
 * Scoped keys follow the signed-in account automatically.
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

/** Collision-free id. The prefix only makes ids readable in storage. */
export function makeId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uuid}`;
}
