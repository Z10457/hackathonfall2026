"use client";

import { STORAGE_KEYS, makeId, readStored, useStoredState, writeStored } from "@/lib/storage";
import { toast } from "@/lib/toast";
import type { Reservation, Student, Van } from "@/lib/types";
import { vanSim } from "@/lib/vanSimulation";
import { fareFor } from "./format";

export const NO_RESERVATIONS: Reservation[] = [];
const NO_STUDENT: Student | null = null;

export function useReservations(): [Reservation[], (next: Reservation[] | ((prev: Reservation[]) => Reservation[])) => void] {
  return useStoredState<Reservation[]>(STORAGE_KEYS.reservations, NO_RESERVATIONS);
}

export const isActive = (r: Reservation): boolean => r.status === "confirmed" || r.status === "waitlisted";

export function qrFor(id: string, vanNumber: number, seat: number | null, departureISO: string): string {
  return `RAMVAN|${id}|V${vanNumber}|S${seat ?? 0}|${departureISO}`;
}

function save(next: Reservation[]): void {
  writeStored(STORAGE_KEYS.reservations, next);
}

function replaceOne(list: Reservation[], updated: Reservation): Reservation[] {
  return list.map((r) => (r.id === updated.id ? updated : r));
}

export function reserveVanSeat(student: Student, van: Van, seat: number): Reservation | null {
  if (!vanSim.reserveSeat(van.id, seat)) {
    toast({ title: "Seat just taken", message: "Pick another open seat.", tone: "warning" });
    return null;
  }
  const id = makeId("res");
  const reservation: Reservation = {
    id,
    vanId: van.id,
    vanNumber: van.number,
    direction: van.direction,
    seat,
    studentId: student.id,
    studentName: student.name,
    departureTime: van.departureTime,
    createdAt: new Date().toISOString(),
    status: "confirmed",
    qrPayload: qrFor(id, van.number, seat, van.departureTime),
    price: fareFor(student),
  };
  save([...readStored(STORAGE_KEYS.reservations, NO_RESERVATIONS), reservation]);
  toast({ title: `Seat ${seat} reserved on Van ${van.number}`, message: "Your ticket is ready.", tone: "success" });
  return reservation;
}

export function joinVanWaitlist(student: Student, van: Van): Reservation {
  const position = vanSim.joinWaitlist(van.id) || van.waitlistCount + 1;
  const id = makeId("res");
  const reservation: Reservation = {
    id,
    vanId: van.id,
    vanNumber: van.number,
    direction: van.direction,
    seat: null,
    studentId: student.id,
    studentName: student.name,
    departureTime: van.departureTime,
    createdAt: new Date().toISOString(),
    status: "waitlisted",
    qrPayload: qrFor(id, van.number, null, van.departureTime),
    price: fareFor(student),
    waitlistPosition: position,
  };
  save([...readStored(STORAGE_KEYS.reservations, NO_RESERVATIONS), reservation]);
  toast({ title: `On the waitlist for Van ${van.number}`, message: `You are number ${position}. We will tell you if a seat opens.`, tone: "info" });
  return reservation;
}

export function cancelReservation(reservation: Reservation): void {
  if (reservation.status === "confirmed" && reservation.seat !== null) {
    vanSim.releaseSeat(reservation.vanId, reservation.seat);
  }
  if (reservation.status === "waitlisted") vanSim.leaveWaitlist(reservation.vanId);
  const list = readStored(STORAGE_KEYS.reservations, NO_RESERVATIONS);
  save(replaceOne(list, { ...reservation, status: "cancelled" }));
  toast({
    title: reservation.status === "waitlisted" ? "Left the waitlist" : "Reservation cancelled",
    message: `Van ${reservation.vanNumber}${reservation.seat ? `, seat ${reservation.seat}` : ""}`,
    tone: "info",
  });
}

/* ------------------------------------------------------------- watcher */

let installed = false;
let lastEpoch = -1;
const lastEta = new Map<string, number>();

let syncing = false;

function sync(vans: Van[]): void {
  if (syncing) return;
  syncing = true;
  try {
    runSync(vans);
  } finally {
    syncing = false;
  }
}

function runSync(vans: Van[]): void {
  const student = readStored<Student | null>(STORAGE_KEYS.student, NO_STUDENT);
  if (!student) return;
  const list = readStored(STORAGE_KEYS.reservations, NO_RESERVATIONS);
  const epoch = vanSim.getEpoch();
  const freshEpoch = epoch !== lastEpoch;
  lastEpoch = epoch;
  let changed = false;

  const next = list.map((r): Reservation => {
    if (r.studentId !== student.id || !isActive(r)) return r;
    const van = vans.find((v) => v.id === r.vanId);
    if (!van) {
      changed = true;
      if (r.status === "confirmed" && r.seat !== null) vanSim.releaseSeat(r.vanId, r.seat);
      if (r.status === "waitlisted") vanSim.leaveWaitlist(r.vanId);
      toast({ title: `Van ${r.vanNumber} is out of service`, message: "That reservation was released.", tone: "warning" });
      return { ...r, status: "cancelled" };
    }
    if (r.status === "confirmed" && r.seat !== null) {
      if (freshEpoch) vanSim.claimSeat(van.id, r.seat);
      const rebound = van.departureTime !== r.departureTime || van.direction !== r.direction;
      const prev = lastEta.get(r.id);
      lastEta.set(r.id, van.etaMinutes);
      if (prev !== undefined && prev > 5 && van.etaMinutes <= 5 && van.status !== "layover" && van.status !== "boarding") {
        toast({ title: `Van ${van.number} is 5 minutes away`, message: "Have your ticket ready.", tone: "info" });
      }
      if (!rebound) return r;
      changed = true;
      return {
        ...r,
        direction: van.direction,
        departureTime: van.departureTime,
        qrPayload: qrFor(r.id, van.number, r.seat, van.departureTime),
      };
    }
    if (r.status === "waitlisted") {
      const free = Array.from({ length: van.capacity }, (_, i) => i + 1).find((s) => !van.takenSeats.includes(s));
      if (free !== undefined && vanSim.reserveSeat(van.id, free)) {
        vanSim.leaveWaitlist(van.id);
        changed = true;
        toast({ title: `A seat opened on Van ${van.number}`, message: `You moved off the waitlist. Seat ${free} is yours.`, tone: "success" });
        return {
          ...r,
          status: "confirmed",
          seat: free,
          waitlistPosition: undefined,
          direction: van.direction,
          departureTime: van.departureTime,
          qrPayload: qrFor(r.id, van.number, free, van.departureTime),
        };
      }
      if (freshEpoch) vanSim.joinWaitlist(van.id);
    }
    return r;
  });
  if (changed) save(next);
}

/** Starts the reservation watcher once. It keeps seats, waitlists, and toasts in sync with the simulation. */
export function installReservationWatcher(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  vanSim.subscribe(() => sync(vanSim.getSnapshot().vans));
  sync(vanSim.getSnapshot().vans);
}
