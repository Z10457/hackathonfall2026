"use client";

import { Clock, ExternalLink, MapPin, Route, Ticket } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CAMPUS_LABEL, RAM_VAN_FARE, isPeakHour } from "@/lib/constants";
import { CAMPUSES } from "@/lib/routes";
import type { Campus, Student } from "@/lib/types";
import { VanMap } from "./VanMap";

/** Official Ram Van page, where students reserve real seats. */
const RAM_VAN_URL = "https://www.fordham.edu/ramvan";

// Published weekday service: about every 30 minutes, 6:15 AM to midnight.
const FIRST_DEPARTURE_MIN = 6 * 60 + 15;
const LAST_DEPARTURE_MIN = 23 * 60 + 45;
const HEADWAY_MIN = 30;
const SHOWN_DEPARTURES = 4;

const NO_VANS: never[] = [];
const noop = () => {};

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/** New York wall-clock time, so the schedule is right wherever the viewer is. */
function nycClock(now: Date): { minutes: number; weekday: boolean } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  const weekday = !["Sat", "Sun"].includes(get("weekday"));
  return { minutes, weekday };
}

function formatClock(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatWait(minutes: number): string {
  if (minutes <= 0) return "Now";
  if (minutes < 60) return `in ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `in ${h} h` : `in ${h} h ${m} min`;
}

interface Departure {
  minutes: number;
  wait: number;
  tomorrow: boolean;
}

function nextDepartures(nowMinutes: number, weekday: boolean): Departure[] {
  const out: Departure[] = [];
  if (weekday) {
    for (let t = FIRST_DEPARTURE_MIN; t <= LAST_DEPARTURE_MIN && out.length < SHOWN_DEPARTURES; t += HEADWAY_MIN) {
      if (t >= nowMinutes) out.push({ minutes: t, wait: t - nowMinutes, tomorrow: false });
    }
  }
  return out;
}

function DepartureBoard({ from, nowMinutes, weekday }: { from: Campus; nowMinutes: number; weekday: boolean }) {
  const to: Campus = from === "rose-hill" ? "lincoln-center" : "rose-hill";
  const departures = nextDepartures(nowMinutes, weekday);
  const accent = to === "rose-hill" ? "bg-maroon-700" : "bg-lc-600";
  return (
    <section className="card p-4">
      <header className="flex items-start gap-3">
        <span aria-hidden className={`mt-1 h-3 w-3 shrink-0 rounded-full ${accent}`} />
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold leading-tight">
            {CAMPUS_LABEL[from]} → {CAMPUS_LABEL[to]}
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-[13px] leading-snug text-ink-600">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {CAMPUSES[from].pickup}
          </p>
        </div>
      </header>
      {departures.length > 0 ? (
        <ul className="mt-3 divide-y divide-line">
          {departures.map((d, i) => (
            <li key={d.minutes} className="flex items-center justify-between py-2.5">
              <span className={`font-semibold ${i === 0 ? "text-ink-900" : "text-ink-700"}`}>{formatClock(d.minutes)}</span>
              <span className={i === 0 ? "chip-maroon" : "chip"}>{formatWait(d.wait)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl bg-paper px-3 py-2.5 text-sm text-ink-700">
          {weekday
            ? "No more scheduled departures today. Service resumes at 6:15 AM."
            : "Weekday schedule runs Monday to Friday. Check the Ram Van site for weekend service."}
        </p>
      )}
    </section>
  );
}

/** What signed-in students see: the real route, pickups, and timetable. No simulated vans. */
export function ScheduleView({ student }: { student: Student }) {
  const now = useNow();
  const { minutes, weekday } = useMemo(() => nycClock(now), [now]);
  const peak = weekday && isPeakHour(now);
  const home = student.campus;
  const other: Campus = home === "rose-hill" ? "lincoln-center" : "rose-hill";

  return (
    <div>
      <PageHeader
        eyebrow="Ram Van"
        title="Your Ram Van schedule"
        description="Next departures between Rose Hill and Lincoln Center, the route, and where to board."
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="card relative h-[50vh] min-h-[380px] overflow-hidden lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)] lg:min-h-[560px]">
          <VanMap vans={NO_VANS} traffic="light" selectedId={null} onSelect={noop} scheduleOnly />
        </div>
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-2 text-[13px]">
            <span className="chip">
              <Clock className="h-3.5 w-3.5" aria-hidden /> About every 30 min, 6:15 AM to midnight, weekdays
            </span>
            <span className="chip">
              <Ticket className="h-3.5 w-3.5" aria-hidden /> ${RAM_VAN_FARE.toFixed(2)} one way
            </span>
            {peak ? <span className="chip-maroon">Peak hour: vans 5 and 6 add seats</span> : null}
          </div>

          <DepartureBoard from={home} nowMinutes={minutes} weekday={weekday} />
          <DepartureBoard from={other} nowMinutes={minutes} weekday={weekday} />

          <section className="card space-y-3 p-4">
            <h2 className="font-display text-lg font-bold">Reserve a seat</h2>
            <p className="text-sm leading-relaxed text-ink-600">
              Seats are reserved through Fordham, up to 48 hours ahead. An unclaimed seat is released one minute after
              departure, and you scan your QR code when you board.
            </p>
            <a href={RAM_VAN_URL} target="_blank" rel="noreferrer" className="btn-primary w-full">
              Reserve on Fordham&apos;s Ram Van site <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
            <Link href="/plan" className="btn-secondary w-full">
              <Route className="h-4 w-4" aria-hidden /> Compare other ways to campus
            </Link>
          </section>

          <p className="text-xs leading-relaxed text-ink-500">
            Times follow the published weekday pattern; holidays and service changes can differ, so confirm on the Ram
            Van site. Live van positions will appear here once Fordham shares its van GPS feed.
          </p>
        </div>
      </div>
    </div>
  );
}
