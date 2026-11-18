"use client";

import { Building2, House, Repeat } from "lucide-react";
import type { ReactNode } from "react";
import { CAMPUS_LABEL, MODE_LABEL, REGIONS } from "@/lib/constants";
import type { Campus, Region, StudentRole, TransitMode } from "@/lib/types";
import { needsHomeFields, needsResidence, type OnboardingDraft } from "./onboarding";

interface StepProps {
  draft: OnboardingDraft;
  onChange: (changes: Partial<OnboardingDraft>) => void;
}

const ROLE_OPTIONS: Array<{ role: StudentRole; title: string; detail: string; icon: typeof House }> = [
  { role: "commuter", title: "Commuter", detail: "I live off campus", icon: House },
  { role: "resident", title: "Residential", detail: "I live on campus", icon: Building2 },
  { role: "both", title: "Both", detail: "It varies", icon: Repeat },
];

const COMMUTE_MODES: TransitMode[] = ["subway", "bus", "metro-north", "lirr", "nj-transit", "ram-van", "carpool", "walk", "bike"];
const CAMPUSES = Object.keys(CAMPUS_LABEL) as Campus[];

function Header({ step, title, children }: { step: string; title: string; children: ReactNode }) {
  return (
    <header>
      <p className="eyebrow">{step}</p>
      <h2 className="mt-1 text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-ink-600">{children}</p>
    </header>
  );
}

function CampusPicker({ legend, value, onPick }: { legend: string; value: Campus; onPick: (campus: Campus) => void }) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {CAMPUSES.map((campus) => (
          <button
            key={campus}
            type="button"
            aria-pressed={value === campus}
            onClick={() => onPick(campus)}
            className="min-h-12 cursor-pointer rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink-700 transition hover:border-maroon-300 aria-pressed:border-maroon-700 aria-pressed:bg-maroon-700 aria-pressed:text-white"
          >
            {CAMPUS_LABEL[campus]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Step 2: "How do you get around?" */
export function RoleStep({ draft, onChange }: StepProps) {
  return (
    <>
      <Header step="Step 2 of 4" title="How do you get around?">
        Ram Hub works for commuters and for students who live on campus and ride between Rose Hill and Lincoln Center.
      </Header>
      <div className="space-y-2" role="radiogroup" aria-label="How do you get around?">
        {ROLE_OPTIONS.map(({ role, title, detail, icon: Icon }) => (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={draft.role === role}
            onClick={() => onChange({ role })}
            className="flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border-2 border-line bg-white px-4 py-3 text-left transition hover:border-maroon-300 aria-checked:border-maroon-700 aria-checked:bg-maroon-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-maroon-700 text-white">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-base font-bold text-ink-900">{title}</span>
              <span className="block text-sm text-ink-600">{detail}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/** Step 3: fields that depend on the role. */
export function TripDetailsStep({ draft, onChange }: StepProps) {
  const resident = draft.role === "resident";
  return (
    <>
      <Header step="Step 3 of 4" title={resident ? "Your campus life" : "Your trips"}>
        {resident
          ? "We put Ram Van trips between campuses first and suggest intercampus groups."
          : "We use this to suggest routes, groups, and classmates on your way in."}
      </Header>
      {needsResidence(draft.role) ? (
        <CampusPicker
          legend="Campus you live on"
          value={draft.residenceCampus}
          onPick={(residenceCampus) => onChange({ residenceCampus })}
        />
      ) : null}
      <CampusPicker legend="Campus for most of your classes" value={draft.campus} onPick={(campus) => onChange({ campus })} />
      {resident && draft.residenceCampus === draft.campus ? (
        <p className="rounded-xl border border-gold-400/60 bg-gold-100 px-3.5 py-2.5 text-[13px] text-ink-700">
          You can still reserve the Ram Van to {CAMPUS_LABEL[draft.campus === "rose-hill" ? "lincoln-center" : "rose-hill"]} for
          classes, events, and the city.
        </p>
      ) : null}
      {needsHomeFields(draft.role) ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="region">Home region</label>
              <select
                id="region"
                className="input"
                value={draft.homeRegion}
                onChange={(e) => onChange({ homeRegion: e.target.value as Region })}
              >
                {REGIONS.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="area">Town or neighborhood</label>
              <input
                id="area"
                placeholder="Hicksville"
                className="input"
                value={draft.homeArea}
                onChange={(e) => onChange({ homeArea: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="mode">Usual way in</label>
            <select
              id="mode"
              className="input"
              value={draft.commuteMode}
              onChange={(e) => onChange({ commuteMode: e.target.value as TransitMode })}
            >
              {COMMUTE_MODES.map((mode) => (
                <option key={mode} value={mode}>{MODE_LABEL[mode]}</option>
              ))}
            </select>
          </div>
        </>
      ) : null}
      <div>
        <label className="label" htmlFor="arrival">
          {resident ? "Usual time you need to be at class" : "Usual arrival time on campus"}
        </label>
        <input
          id="arrival"
          type="time"
          className="input"
          value={draft.arrivalTime}
          onChange={(e) => onChange({ arrivalTime: e.target.value })}
        />
      </div>
    </>
  );
}
