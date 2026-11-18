"use client";

import { ArrowLeftRight, Search } from "lucide-react";
import type { FormEvent } from "react";
import { CAMPUS_LABEL } from "@/lib/constants";
import type { Campus } from "@/lib/types";
import { OriginPicker } from "./OriginPicker";
import { OriginQuickPicks } from "./OriginQuickPicks";

export interface PlannerFormValues {
  origin: string;
  campus: Campus;
  arriveBy: string;
}

interface PlannerFormProps {
  values: PlannerFormValues;
  homeArea?: string;
  loading: boolean;
  errors: Partial<Record<keyof PlannerFormValues, string>>;
  onChange: (next: PlannerFormValues) => void;
  onSubmit: () => void;
  onSwapCampus: () => void;
}

const CAMPUS_ORDER: Campus[] = ["rose-hill", "lincoln-center"];

export function PlannerForm({ values, homeArea, loading, errors, onChange, onSubmit, onSwapCampus }: PlannerFormProps) {
  const other: Campus = values.campus === "rose-hill" ? "lincoln-center" : "rose-hill";
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="card space-y-5 p-4 sm:p-5" onSubmit={submit} noValidate>
      <OriginPicker value={values.origin} error={errors.origin} onChange={(origin) => onChange({ ...values, origin })} />
      <OriginQuickPicks value={values.origin} homeArea={homeArea} onPick={(origin) => onChange({ ...values, origin })} />

      <div>
        <span className="label" id="plan-campus-label">Going to</span>
        <div role="radiogroup" aria-labelledby="plan-campus-label" className="grid grid-cols-2 gap-2">
          {CAMPUS_ORDER.map((campus) => {
            const selected = values.campus === campus;
            const tone = campus === "rose-hill" ? "border-maroon-700 bg-maroon-700 text-white" : "border-lc-500 bg-lc-500 text-white";
            return (
              <button
                key={campus}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`min-h-12 cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold transition ${selected ? tone : "border-line bg-white text-ink-900 hover:border-maroon-300"}`}
                onClick={() => onChange({ ...values, campus })}
              >
                {CAMPUS_LABEL[campus]}
              </button>
            );
          })}
        </div>
        <button type="button" className="btn-ghost btn-sm mt-2" onClick={onSwapCampus}>
          <ArrowLeftRight size={14} aria-hidden /> Swap to {CAMPUS_LABEL[other]}
        </button>
      </div>

      <div>
        <label className="label" htmlFor="plan-arrive">Arrive by</label>
        <input
          id="plan-arrive"
          type="time"
          className="input"
          value={values.arriveBy}
          aria-invalid={errors.arriveBy ? true : undefined}
          onChange={(e) => onChange({ ...values, arriveBy: e.target.value })}
        />
        {errors.arriveBy ? <p className="mt-1.5 text-xs font-medium text-maroon-700">{errors.arriveBy}</p> : null}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        <Search size={16} aria-hidden /> {loading ? "Planning..." : "Compare routes"}
      </button>
    </form>
  );
}
