"use client";

import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { useCallback, useEffect } from "react";
import { auth } from "./firebase";
import { authErrorMessage, isLocalOnlyStudent, saveProfile } from "./firebaseAuth";
import { STORAGE_KEYS, readStored, removeStored, useHydrated, useStoredState } from "./storage";
import { toast } from "./toast";
import type { Student } from "./types";

const NO_STUDENT: Student | null = null;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export interface UseStudent {
  /** The signed-in student, or null. Always null until `ready` is true. */
  student: Student | null;
  /** False during server render and hydration. */
  ready: boolean;
  saveStudent: (student: Student) => void;
  /** Updates the profile here and, for a Firebase account, in Firestore. */
  updateStudent: (patch: Partial<Student>) => void;
  signOut: () => Promise<void>;
}

// Profile edits fire on every keystroke, so Firestore writes are batched.
const SYNC_DELAY_MS = 600;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleProfileSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    syncTimer = null;
    const latest = readStored<Student | null>(STORAGE_KEYS.student, NO_STUDENT);
    if (!latest || isLocalOnlyStudent(latest)) return;
    if (auth.currentUser?.uid !== latest.id) return;
    try {
      await saveProfile(latest);
    } catch (error) {
      toast({ title: "Profile not saved online", message: authErrorMessage(error), tone: "warning" });
    }
  }, SYNC_DELAY_MS);
}

/**
 * The session is the Student object in localStorage. For Firebase accounts it is kept in step
 * with the Firebase sign-in (see useAuthSessionGuard); demo profiles are local only.
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
    // Always end the local session, even if Firebase is unreachable.
    removeStored(STORAGE_KEYS.student);
    try {
      if (auth.currentUser) await firebaseSignOut(auth);
      toast({ title: "Signed out", tone: "success" });
    } catch (error) {
      toast({ title: "Signed out on this device", message: authErrorMessage(error), tone: "warning" });
    }
  }, []);

  return { student: ready ? student : null, ready, saveStudent, updateStudent, signOut };
}

/**
 * Mount once. If the browser still holds a Firebase student but Firebase says nobody (or someone
 * else) is signed in, end the stale local session so edits never go to the wrong account.
 */
export function useAuthSessionGuard(): void {
  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        const stored = readStored<Student | null>(STORAGE_KEYS.student, NO_STUDENT);
        if (!stored || isLocalOnlyStudent(stored)) return;
        if (!user || user.uid !== stored.id) {
          removeStored(STORAGE_KEYS.student);
          toast({ title: "Please sign in again", message: "Your session ended.", tone: "info" });
        }
      }),
    [],
  );
}
