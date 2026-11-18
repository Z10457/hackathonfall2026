"use client";

import { useSyncExternalStore } from "react";
import { isPeakHour } from "./constants";
import { CAMPUSES, ROUTE_LENGTH_MILES, originOf, pointAtProgress } from "./routes";
import type { Direction, TrafficLevel, Van } from "./types";
import { VAN_CAPACITY } from "./types";

/**
 * Ram Van simulation. Fordham has no public live feed, so every van, seat and delay here is
 * simulated. One module-level store keeps state across page navigation; consumers subscribe
 * with useVanSimulation(). All updates build new objects (nothing is mutated in place).
 */

export interface SimSnapshot {
  vans: Van[];
  traffic: TrafficLevel;
  /** ms epoch of the simulated clock. */
  simTime: number;
  speedMultiplier: number;
}

type Phase = "driving" | "layover" | "boarding";

interface SimVan {
  id: string;
  number: number;
  direction: Direction;
  progress: number;
  phase: Phase;
  phaseMsLeft: number;
  speedMph: number;
  jitter: number;
  slowUntil: number;
  slowFactor: number;
  slowMinutes: number;
  takenSeats: number[];
  /** Seats held by the signed-in student. Random seat churn never touches these. */
  mine: number[];
  othersWaiting: number;
  studentWaiting: boolean;
  /** Real-time ms at which a seat opens for a waitlisted student (demo friendly). */
  openAtReal: number | null;
  /** True after fillVan, so random cancellations do not undo a staged full van. */
  locked: boolean;
  departureMs: number;
}

interface SimState {
  vans: SimVan[];
  traffic: TrafficLevel;
  simTime: number;
  speedMultiplier: number;
  peakOverride: boolean | null;
  epoch: number;
}

const TICK_MS = 250;
const MAX_REAL_DT_MS = 5000;
const MINUTE = 60_000;
const LAYOVER_MS = 2 * MINUTE;
const BOARDING_MS = 3 * MINUTE;
const TRAFFIC_SPEED: Record<TrafficLevel, number> = { light: 22, moderate: 17, heavy: 13.5 };
const TRAFFIC_ORDER: TrafficLevel[] = ["light", "moderate", "heavy"];
const SEAT_EVENT_CHANCE = 0.006;
const SLOWDOWN_PER_SIM_MINUTE = 0.012;

const EMPTY_SNAPSHOT: SimSnapshot = { vans: [], traffic: "moderate", simTime: 0, speedMultiplier: 1 };

const rand = (min: number, max: number): number => min + Math.random() * (max - min);
const randInt = (min: number, max: number): number => Math.floor(rand(min, max + 1));
const flip = (d: Direction): Direction => (d === "to-rose-hill" ? "to-lincoln-center" : "to-rose-hill");
const allSeats = (): number[] => Array.from({ length: VAN_CAPACITY }, (_, i) => i + 1);

