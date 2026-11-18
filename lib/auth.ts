"use client";

import { useCallback } from "react";
import { STORAGE_KEYS, removeStored, useHydrated, useStoredState } from "./storage";
import type { Student } from "./types";

const NO_STUDENT: Student | null = null;

export function isFordhamEmail(email: string): boolean {
  return /^[a-z0-9._%+-]+@fordham\.edu$/i.test(email.trim());
}

export interface UseStudent {
  /** The signed-in student, or null. Always null until `ready` is true. */
  student: Student | null;
  /** False during server render and hydration. */
  ready: boolean;
  saveStudent: (student: Student) => void;
  updateStudent: (patch: Partial<Student>) => void;
  signOut: () => void;
}

/** Mock auth: the "session" is just the Student object in localStorage. */
export function useStudent(): UseStudent {
  const ready = useHydrated();
  const [student, setStudent] = useStoredState<Student | null>(STORAGE_KEYS.student, NO_STUDENT);

  const saveStudent = useCallback((next: Student) => setStudent(next), [setStudent]);
  const updateStudent = useCallback(
    (patch: Partial<Student>) => setStudent((prev) => (prev ? { ...prev, ...patch } : prev)),
    [setStudent],
  );
  const signOut = useCallback(() => removeStored(STORAGE_KEYS.student), []);

  return { student: ready ? student : null, ready, saveStudent, updateStudent, signOut };
}
