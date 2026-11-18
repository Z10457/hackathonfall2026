"use client";

import { Ban, Flag, Hand, Lock } from "lucide-react";
import { CAMPUS_LABEL, MODE_LABEL, initialsOf } from "@/lib/constants";
import type { ClassmateMatch } from "@/lib/types";

interface ClassmateCardProps {
  match: ClassmateMatch;
  waved: boolean;
  reported: boolean;
  onWave: (match: ClassmateMatch) => void;
  onReport: (match: ClassmateMatch) => void;
  onBlock: (match: ClassmateMatch) => void;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative h-14 w-14 shrink-0" role="img" aria-label={`${score} percent match`}>
      <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" strokeWidth="4" className="stroke-maroon-100" />
        <circle cx="24" cy="24" r={radius} fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="stroke-maroon-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-ink-900">{score}%</span>
    </div>
  );
}

export function ClassmateCard({ match, waved, reported, onWave, onReport, onBlock }: ClassmateCardProps) {
  const { student, displayName, score, sharedCourses, reasons } = match;
  const isPublic = student.shareProfile;
  const avatar = initialsOf(student.name).replace(/\./g, "");
  // Private profiles expose only the broad region, never the home area.
  const place = isPublic ? `${student.homeArea}, ${student.homeRegion}` : student.homeRegion;

  return (
    <article className="card flex animate-rise flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold ${student.campus === "rose-hill" ? "bg-maroon-700 text-white" : "bg-lc-500 text-white"}`}>
          {avatar}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-lg leading-tight font-bold text-ink-900">{displayName}</h3>
            {!isPublic ? (
              <span className="chip" title="This student keeps their name and home area private">
                <Lock className="h-3 w-3" aria-hidden />
                Private profile
              </span>
            ) : null}
            {reported ? <span className="chip-amber">Reported</span> : null}
          </div>
          <p className="mt-0.5 text-sm text-ink-500">
            {place}
            {" · "}
            {CAMPUS_LABEL[student.campus]}
          </p>
          {isPublic && (student.year || student.major) ? (
            <p className="text-sm text-ink-500">{[student.year, student.major].filter(Boolean).join(" · ")}</p>
          ) : null}
          {student.commuteMode ? <p className="text-sm text-ink-500">Commutes by {MODE_LABEL[student.commuteMode]}</p> : null}
        </div>
        <ScoreRing score={score} />
      </div>

      {sharedCourses.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" aria-label="Shared courses">
          {sharedCourses.map((c) => (
            <span key={c} className="chip-gold font-semibold">{c}</span>
          ))}
        </div>
      ) : null}

      {reasons.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" aria-label="Why you match">
          {reasons.map((r) => (
            <span key={r} className="chip">{r}</span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="button" className={waved ? "btn-secondary flex-1 sm:flex-none" : "btn-primary flex-1 sm:flex-none"} disabled={waved} onClick={() => onWave(match)} aria-label={waved ? `Waved at ${displayName}` : `Wave at ${displayName}`}>
          <Hand className="h-4 w-4" aria-hidden />
          {waved ? "Waved" : "Wave"}
        </button>
        <button type="button" className="btn-secondary" disabled={reported} onClick={() => onReport(match)} aria-label={`Report ${displayName}`}>
          <Flag className="h-4 w-4" aria-hidden />
          {reported ? "Reported" : "Report"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => onBlock(match)} aria-label={`Block ${displayName}`}>
          <Ban className="h-4 w-4" aria-hidden />
          Block
        </button>
      </div>
    </article>
  );
}
