import { initialsOf, toMinutes } from "./constants";
import type { ClassmateMatch, Student } from "./types";

/** Maximum points per factor. They sum to 100. */
const MAX_COURSE_POINTS = 50;
const MAX_ROUTE_POINTS = 25;
const MAX_ARRIVAL_POINTS = 15;
const CAMPUS_POINTS = 10;

const REGION_POINTS = 15;
const AREA_POINTS = 10;

export interface MatchOptions {
  /** Student ids that must never appear (blocked by the signed-in student). */
  blockedIds?: string[];
}

/** Full name when the student opted in to sharing, otherwise initials such as "J.M.". */
export function displayNameFor(student: Student): string {
  return student.shareProfile ? student.name : initialsOf(student.name);
}

function normalizeCourse(code: string): string {
  return code.trim().replace(/\s+/g, " ").toUpperCase();
}

function sharedCoursesOf(me: Student, other: Student): string[] {
  const mine = new Set(me.courses.map(normalizeCourse));
  const seen = new Set<string>();
  return other.courses
    .map(normalizeCourse)
    .filter((code) => {
      if (!mine.has(code) || seen.has(code)) return false;
      seen.add(code);
      return true;
    });
}

/** 1 shared class is worth 30, 2 is 42, 3 or more reaches the 50 cap. */
function coursePoints(count: number): number {
  if (count <= 0) return 0;
  return Math.min(MAX_COURSE_POINTS, 30 + (count - 1) * 12);
}

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function arrivalGap(me: Student, other: Student): number {
  return Math.abs(toMinutes(me.arrivalTime) - toMinutes(other.arrivalTime));
}

function scoreOne(me: Student, other: Student): ClassmateMatch {
  const sharedCourses = sharedCoursesOf(me, other);
  const reasons: string[] = [];
  let score = coursePoints(sharedCourses.length);

  if (sharedCourses.length > 0) {
    reasons.push(`${sharedCourses.length} shared ${sharedCourses.length === 1 ? "class" : "classes"}`);
  }

  if (me.homeRegion === other.homeRegion) {
    let route = REGION_POINTS;
    // The area is only ever compared and revealed when the classmate opted in.
    if (other.shareProfile && sameText(me.homeArea, other.homeArea)) {
      route += AREA_POINTS;
      reasons.push(`Same neighborhood: ${other.homeArea}`);
    } else {
      reasons.push(`Also from ${other.homeRegion}`);
    }
    score += Math.min(route, MAX_ROUTE_POINTS);
  }

  const gap = arrivalGap(me, other);
  if (gap <= 30) {
    score += MAX_ARRIVAL_POINTS;
    reasons.push(gap === 0 ? "Arrives at the same time as you" : `Arrives within ${Math.max(5, Math.ceil(gap / 5) * 5)} min of you`);
  } else if (gap <= 60) {
    score += Math.round(MAX_ARRIVAL_POINTS / 2);
    reasons.push("Arrives within an hour of you");
  }

  if (me.campus === other.campus) {
    score += CAMPUS_POINTS;
    reasons.push(other.campus === "rose-hill" ? "Also at Rose Hill" : "Also at Lincoln Center");
  }

  return {
    student: other,
    score: Math.max(0, Math.min(100, Math.round(score))),
    sharedCourses,
    reasons,
    displayName: displayNameFor(other),
  };
}

/** Ranked classmates for `me`. Excludes me, blocked students and anyone scoring 0. */
export function matchClassmates(
  me: Student,
  candidates: Student[],
  options: MatchOptions = {},
): ClassmateMatch[] {
  const blocked = new Set(options.blockedIds ?? []);
  return candidates
    .filter((c) => c.id !== me.id && !blocked.has(c.id))
    .map((c) => scoreOne(me, c))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || b.sharedCourses.length - a.sharedCourses.length || a.student.id.localeCompare(b.student.id));
}
