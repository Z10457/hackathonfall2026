"use client";

import { Ticket } from "lucide-react";
import { DIRECTION_COLOR, DIRECTION_LABEL } from "@/lib/constants";
import type { Reservation, Van } from "@/lib/types";
import { etaLabel, formatClock } from "./format";

interface RideCardProps {
  reservation: Reservation;
  van: Van | null;
  onOpen: () => void;
}

/** Compact "Your ride" summary shown above the map. */
export function RideCard({ reservation, van, onOpen }: RideCardProps) {
  const color = DIRECTION_COLOR[reservation.direction];
  const waitlisted = reservation.status === "waitlisted";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card mb-4 flex min-h-16 w-full animate-rise items-center gap-3 border-l-4 p-3 text-left transition hover:shadow-lift"
      style={{ borderLeftColor: color }}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-extrabold text-white" style={{ backgroundColor: color }}>
        {reservation.vanNumber}
      </span>
      <span className="min-w-0 flex-1">
        <span className="eyebrow block">Your ride</span>
        <span className="block truncate text-sm font-bold text-ink-900">
          {waitlisted ? `Waitlist #${reservation.waitlistPosition ?? 1}` : `Seat ${reservation.seat}`} · {DIRECTION_LABEL[reservation.direction]}
        </span>
        <span className="block truncate text-xs text-ink-600">
          Departs {formatClock(reservation.departureTime)}
          {van ? ` · arrives in ${etaLabel(van.etaMinutes)}` : ""}
        </span>
      </span>
      <span className="btn-primary btn-sm shrink-0">
        <Ticket className="h-4 w-4" aria-hidden />
        {waitlisted ? "Details" : "Ticket"}
      </span>
    </button>
  );
}
