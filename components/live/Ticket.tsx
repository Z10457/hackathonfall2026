"use client";

import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import { BRAND_ASSETS, DIRECTION_COLOR, DIRECTION_LABEL } from "@/lib/constants";
import { CAMPUSES, originOf } from "@/lib/routes";
import type { Reservation } from "@/lib/types";
import { fareLabel, formatClock } from "./format";

interface TicketProps {
  reservation: Reservation;
  onCancel: () => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold tracking-widest text-ink-400 uppercase">{label}</p>
      <p className="truncate text-[15px] font-semibold text-ink-900">{value}</p>
    </div>
  );
}

/** Boarding-pass styled ticket with the QR code the driver scans. */
export function Ticket({ reservation, onCancel }: TicketProps) {
  const color = DIRECTION_COLOR[reservation.direction];
  const pickup = CAMPUSES[originOf(reservation.direction)].pickup;
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-lift" aria-label="Ram Van boarding pass">
      <header className="flex items-center justify-between bg-maroon-700 px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND_ASSETS.logoWhite} alt="Fordham University" width={120} height={32} className="h-8 w-auto" />
        <span className="text-[11px] font-bold tracking-[0.18em] text-gold-100 uppercase">Ram Van</span>
      </header>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl font-extrabold text-white ring-4 ring-white"
            style={{ backgroundColor: color, boxShadow: "0 0 0 2px " + color }}
          >
            {reservation.vanNumber}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-widest text-ink-400 uppercase">Van {reservation.vanNumber}</p>
            <p className="font-display text-xl leading-tight font-bold" style={{ color }}>
              {DIRECTION_LABEL[reservation.direction]}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-bold tracking-widest text-ink-400 uppercase">Seat</p>
            <p className="font-display text-3xl leading-none font-bold text-ink-900">{reservation.seat ?? "-"}</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Departs" value={formatClock(reservation.departureTime)} />
          <Field label="Fare" value={fareLabel(reservation.price)} />
          <Field label="Passenger" value={reservation.studentName} />
          <Field label="Status" value={reservation.status === "confirmed" ? "Confirmed" : reservation.status} />
        </dl>
        <div className="mt-3">
          <p className="text-[10px] font-bold tracking-widest text-ink-400 uppercase">Pickup</p>
          <p className="text-sm leading-snug font-medium text-ink-700">{pickup}</p>
        </div>
      </div>
      <div className="relative">
        <span aria-hidden className="absolute -top-3 -left-3 h-6 w-6 rounded-full border border-line bg-paper" />
        <span aria-hidden className="absolute -top-3 -right-3 h-6 w-6 rounded-full border border-line bg-paper" />
        <div className="mx-5 border-t-2 border-dashed border-line" />
      </div>
      <div className="flex flex-col items-center px-5 pt-5 pb-5">
        <div className="rounded-xl border border-line bg-white p-3">
          <QRCodeSVG value={reservation.qrPayload} size={168} level="M" fgColor="#1c1917" />
        </div>
        <p className="mt-3 max-w-xs text-center text-xs leading-relaxed text-ink-600">
          Be at the van on time. Reservations are forfeited one minute after scheduled departure. The driver scans this
          code at boarding.
        </p>
        {reservation.status === "confirmed" ? (
          <button type="button" onClick={onCancel} className="btn-secondary mt-4 w-full">
            Cancel reservation
          </button>
        ) : null}
      </div>
    </article>
  );
}

interface TicketDialogProps extends TicketProps {
  onClose: () => void;
}

export function TicketDialog({ reservation, onCancel, onClose }: TicketDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Your ticket">
      <button type="button" aria-label="Close ticket" className="absolute inset-0 animate-fade bg-ink-900/55" onClick={onClose} />
      <div className="relative max-h-[92dvh] w-full max-w-sm animate-sheet overflow-y-auto rounded-t-3xl bg-paper p-4 pb-6 sm:rounded-3xl">
        <button type="button" onClick={onClose} className="btn-ghost mb-2 ml-auto flex !min-h-11 !px-3" aria-label="Close">
          <X className="h-5 w-5" /> Close
        </button>
        <Ticket
          reservation={reservation}
          onCancel={() => {
            onCancel();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
