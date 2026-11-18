"use client";

import { EyeOff, Eye, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStudent } from "@/lib/auth";
import { dedupeById, isDemoStudent } from "@/lib/accounts";
import { useClassmateCards } from "@/lib/accounts/hooks";
import { initialsOf } from "@/lib/constants";
import { matchClassmates } from "@/lib/matching";
import { MOCK_STUDENTS } from "@/lib/mockData";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";
import { toast } from "@/lib/toast";
import type { ClassmateMatch, Student } from "@/lib/types";
import { ClassmateCard } from "./ClassmateCard";
import { ReportDialog } from "./ReportDialog";
import { SafetyTips } from "./SafetyTips";

const NO_IDS: string[] = [];
const STRONG_MATCH = 50;

function PrivacyBanner({ student }: { student: Student }) {
  const open = student.shareProfile;
  const Icon = open ? Eye : EyeOff;
  return (
    <div className="card mb-5 flex flex-wrap items-center gap-3 border-maroon-100 bg-maroon-50/60 px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-maroon-700" aria-hidden />
      <p className="min-w-0 flex-1 text-sm text-ink-700">
        {open ? "Classmates can see your name." : <>You appear as <strong>{initialsOf(student.name)}</strong> to classmates.</>}
      </p>
      <Link href="/profile" className="btn-ghost btn-sm">Change in Profile</Link>
    </div>
  );
}

export function ClassmatesView() {
  const { student } = useStudent();
  const [blocked, setBlocked] = useStoredState<string[]>(STORAGE_KEYS.blocked, NO_IDS);
  const [reported, setReported] = useStoredState<string[]>(STORAGE_KEYS.reported, NO_IDS);
  const [waved, setWaved] = useState<string[]>([]);
  const [course, setCourse] = useState<string | null>(null);
  const [strongOnly, setStrongOnly] = useState(false);
  const [reporting, setReporting] = useState<ClassmateMatch | null>(null);
  const [showBlocked, setShowBlocked] = useState(false);

  const realAccount = student ? !isDemoStudent(student) : false;
  // Real accounts see every other real account live (each once); the demo profile sees sample students.
  const { cards: realPeople, error: loadError } = useClassmateCards(realAccount);

  const candidates = useMemo(() => dedupeById(realAccount ? (realPeople ?? []) : MOCK_STUDENTS), [realAccount, realPeople]);
  const matches = useMemo(
    () =>
      student
        ? matchClassmates(student, candidates, { blockedIds: blocked, includeZeroScores: realAccount }).map((m) =>
            // Real cards already hold the privacy-safe name (initials unless opted in).
            realAccount ? { ...m, displayName: m.student.name } : m,
          )
        : [],
    [student, candidates, blocked, realAccount],
  );
  const shown = useMemo(
    () =>
      matches.filter(
        (m) => (!course || m.sharedCourses.includes(course)) && (!strongOnly || m.score >= STRONG_MATCH),
      ),
    [matches, course, strongOnly],
  );
  const blockedPeople = useMemo(() => candidates.filter((s) => blocked.includes(s.id)), [candidates, blocked]);

  if (!student) return null;
  const hasCourses = student.courses.length > 0;

  const onWave = (m: ClassmateMatch): void => {
    setWaved((prev) => [...prev, m.student.id]);
    toast({ title: "Wave sent", message: `${m.displayName} will see your wave.`, tone: "success" });
  };
  const onBlock = (m: ClassmateMatch): void => {
    setBlocked((prev) => (prev.includes(m.student.id) ? prev : [...prev, m.student.id]));
    toast({ title: "Blocked", message: `${m.displayName} is hidden. Undo from Blocked below.`, tone: "info" });
  };
  const onUnblock = (s: Student): void => {
    setBlocked((prev) => prev.filter((id) => id !== s.id));
    toast({ title: "Unblocked", message: `${s.shareProfile ? s.name : initialsOf(s.name)} is visible again.`, tone: "info" });
  };
  const submitReport = (reason: string): void => {
    if (!reporting) return;
    const id = reporting.student.id;
    setReported((prev) => (prev.includes(id) ? prev : [...prev, id]));
    toast({ title: "Report submitted", message: `Thank you. Reason: ${reason}.`, tone: "success" });
    setReporting(null);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Classmates"
        title="Same classes, same route"
        description="Meet students who share your courses and commute. Your privacy setting controls what they see."
      />
      <PrivacyBanner student={student} />

      {!hasCourses ? (
        <div className="mb-5">
          <EmptyState
            title="Add your courses"
            message="Add your course codes in your profile to find classmates in the same classes. Route matches are shown below."
            action={<Link href="/profile" className="btn-primary">Go to Profile</Link>}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0">
          <section aria-label="Filter classmates" className="card mb-4 space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink-700" aria-live="polite">
                {shown.length} {shown.length === 1 ? "classmate" : "classmates"}
              </p>
              <button type="button" className="chip-toggle" aria-pressed={strongOnly} onClick={() => setStrongOnly((v) => !v)}>
                Strong matches ({STRONG_MATCH}%+)
              </button>
            </div>
            {hasCourses ? (
              <div>
                <p className="label">Class</p>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
                  <button type="button" className="chip-toggle shrink-0" aria-pressed={course === null} onClick={() => setCourse(null)}>All</button>
                  {student.courses.map((c) => (
                    <button key={c} type="button" className="chip-toggle shrink-0 whitespace-nowrap" aria-pressed={course === c} onClick={() => setCourse(course === c ? null : c)}>{c}</button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {shown.length === 0 ? (
            <EmptyState
              title="No classmates to show"
              message={
                matches.length === 0
                  ? loadError
                    ? "Could not load classmates right now. Check your connection and try again."
                    : realAccount && realPeople === null
                      ? "Finding classmates..."
                      : "No matches yet. Share Ram Hub with your classmates so you can find each other."
                  : "Try a different class or turn off the strong match filter."
              }
              action={
                course || strongOnly ? (
                  <button type="button" className="btn-secondary" onClick={() => { setCourse(null); setStrongOnly(false); }}>Clear filters</button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {shown.map((m) => (
                <ClassmateCard key={m.student.id} match={m} waved={waved.includes(m.student.id)} reported={reported.includes(m.student.id)} onWave={onWave} onReport={setReporting} onBlock={onBlock} />
              ))}
            </div>
          )}

          {blockedPeople.length > 0 ? (
            <section className="mt-6" aria-label="Blocked classmates">
              <button type="button" className="btn-ghost btn-sm" aria-expanded={showBlocked} onClick={() => setShowBlocked((v) => !v)}>
                <ShieldOff className="h-4 w-4" aria-hidden />
                Blocked ({blockedPeople.length})
              </button>
              {showBlocked ? (
                <ul className="card mt-2 divide-y divide-line">
                  {blockedPeople.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="text-sm font-semibold text-ink-900">{s.shareProfile ? s.name : initialsOf(s.name)}</span>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => onUnblock(s)}>Unblock</button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-24">
          <SafetyTips />
        </div>
      </div>

      {reporting ? <ReportDialog name={reporting.displayName} onSubmit={submitReport} onClose={() => setReporting(null)} /> : null}
    </div>
  );
}
