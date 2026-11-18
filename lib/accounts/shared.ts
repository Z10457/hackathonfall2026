import { initialsOf, isFordhamEmail, normalizeEmail } from "../constants";
import type { Student } from "../types";
import { AccountError, type GroupMember } from "./types";

export const MIN_PASSWORD_LENGTH = 8;

/** Normalizes and checks a sign-up email. Throws AccountError for anything not @fordham.edu. */
export function requireFordhamEmail(raw: string): string {
  const email = normalizeEmail(raw);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AccountError("invalid-email");
  if (!isFordhamEmail(email)) throw new AccountError("not-fordham");
  return email;
}

export function requireStrongPassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) throw new AccountError("weak-password");
}

/** Demo and pre-account profiles live only in this browser and never reach a backend. */
export function isDemoStudent(student: Pick<Student, "id">): boolean {
  return student.id.startsWith("demo-") || student.id.startsWith("stu-");
}

/**
 * The public, privacy-safe version of a profile that other signed-in students can read for
 * classmate matching. Name and town are only included when the student opted in.
 */
export function classmateCardOf(student: Student): Student {
  const card: Student = {
    id: student.id,
    name: student.shareProfile ? student.name : initialsOf(student.name),
    campus: student.campus,
    role: student.role ?? "commuter",
    homeRegion: student.homeRegion,
    homeArea: student.shareProfile ? student.homeArea : "",
    arrivalTime: student.arrivalTime,
    courses: student.courses,
    shareProfile: student.shareProfile,
  };
  return student.residenceCampus ? { ...card, residenceCampus: student.residenceCampus } : card;
}

/** One entry per id (later entries win), so a person can never be listed twice. */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export function dedupeMembers(members: GroupMember[]): GroupMember[] {
  return Array.from(new Map(members.map((m) => [`${m.groupId}__${m.uid}`, m])).values());
}

export function groupMemberDocId(groupId: string, uid: string): string {
  return `${groupId}__${uid}`;
}
