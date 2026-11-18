"use client";

import { Clock, MapPin, Navigation, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BRAND_ASSETS, DIRECTION_COLOR, DIRECTION_LABEL } from "@/lib/constants";
import { CAMPUSES, destinationOf, originOf } from "@/lib/routes";
import type { Reservation, Student, Van } from "@/lib/types";
import { etaLabel, fareLabel, fareFor, formatClock, openSeats, statusStyle } from "./format";
import { cancelReservation, joinVanWaitlist, reserveVanSeat } from "./reservations";
import { SeatGrid } from "./SeatGrid";

interface VanPanelProps {
  van: Van;
  student: Student;
  /** The student's active reservation on this van, if any. */
  reservation: Reservation | null;
  onClose: () => void;
  onOpenTicket: () => void;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-ink-400 uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-[15px] leading-snug font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function useLockScrollOnMobile(): void {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
}

/** Bottom sheet on mobile, inline side panel on desktop (same markup, CSS decides). */
export function VanPanel({ van, student, reservation, onClose, onOpenTicket }: VanPanelProps) {
  useLockScrollOnMobile();
  const [picked, setPicked] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  const color = DIRECTION_COLOR[van.direction];
  const status = statusStyle(van);
  const open = openSeats(van);
  const full = open === 0;
  const mySeat = reservation?.status === "confirmed" ? reservation.seat : null;
  const seat = picked !== null && !van.takenSeats.includes(picked) ? picked : null;
  const price = fareFor(student);
  const destination = CAMPUSES[destinationOf(van.direction)].name;

  const reserve = (): void => {
    if (seat === null) return;
    reserveVanSeat(student, van, seat);
    setPicked(null);
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:static lg:z-auto lg:block">
      <button type="button" aria-label="Close van details" onClick={onClose} className="absolute inset-0 animate-fade bg-ink-900/50 lg:hidden" />
      <section
        aria-label={`Van ${van.number} details`}
        className="relative max-h-[88dvh] w-full animate-sheet overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-lift lg:max-h-none lg:animate-rise lg:rounded-2xl lg:border lg:border-line lg:pb-5 lg:shadow-card"
      >
        <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line lg:hidden" />
        <div className="flex items-start gap-3">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl font-extrabold text-white"
            style={{ backgroundColor: color }}
          >
            {van.number}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl leading-tight font-bold text-ink-900">Van {van.number}</h2>
            <p className="font-semibold" style={{ color }}>
              {DIRECTION_LABEL[van.direction]}
            </p>
            <span className={`${status.className} mt-1`}>{status.label}</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_ASSETS.ramVanIcon} alt="" width={80} height={40} className="hidden h-10 w-20 sm:block" />
          <button type="button" onClick={onClose} aria-label="Close" className="btn-ghost !min-h-11 !min-w-11 !px-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Stat icon={<Clock className="h-3 w-3" />} label={`ETA to ${destination}`} value={etaLabel(van.etaMinutes)} />
          <Stat icon={<Navigation className="h-3 w-3" />} label="Next stop" value={van.nextStop} />
          <Stat icon={<Clock className="h-3 w-3" />} label="Scheduled departure" value={formatClock(van.departureTime)} />
          <Stat icon={<MapPin className="h-3 w-3" />} label="Fare" value={fareLabel(price)} />
        </div>
        <p className="mt-2.5 flex gap-2 rounded-xl bg-paper px-3 py-2.5 text-sm leading-snug text-ink-700">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-maroon-700" aria-hidden />
          <span>
            <span className="font-semibold">Pickup: </span>
            {CAMPUSES[originOf(van.direction)].pickup}
          </span>
        </p>

        <div className="mt-5 flex items-baseline justify-between">
          <h3 className="text-lg font-bold text-ink-900">Seats</h3>
          <p className="text-sm font-semibold text-ink-600">
            {open} of {van.capacity} open
            {van.waitlistCount > 0 ? ` · ${van.waitlistCount} waiting` : ""}
          </p>
        </div>
        <div className="mt-3">
          <SeatGrid
            takenSeats={van.takenSeats}
            mySeat={mySeat}
            selectedSeat={seat}
            interactive={!reservation && !full}
            onSelect={(s) => {
              setPicked(s);
              setConfirming(false);
            }}
          />
        </div>

        <div className="mt-5 space-y-2.5">
          {reservation?.status === "confirmed" ? (
            <>
              <p className="rounded-xl border border-gold-400/60 bg-gold-100 px-3 py-2.5 text-sm font-semibold text-ink-900">
                You hold seat {reservation.seat} on this van.
              </p>
              <button type="button" onClick={onOpenTicket} className="btn-primary w-full">
                View ticket
              </button>
              <button type="button" onClick={() => cancelReservation(reservation)} className="btn-secondary w-full">
                Cancel reservation
              </button>
            </>
          ) : reservation?.status === "waitlisted" ? (
            <>
              <p className="rounded-xl border border-lc-500/30 bg-lc-50 px-3 py-2.5 text-sm font-semibold text-lc-700">
                You are number {reservation.waitlistPosition ?? van.waitlistCount} on the waitlist. We will tell you the
                moment a seat opens.
              </p>
              <button type="button" onClick={() => cancelReservation(reservation)} className="btn-secondary w-full">
                Leave waitlist
              </button>
            </>
          ) : full ? (
            <>
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-900">
                This van is full. Join the waitlist and we will move you up when a seat opens.
              </p>
              <button type="button" onClick={() => joinVanWaitlist(student, van)} className="btn-blue w-full">
                Join waitlist
              </button>
            </>
          ) : confirming && seat !== null ? (
            <div className="rounded-xl border border-maroon-200 bg-maroon-50 p-3">
              <p className="text-sm font-semibold text-ink-900">
                Reserve seat {seat} on Van {van.number} for {fareLabel(price)}?
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="btn-secondary">
                  Back
                </button>
                <button type="button" onClick={reserve} className="btn-primary">
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <button type="button" disabled={seat === null} onClick={() => setConfirming(true)} className="btn-primary w-full">
              {seat === null ? "Pick an open seat to reserve" : `Reserve seat ${seat}`}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