function shuffled<T>(items: T[]): T[] {
  return items
    .map((item) => ({ item, key: Math.random() }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.item);
}

function randomSeats(count: number): number[] {
  return shuffled(allSeats())
    .slice(0, count)
    .sort((a, b) => a - b);
}

function nominalSpeed(sv: SimVan, traffic: TrafficLevel): number {
  return TRAFFIC_SPEED[traffic] * sv.jitter;
}

function newTrip(sv: SimVan, simNow: number, direction: Direction): SimVan {
  const fresh = randomSeats(randInt(4, 13));
  const takenSeats = [...new Set([...fresh, ...sv.mine])].sort((a, b) => a - b);
  const full = takenSeats.length >= VAN_CAPACITY;
  return {
    ...sv,
    direction,
    progress: 0,
    phase: "layover",
    phaseMsLeft: LAYOVER_MS,
    speedMph: 0,
    slowUntil: 0,
    takenSeats,
    othersWaiting: full ? randInt(1, 3) : 0,
    studentWaiting: sv.studentWaiting,
    openAtReal: null,
    locked: false,
    departureMs: simNow + LAYOVER_MS + BOARDING_MS,
  };
}

function toVan(sv: SimVan, traffic: TrafficLevel, simNow: number): Van {
  const point = pointAtProgress(sv.progress, sv.direction);
  const nominal = nominalSpeed(sv, traffic);
  const delayed = sv.phase === "driving" && sv.slowUntil > simNow;
  const speed = Math.max(sv.speedMph, 3);
  const etaMinutes =
    sv.phase === "driving"
      ? ((1 - sv.progress) * ROUTE_LENGTH_MILES * 60) / speed
      : sv.phaseMsLeft / MINUTE +
        (sv.phase === "layover" ? BOARDING_MS / MINUTE : 0) +
        (ROUTE_LENGTH_MILES * 60) / nominal;
  const status: Van["status"] =
    sv.phase === "layover"
      ? "layover"
      : sv.phase === "boarding"
        ? "boarding"
        : delayed
          ? "delayed"
          : etaMinutes < 3
            ? "arriving"
            : "on-time";
  return {
    id: sv.id,
    number: sv.number,
    direction: sv.direction,
    position: point.position,
    progress: sv.progress,
    heading: point.heading,
    status,
    speedMph: sv.phase === "driving" ? Math.round(sv.speedMph * 10) / 10 : 0,
    etaMinutes: Math.max(0, Math.round(etaMinutes)),
    nextStop:
      sv.phase === "driving" ? point.nextStop : `Pickup at ${CAMPUSES[originOf(sv.direction)].name}`,
    delayMinutes: delayed ? sv.slowMinutes : 0,
    capacity: VAN_CAPACITY,
    takenSeats: sv.takenSeats,
    waitlistCount: sv.othersWaiting + (sv.studentWaiting ? 1 : 0),
    departureTime: new Date(sv.departureMs).toISOString(),
    peakOnly: sv.number >= 5,
  };
}

function stepSeats(sv: SimVan): SimVan {
  if (Math.random() > SEAT_EVENT_CHANCE) return sv;
  const free = allSeats().filter((s) => !sv.takenSeats.includes(s));
  const cancellable = sv.takenSeats.filter((s) => !sv.mine.includes(s));
  const book = free.length > 0 && (cancellable.length === 0 || sv.takenSeats.length <= 3 || (!sv.locked && Math.random() < 0.5));
  if (book && free.length > 1) {
    const seat = free[randInt(0, free.length - 1)];
    return { ...sv, takenSeats: [...sv.takenSeats, seat].sort((a, b) => a - b) };
  }
  if (!sv.locked && cancellable.length > 0 && sv.takenSeats.length > 3) {
    const seat = cancellable[randInt(0, cancellable.length - 1)];
    return { ...sv, takenSeats: sv.takenSeats.filter((s) => s !== seat) };
  }
  return sv;
}

function stepWaitlist(sv: SimVan, realNow: number): SimVan {
  if (!sv.studentWaiting || sv.openAtReal === null || realNow < sv.openAtReal) return sv;
  const cancellable = sv.takenSeats.filter((s) => !sv.mine.includes(s));
  if (cancellable.length === 0) return { ...sv, openAtReal: null };
  const seat = cancellable[randInt(0, cancellable.length - 1)];
  return { ...sv, takenSeats: sv.takenSeats.filter((s) => s !== seat), openAtReal: null, locked: false };
}

function stepVan(
  sv: SimVan,
  ctx: { dtSim: number; dtReal: number; simNow: number; realNow: number; traffic: TrafficLevel },
): SimVan {
  const seated = stepWaitlist(stepSeats(sv), ctx.realNow);
  if (seated.phase === "layover" || seated.phase === "boarding") {
    const left = seated.phaseMsLeft - ctx.dtSim;
    if (left > 0) return { ...seated, phaseMsLeft: left };
    return seated.phase === "layover"
      ? { ...seated, phase: "boarding", phaseMsLeft: BOARDING_MS + left }
      : { ...seated, phase: "driving", phaseMsLeft: 0, speedMph: 0, progress: 0 };
  }
  const delayed = seated.slowUntil > ctx.simNow;
  const startsSlowdown =
    !delayed && Math.random() < (ctx.dtSim / MINUTE) * SLOWDOWN_PER_SIM_MINUTE;
  const minutes = startsSlowdown ? randInt(3, 8) : seated.slowMinutes;
  const slowFactor = startsSlowdown ? 0.45 : seated.slowFactor;
  const slowUntil = startsSlowdown ? ctx.simNow + (minutes * MINUTE) / (1 - slowFactor) : seated.slowUntil;
  const slowed = slowUntil > ctx.simNow;
  const target = nominalSpeed(seated, ctx.traffic) * (slowed ? slowFactor : 1);
  const speedMph = seated.speedMph + (target - seated.speedMph) * Math.min(1, ctx.dtReal / 4000);
  const progress = seated.progress + (speedMph * (ctx.dtSim / 3_600_000)) / ROUTE_LENGTH_MILES;
  const moved = { ...seated, speedMph, progress, slowUntil, slowFactor, slowMinutes: minutes };
  return progress >= 1 ? newTrip(moved, ctx.simNow, flip(moved.direction)) : moved;
}

function driftTraffic(current: TrafficLevel, dtSim: number): TrafficLevel {
  if (Math.random() > (dtSim / MINUTE) * 0.03) return current;
  const idx = TRAFFIC_ORDER.indexOf(current);
  const next = idx === 1 ? (Math.random() < 0.5 ? 0 : 2) : 1;
  return TRAFFIC_ORDER[next];
}

const START_LAYOUT: Array<{ number: number; direction: Direction; progress: number; layover?: boolean }> = [
  { number: 1, direction: "to-lincoln-center", progress: 0.62 },
  { number: 2, direction: "to-rose-hill", progress: 0.34 },
  { number: 3, direction: "to-lincoln-center", progress: 0, layover: true },
  { number: 4, direction: "to-rose-hill", progress: 0.8 },
  { number: 5, direction: "to-lincoln-center", progress: 0.4 },
  { number: 6, direction: "to-rose-hill", progress: 0.58 },
];

function createInitial(epoch: number): SimState {
  const simTime = Date.now();
  const traffic: TrafficLevel = "moderate";
  const tripMs = (ROUTE_LENGTH_MILES / TRAFFIC_SPEED[traffic]) * 3_600_000;
  const vans = START_LAYOUT.map((spec): SimVan => {
    const progress = spec.layover ? 0 : Math.min(0.9, Math.max(0.08, spec.progress + rand(-0.05, 0.05)));
    const taken = randomSeats(randInt(4, 13));
    return {
      id: `van-${spec.number}`,
      number: spec.number,
      direction: spec.direction,
      progress,
      phase: spec.layover ? "layover" : "driving",
      phaseMsLeft: spec.layover ? 2.5 * MINUTE : 0,
      speedMph: spec.layover ? 0 : TRAFFIC_SPEED[traffic],
      jitter: rand(0.92, 1.08),
      slowUntil: 0,
      slowFactor: 0.45,
      slowMinutes: 0,
      takenSeats: taken,
      mine: [],
      othersWaiting: 0,
      studentWaiting: false,
      openAtReal: null,
      locked: false,
      departureMs: spec.layover ? simTime + 2.5 * MINUTE + BOARDING_MS : simTime - progress * tripMs,
    };
  });
  return { vans, traffic, simTime, speedMultiplier: 1, peakOverride: null, epoch };
}

/* ------------------------------------------------------------------ store */

let state: SimState | null = null;
let snapshot: SimSnapshot = EMPTY_SNAPSHOT;
let timer: ReturnType<typeof setInterval> | null = null;
let lastReal = 0;
let epochCounter = 1;
const listeners = new Set<() => void>();

const isPeak = (s: SimState): boolean => s.peakOverride ?? isPeakHour(new Date(s.simTime));

function ensureState(): SimState {
  if (state === null) {
    state = createInitial(epochCounter);
    snapshot = buildSnapshot(state);
  }
  return state;
}

function buildSnapshot(s: SimState): SimSnapshot {
  const peak = isPeak(s);
  const vans = s.vans
    .filter((sv) => sv.number < 5 || peak)
    .map((sv) => toVan(sv, s.traffic, s.simTime));
  return { vans, traffic: s.traffic, simTime: s.simTime, speedMultiplier: s.speedMultiplier };
}

function commit(next: SimState): void {
  state = next;
  snapshot = buildSnapshot(next);
  listeners.forEach((listener) => listener());
}

function tick(): void {
  const current = ensureState();
  const realNow = Date.now();
  const dtReal = Math.min(MAX_REAL_DT_MS, Math.max(0, realNow - lastReal));
  lastReal = realNow;
  const dtSim = dtReal * current.speedMultiplier;
  const simNow = current.simTime + dtSim;
  const traffic = driftTraffic(current.traffic, dtSim);
  const vans = current.vans.map((sv) => stepVan(sv, { dtSim, dtReal, simNow, realNow, traffic }));
  commit({ ...current, vans, traffic, simTime: simNow });
}

function ensureTicker(): void {
  if (timer !== null || typeof window === "undefined") return;
  lastReal = Date.now();
  timer = setInterval(tick, TICK_MS);
}

function subscribe(listener: () => void): () => void {
  ensureState();
  ensureTicker();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function updateVan(vanId: string, change: (sv: SimVan) => SimVan): SimVan | null {
  const current = ensureState();
  const target = current.vans.find((sv) => sv.id === vanId);
  if (!target) return null;
  const updated = change(target);
  commit({ ...current, vans: current.vans.map((sv) => (sv.id === vanId ? updated : sv)) });
  return updated;
}

function visibleVans(s: SimState): SimVan[] {
  const peak = isPeak(s);
  return s.vans.filter((sv) => sv.number < 5 || peak);
}

function etaOf(s: SimState, sv: SimVan): number {
  return toVan(sv, s.traffic, s.simTime).etaMinutes;
}

function asVan(sv: SimVan | null): Van | null {
  const s = ensureState();
  return sv ? toVan(sv, s.traffic, s.simTime) : null;
}

export const vanSim = {
  getSnapshot(): SimSnapshot {
    ensureState();
    return snapshot;
  },

  subscribe,

  /** Increments on every reset. Lets reservation logic re-apply seats to a fresh simulation. */
  getEpoch(): number {
    return ensureState().epoch;
  },

  setSpeedMultiplier(multiplier: number): void {
    const safe = Number.isFinite(multiplier) ? Math.min(60, Math.max(0.25, multiplier)) : 1;
    commit({ ...ensureState(), speedMultiplier: safe });
  },

  setPeakOverride(value: boolean | null): void {
    commit({ ...ensureState(), peakOverride: value });
  },

  injectDelay(vanId?: string, minutes = 8): Van | null {
    const s = ensureState();
    const driving = visibleVans(s).filter((sv) => sv.phase === "driving");
    const pool = driving.length > 0 ? driving : visibleVans(s);
    const chosen = vanId
      ? pool.find((sv) => sv.id === vanId) ?? s.vans.find((sv) => sv.id === vanId)
      : [...pool].sort((a, b) => etaOf(s, a) - etaOf(s, b))[0];
    if (!chosen) return null;
    const factor = 0.35;
    const delay = Math.max(1, Math.round(minutes));
    return asVan(
      updateVan(chosen.id, (sv) => ({
        ...sv,
        slowFactor: factor,
        slowMinutes: delay,
        slowUntil: s.simTime + (delay * MINUTE) / (1 - factor),
      })),
    );
  },

  fillVan(vanId?: string): Van | null {
    const s = ensureState();
    const open = visibleVans(s).filter((sv) => sv.takenSeats.length < VAN_CAPACITY);
    const preferred =
      open.find((sv) => sv.phase !== "driving" && sv.mine.length === 0) ??
      [...open].sort((a, b) => etaOf(s, a) - etaOf(s, b))[0];
    const targetId = vanId ?? preferred?.id;
    if (!targetId) return null;
    return asVan(
      updateVan(targetId, (sv) => ({
        ...sv,
        takenSeats: allSeats(),
        locked: true,
        othersWaiting: Math.max(sv.othersWaiting, randInt(1, 3)),
      })),
    );
  },

  reserveSeat(vanId: string, seat: number): boolean {
    const s = ensureState();
    const target = s.vans.find((sv) => sv.id === vanId);
    if (!target || seat < 1 || seat > VAN_CAPACITY || target.takenSeats.includes(seat)) return false;
    updateVan(vanId, (sv) => ({
      ...sv,
      takenSeats: [...sv.takenSeats, seat].sort((a, b) => a - b),
      mine: [...sv.mine, seat],
    }));
    return true;
  },

  /** Marks a seat as the student's even when the random fill already contains it (used after reset or reload). */
  claimSeat(vanId: string, seat: number): void {
    updateVan(vanId, (sv) => ({
      ...sv,
      takenSeats: sv.takenSeats.includes(seat) ? sv.takenSeats : [...sv.takenSeats, seat].sort((a, b) => a - b),
      mine: sv.mine.includes(seat) ? sv.mine : [...sv.mine, seat],
    }));
  },

  releaseSeat(vanId: string, seat: number): void {
    updateVan(vanId, (sv) => ({
      ...sv,
      takenSeats: sv.takenSeats.filter((t) => t !== seat),
      mine: sv.mine.filter((t) => t !== seat),
    }));
  },

  /** Adds the student to a van's waitlist. Returns their 1-based position (0 if the van is unknown). */
  joinWaitlist(vanId: string): number {
    const updated = updateVan(vanId, (sv) =>
      sv.studentWaiting
        ? sv
        : { ...sv, studentWaiting: true, openAtReal: Date.now() + randInt(12_000, 22_000) },
    );
    return updated ? updated.othersWaiting + 1 : 0;
  },

  leaveWaitlist(vanId: string): void {
    updateVan(vanId, (sv) => ({ ...sv, studentWaiting: false, openAtReal: null }));
  },

  reset(): void {
    epochCounter += 1;
    commit(createInitial(epochCounter));
    lastReal = Date.now();
  },
};

const getServerSnapshot = (): SimSnapshot => EMPTY_SNAPSHOT;

/** Live simulation snapshot. vans is empty during server render and the first client paint. */
export function useVanSimulation(): SimSnapshot {
  return useSyncExternalStore(subscribe, vanSim.getSnapshot, getServerSnapshot);
}
