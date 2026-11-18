"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { CAMPUS_LABEL, DAYS, MODE_LABEL, REGIONS, WEEKDAYS } from "@/lib/constants";
import { makeId } from "@/lib/storage";
import type { Campus, Day, Group, Region, Student, TransitMode } from "@/lib/types";
import { Sheet } from "./Sheet";

interface CreateGroupDialogProps {
  student: Student;
  onCreate: (group: Group) => void;
  onClose: () => void;
}

interface FormState {
  name: string;
  region: Region;
  origin: string;
  route: string;
  mode: TransitMode;
  campus: Campus;
  departureTime: string;
  days: Day[];
  description: string;
}

type Errors = Partial<Record<"name" | "origin" | "route" | "departureTime" | "days", string>>;

const MODE_IDS = Object.keys(MODE_LABEL) as TransitMode[];

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 3) errors.name = "Give your group a name (at least 3 characters).";
  if (!form.origin.trim()) errors.origin = "Enter the town or neighborhood you start from.";
  if (!form.route.trim()) errors.route = "Describe the route, for example \"LIRR to Penn, then the D train\".";
  if (!/^\d{2}:\d{2}$/.test(form.departureTime)) errors.departureTime = "Pick a departure time.";
  if (form.days.length === 0) errors.days = "Choose at least one day.";
  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-maroon-700">
      {message}
    </p>
  );
}

export function CreateGroupDialog({ student, onCreate, onClose }: CreateGroupDialogProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    region: student.homeRegion,
    origin: student.homeArea,
    route: "",
    mode: student.commuteMode ?? "subway",
    campus: student.campus,
    departureTime: "07:30",
    days: WEEKDAYS,
    description: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleDay = (day: Day): void => {
    set("days", form.days.includes(day) ? form.days.filter((d) => d !== day) : [...form.days, day]);
  };

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onCreate({
      id: makeId("grp"),
      name: form.name.trim(),
      region: form.region,
      origin: form.origin.trim(),
      route: form.route.trim(),
      mode: form.mode,
      campus: form.campus,
      departureTime: form.departureTime,
      days: DAYS.filter((d) => form.days.includes(d)),
      memberCount: 1,
      description: form.description.trim(),
      isCustom: true,
      createdBy: student.id,
    });
  };

  return (
    <Sheet
      title="Create a commute group"
      subtitle="Find students who travel your way"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="create-group-form" className="btn-primary flex-1">
            Create group
          </button>
        </div>
      }
    >
      <form id="create-group-form" onSubmit={submit} noValidate className="space-y-4 px-5 py-5">
        <div>
          <label className="label" htmlFor="cg-name">Group name</label>
          <input id="cg-name" className="input" value={form.name} maxLength={60} placeholder="Hicksville 7:42 crew" aria-invalid={Boolean(errors.name)} aria-describedby="cg-name-err" onChange={(e) => set("name", e.target.value)} />
          <FieldError id="cg-name-err" message={errors.name} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cg-region">Region</label>
            <select id="cg-region" className="input" value={form.region} onChange={(e) => set("region", e.target.value as Region)}>
              {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cg-origin">Origin town</label>
            <input id="cg-origin" className="input" value={form.origin} placeholder="Hicksville" aria-invalid={Boolean(errors.origin)} aria-describedby="cg-origin-err" onChange={(e) => set("origin", e.target.value)} />
            <FieldError id="cg-origin-err" message={errors.origin} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="cg-route">Route</label>
          <input id="cg-route" className="input" value={form.route} maxLength={120} placeholder="LIRR to Penn, then D train to Fordham Rd" aria-invalid={Boolean(errors.route)} aria-describedby="cg-route-err" onChange={(e) => set("route", e.target.value)} />
          <FieldError id="cg-route-err" message={errors.route} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cg-mode">Mode</label>
            <select id="cg-mode" className="input" value={form.mode} onChange={(e) => set("mode", e.target.value as TransitMode)}>
              {MODE_IDS.map((m) => (<option key={m} value={m}>{MODE_LABEL[m]}</option>))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cg-campus">Campus</label>
            <select id="cg-campus" className="input" value={form.campus} onChange={(e) => set("campus", e.target.value as Campus)}>
              {(Object.keys(CAMPUS_LABEL) as Campus[]).map((c) => (<option key={c} value={c}>{CAMPUS_LABEL[c]}</option>))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="cg-time">Departure time</label>
          <input id="cg-time" type="time" className="input sm:max-w-48" value={form.departureTime} aria-invalid={Boolean(errors.departureTime)} aria-describedby="cg-time-err" onChange={(e) => set("departureTime", e.target.value)} />
          <FieldError id="cg-time-err" message={errors.departureTime} />
        </div>

        <div>
          <p className="label" id="cg-days-label">Days</p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="cg-days-label">
            {DAYS.map((d) => (
              <button key={d} type="button" className="chip-toggle min-w-11 justify-center" aria-pressed={form.days.includes(d)} onClick={() => toggleDay(d)}>
                {d}
              </button>
            ))}
          </div>
          <FieldError id="cg-days-err" message={errors.days} />
        </div>

        <div>
          <label className="label" htmlFor="cg-desc">Description <span className="font-normal normal-case text-ink-400">(optional)</span></label>
          <textarea id="cg-desc" className="input min-h-24 resize-y" value={form.description} maxLength={240} placeholder="Where you meet, how many cars, anything helpful." onChange={(e) => set("description", e.target.value)} />
        </div>
      </form>
    </Sheet>
  );
}
