"use client";

import { LogOut, RotateCcw, ShieldCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { CourseInput } from "@/components/ui/CourseInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStudent } from "@/lib/auth";
import { isDemoStudent } from "@/lib/accounts";
import {
  CAMPUS_LABEL,
  DIRECTION_LABEL,
  MODE_LABEL,
  REGIONS,
  RESIDENCE_HOME,
  ROLE_LABEL,
  formatTime,
  initialsOf,
  livesOnCampus,
  roleOf,
} from "@/lib/constants";
import { resetDemoData } from "@/lib/demo";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";
import { toast } from "@/lib/toast";
import type { Campus, Region, Reservation, StudentRole, TransitMode } from "@/lib/types";

const NO_RESERVATIONS: Reservation[] = [];
const ROLE_IDS: StudentRole[] = ["commuter", "resident", "both"];
const CAMPUS_IDS = Object.keys(CAMPUS_LABEL) as Campus[];
const MODE_IDS = Object.keys(MODE_LABEL) as TransitMode[];
const SEGMENT_CLASS =
  "min-h-11 cursor-pointer rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink-700 transition hover:border-maroon-300 aria-pressed:border-maroon-700 aria-pressed:bg-maroon-700 aria-pressed:text-white";

export function ProfileView() {
  const { student, updateStudent, signOut } = useStudent();
  const [reservations] = useStoredState<Reservation[]>(STORAGE_KEYS.reservations, NO_RESERVATIONS);
  if (!student) return null;

  const active = reservations.filter((r) => r.status === "confirmed" || r.status === "waitlisted");

  const demo = isDemoStudent(student);
  const role = roleOf(student);
  const resident = role === "resident";
  const residence = student.residenceCampus ?? student.campus;
  const onCampus = livesOnCampus(student);

  const resetData = () => {
    resetDemoData(student);
    toast({
      title: "Demo data reset",
      message: demo
        ? "Vans, reservations, groups, and chats were reset."
        : "Vans and reservations were reset.",
      tone: "success",
    });
  };

  const changeRole = (next: StudentRole): void => {
    if (next === role) return;
    if (next === "commuter") {
      updateStudent({ role: next });
      return;
    }
    const home = next === "resident" ? { homeRegion: RESIDENCE_HOME[residence].region, homeArea: RESIDENCE_HOME[residence].area } : {};
    updateStudent({ role: next, residenceCampus: residence, ...home });
  };

  const changeResidence = (campus: Campus): void => {
    if (resident) {
      updateStudent({ residenceCampus: campus, homeRegion: RESIDENCE_HOME[campus].region, homeArea: RESIDENCE_HOME[campus].area });
    } else {
      updateStudent({ residenceCampus: campus });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Profile" title="Your commute" description={demo ? "Demo profile: everything here is stored only in this browser." : "Your profile is saved to your account. Reservations, groups, and chats stay in this browser."} />

      <section className="card flex animate-rise items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-maroon-700 font-display text-lg font-bold text-white ring-2 ring-gold-500 ring-offset-2">
          {initialsOf(student.name).replaceAll(".", "")}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold">{student.name}</p>
          <p className="truncate text-sm text-ink-600">{student.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip-maroon">{CAMPUS_LABEL[student.campus]}</span>
            <span className="chip">{ROLE_LABEL[role]}</span>
            {resident ? (
              <span className="chip">Lives at {residence === "rose-hill" ? "Rose Hill" : "Lincoln Center"}</span>
            ) : (
              <span className="chip">{student.homeArea}, {student.homeRegion}</span>
            )}
            <span className="chip">Arrives {formatTime(student.arrivalTime)}</span>
          </div>
        </div>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="section-title flex items-center gap-2">
          <Ticket className="h-5 w-5 text-maroon-700" /> Active reservations
        </h2>
        {active.length === 0 ? (
          <p className="mt-2 text-sm text-ink-600">
            No seats held right now.{" "}
            <Link href="/" className="font-semibold text-maroon-700 underline-offset-2 hover:underline">
              Reserve one on the live map
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {active.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="font-semibold">Van {r.vanNumber} · {DIRECTION_LABEL[r.direction]}</span>
                <span className={r.status === "confirmed" ? "chip-green" : "chip-amber"}>
                  {r.status === "confirmed" ? `Seat ${r.seat}` : `Waitlist #${r.waitlistPosition ?? 1}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-4 space-y-5 p-5">
        <h2 className="section-title">Commute details</h2>
        <fieldset>
          <legend className="label">How do you get around?</legend>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_IDS.map((r) => (
              <button key={r} type="button" aria-pressed={role === r} onClick={() => changeRole(r)} className={SEGMENT_CLASS}>
                {r === "both" ? "Both" : ROLE_LABEL[r]}
              </button>
            ))}
          </div>
          {role === "both" ? <p className="mt-1.5 text-xs text-ink-500">Commuter and resident: you live on campus and also travel from home.</p> : null}
        </fieldset>
        {onCampus ? (
          <fieldset>
            <legend className="label">Campus you live on</legend>
            <div className="grid grid-cols-2 gap-2">
              {CAMPUS_IDS.map((campus) => (
                <button key={campus} type="button" aria-pressed={residence === campus} onClick={() => changeResidence(campus)} className={SEGMENT_CLASS}>
                  {CAMPUS_LABEL[campus]}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        <fieldset>
          <legend className="label">{onCampus ? "Campus for classes" : "Home campus"}</legend>
          <div className="grid grid-cols-2 gap-2">
            {CAMPUS_IDS.map((campus) => (
              <button key={campus} type="button" aria-pressed={student.campus === campus} onClick={() => updateStudent({ campus })} className={SEGMENT_CLASS}>
                {CAMPUS_LABEL[campus]}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          {!resident ? (
            <>
              <div>
                <label className="label" htmlFor="p-region">Home region</label>
                <select
                  id="p-region"
                  className="input"
                  value={student.homeRegion}
                  onChange={(e) => updateStudent({ homeRegion: e.target.value as Region })}
                >
                  {REGIONS.map((region) => (
                    <option key={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-area">Town or neighborhood</label>
                <input
                  id="p-area"
                  className="input"
                  value={student.homeArea}
                  onChange={(e) => updateStudent({ homeArea: e.target.value })}
                />
              </div>
            </>
          ) : null}
          <div>
            <label className="label" htmlFor="p-arrival">Arrival time</label>
            <input
              id="p-arrival"
              type="time"
              className="input"
              value={student.arrivalTime}
              onChange={(e) => e.target.value && updateStudent({ arrivalTime: e.target.value })}
            />
          </div>
          {!resident ? (
            <div>
              <label className="label" htmlFor="p-mode">Commute mode</label>
              <select
                id="p-mode"
                className="input"
                value={student.commuteMode ?? "subway"}
                onChange={(e) => updateStudent({ commuteMode: e.target.value as TransitMode })}
              >
                {MODE_IDS.map((mode) => (
                  <option key={mode} value={mode}>{MODE_LABEL[mode]}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <div>
          <span className="label">Course codes</span>
          <CourseInput courses={student.courses} onChange={(courses) => updateStudent({ courses })} />
        </div>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="section-title flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-maroon-700" /> Privacy
        </h2>
        <label className="mt-3 flex cursor-pointer items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-ink-900">Show my name to matched classmates</span>
            <span className="mt-1 block text-[13px] leading-snug text-ink-600">
              {student.shareProfile
                ? `Classmates see "${student.name}" and your home area.`
                : `Classmates see "${initialsOf(student.name)}" only. Your home area is hidden.`}
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={student.shareProfile}
            checked={student.shareProfile}
            onChange={(e) => updateStudent({ shareProfile: e.target.checked })}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line transition peer-checked:bg-maroon-700 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-500 peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
          />
        </label>
      </section>

      <section className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={resetData}>
          <RotateCcw className="h-4 w-4" /> Reset demo data
        </button>
        <button type="button" className="btn-ghost" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </section>
    </div>
  );
}
