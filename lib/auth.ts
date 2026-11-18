"use client";

import { useCallback, useEffect } from "react";
import { accountErrorMessage, accounts, isDemoStudent } from "./accounts";
import { STORAGE_KEYS, readStored, removeStored, useHydrated, useStoredState } from "./storage";
import { toast } from "./toast";
import type { Student } from "./types";

const NO_STUDENT: Student | null = null;

export interface UseStudent {
  /** The signed-in student, or null. Always null until `ready` is true. */
  student: Student | null;
  /** False during server render and hydration. */
  ready: boolean;
  saveStudent: (student: Student) => void;
  /** Updates the profile here and, for a real account, in the backend. */
  updateStudent: (patch: Partial<Student>) => void;
  /** Ends the session on this device. Never deletes the account or its data. */
  signOut: () => Promise<void>;
}

// Profile edits fire on every keystroke, so backend writes are batched.
const SYNC_DELAY_MS = 600;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleProfileSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    syncTimer = null;
    const latest = readStored<Student | null>(STORAGE_KEYS.student, NO_STUDENT);
    if (!latest || isDemoStudent(latest)) return;
    if (accounts.currentUid() !== latest.id) return;
    try {
      await accounts.saveProfile(latest);
    } catch (error) {
      toast({ title: "Profile not saved online", message: accountErrorMessage(error), tone: "warning" });
    }
  }, SYNC_DELAY_MS);
}

/**
 * The session is the Student object in localStorage. For real accounts it is kept in step with
 * the backend sign-in (see useAuthSessionGuard); the demo profile is local only.
 */
export function useStudent(): UseStudent {
  const ready = useHydrated();
  const [student, setStudent] = useStoredState<Student | null>(STORAGE_KEYS.student, NO_STUDENT);

  const saveStudent = useCallback((next: Student) => setStudent(next), [setStudent]);
  const updateStudent = useCallback(
    (patch: Partial<Student>) => {
      setStudent((prev) => (prev ? { ...prev, ...patch } : prev));
      scheduleProfileSync();
    },
    [setStudent],
  );
  const signOut = useCallback(async () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = null;
    // Always end the local session, even if the backend is unreachable. Account data is kept:
    // per-account storage is scoped by id, so it simply stops being shown.
    removeStored(STORAGE_KEYS.student);
    try {
      await accounts.signOut();
      toast({ title: "Signed out", tone: "success" });
    } catch (error) {
      toast({ title: "Signed out on this device", message: accountErrorMessage(error), tone: "warning" });
    }
  }, []);

  return { student: ready ? student : null, ready, saveStudent, updateStudent, signOut };
}

/**
 * Mount once. If the browser still holds a real student but the backend says nobody (or someone
 * else) is signed in, end the stale local session so edits never go to the wrong account.
 */
export function useAuthSessionGuard(): void {
  useEffect(
    () =>
      accounts.onSessionChange((uid) => {
        const stored = readStored<Student | null>(STORAGE_KEYS.student, NO_STUDENT);
        if (!stored || isDemoStudent(stored)) return;
        if (uid !== stored.id) {
          removeStored(STORAGE_KEYS.student);
          toast({ title: "Please sign in again", message: "Your session ended.", tone: "info" });
        }
      }),
    [],
  );
}
