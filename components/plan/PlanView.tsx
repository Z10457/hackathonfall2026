"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { Info, Radio } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStudent } from "@/lib/auth";
import { CAMPUS_LABEL } from "@/lib/constants";
import { planCommute, type PlanRequest } from "@/lib/planner";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";
import type { Campus, TransitOption } from "@/lib/types";
import { SORT_LABEL, type SortKey } from "./format";
import { GoogleRoutesProbe } from "./GoogleRoutesProbe";
import { PlanSkeleton } from "./PlanSkeleton";
import { PlannerCard } from "./PlannerCard";
import { PlannerForm, type PlannerFormValues } from "./PlannerForm";
import { PlannerSummary } from "./PlannerSummary";

interface PlannerPrefs {
  origin?: string;
  campus?: Campus;
  arriveBy?: string;
  sort?: SortKey;
}

const NO_PREFS: PlannerPrefs = {};
const SORT_KEYS: SortKey[] = ["fastest", "cheapest", "transfers"];

function sortOptions(options: TransitOption[], sort: SortKey): TransitOption[] {
  const compare: Record<SortKey, (a: TransitOption, b: TransitOption) => number> = {
    fastest: (a, b) => a.durationMinutes - b.durationMinutes || a.cost - b.cost,
    cheapest: (a, b) => a.cost - b.cost || a.durationMinutes - b.durationMinutes,
    transfers: (a, b) => a.transfers - b.transfers || a.durationMinutes - b.durationMinutes,
  };
  return [...options].sort(compare[sort]);
}

function PlannerBody({ google }: { google: typeof globalThis.google | undefined }) {
  const { student } = useStudent();
  const [prefs, setPrefs] = useStoredState<PlannerPrefs>(STORAGE_KEYS.plannerPrefs, NO_PREFS);

  const [values, setValues] = useState<PlannerFormValues>(() => ({
    origin: prefs.origin ?? student?.homeArea ?? "",
    campus: prefs.campus ?? student?.campus ?? "rose-hill",
    arriveBy: prefs.arriveBy ?? student?.arrivalTime ?? "09:00",
  }));
  const [sort, setSort] = useState<SortKey>(prefs.sort ?? "fastest");
  const [errors, setErrors] = useState<Partial<Record<keyof PlannerFormValues, string>>>({});
  const [results, setResults] = useState<TransitOption[] | null>(null);
  const [searched, setSearched] = useState<PlanRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const runId = useRef(0);

  const run = useCallback(
    async (next: PlannerFormValues): Promise<void> => {
      const problems: Partial<Record<keyof PlannerFormValues, string>> = {};
      if (!next.origin.trim()) problems.origin = "Enter where you are starting from.";
      if (!/^\d{2}:\d{2}$/.test(next.arriveBy)) problems.arriveBy = "Choose a time to arrive by.";
      setErrors(problems);
      if (Object.keys(problems).length > 0) return;

      const request: PlanRequest = {
        origin: next.origin.trim(),
        campus: next.campus,
        arriveBy: next.arriveBy,
        lincolnCenterPass: student?.campus === "lincoln-center",
      };
      const id = ++runId.current;
      setLoading(true);
      setPrefs((prev) => ({ ...prev, origin: request.origin, campus: request.campus, arriveBy: request.arriveBy }));
      try {
        const options = await planCommute(request, google);
        if (id !== runId.current) return;
        setResults(options);
        setSearched(request);
        setExpandedId(null);
      } catch {
        if (id !== runId.current) return;
        setResults([]);
        setSearched(request);
      } finally {
        if (id === runId.current) setLoading(false);
      }
    },
    [google, setPrefs, student?.campus],
  );

  const swapCampus = (): void => {
    const next: PlannerFormValues = { ...values, campus: values.campus === "rose-hill" ? "lincoln-center" : "rose-hill" };
    setValues(next);
    if (searched) void run(next);
  };

  const changeSort = (key: SortKey): void => {
    setSort(key);
    setPrefs((prev) => ({ ...prev, sort: key }));
  };

  const sorted = useMemo(() => (results ? sortOptions(results, sort) : []), [results, sort]);
  const live = results?.some((o) => o.source === "google") ?? false;

  return (
    <>
      <PageHeader
        eyebrow="Plan"
        title="Find your best way in"
        description="Compare the Ram Van, subway, buses, and commuter rail side by side, with the time you need to leave."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 lg:sticky lg:top-24">
          <PlannerForm
            values={values}
            homeArea={student?.homeArea}
            loading={loading}
            errors={errors}
            onChange={setValues}
            onSubmit={() => void run(values)}
            onSwapCampus={swapCampus}
          />
        </div>

        <section aria-live="polite" className="min-w-0 space-y-4">
          {loading ? (
            <PlanSkeleton />
          ) : !searched || !results ? (
            <EmptyState
              title="Where are you headed from?"
              message="Pick your starting point and arrival time, and we will line up every way to get to campus."
              action={
                <button type="button" className="btn-primary" onClick={() => void run(values)}>
                  Plan my commute
                </button>
              }
            />
          ) : sorted.length === 0 ? (
            <EmptyState
              title="No routes found"
              message="Try a nearby town or neighborhood, or a different arrival time."
              action={
                <button type="button" className="btn-secondary" onClick={swapCampus}>
                  Try {searched.campus === "rose-hill" ? CAMPUS_LABEL["lincoln-center"] : CAMPUS_LABEL["rose-hill"]}
                </button>
              }
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="section-title">
                  {searched.origin} to {CAMPUS_LABEL[searched.campus]}
                </h2>
                <span className={live ? "chip-green" : "chip-amber"}>
                  {live ? <Radio size={12} aria-hidden /> : <Info size={12} aria-hidden />}
                  {live ? "Live from Google" : "Estimated (demo data)"}
                </span>
              </div>
              <PlannerSummary options={sorted} />
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sort routes">
                <span className="text-xs font-semibold tracking-wider text-ink-500 uppercase">Sort by</span>
                {SORT_KEYS.map((key) => (
                  <button key={key} type="button" className="chip-toggle" aria-pressed={sort === key} onClick={() => changeSort(key)}>
                    {SORT_LABEL[key]}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {sorted.map((option) => (
                  <PlannerCard
                    key={option.id}
                    option={option}
                    origin={searched.origin}
                    campus={searched.campus}
                    expanded={expandedId === option.id}
                    onToggle={(id) => setExpandedId((cur) => (cur === id ? null : id))}
                  />
                ))}
              </div>
              <p className="text-xs leading-relaxed text-ink-500">
                Times and fares are estimates for a typical weekday and include a short buffer. Commuter rail fares are peak, one way.
                Check the MTA, Metro-North, LIRR, and NJ Transit for live service.
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}

export function PlanView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [google, setGoogle] = useState<typeof globalThis.google | undefined>(undefined);
  const onReady = useCallback((g: typeof globalThis.google) => setGoogle(g), []);

  return (
    <>
      {apiKey ? (
        <APIProvider apiKey={apiKey}>
          <GoogleRoutesProbe onReady={onReady} />
        </APIProvider>
      ) : null}
      <PlannerBody google={google} />
    </>
  );
}
