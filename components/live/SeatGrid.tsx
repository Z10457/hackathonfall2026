"use client";

import { DoorOpen, LifeBuoy } from "lucide-react";

interface SeatGridProps {
  takenSeats: number[];
  mySeat: number | null;
  selectedSeat: number | null;
  /** When false, seats are display only. */
  interactive: boolean;
  onSelect: (seat: number) => void;
}

/**
 * Top-down floor plan of the van, front at the top, matching a Ford Transit 15-passenger
 * (the model Ram Vans use): driver plus one front passenger, three rows of a two-seat bench on
 * the driver side and a single seat by the sliding door with the aisle between, and a
 * four-seat bench across the back. 1 + 3 + 3 + 3 + 4 = 14 passenger seats.
 * null is the aisle.
 */
const CABIN_ROWS: Array<Array<number | null>> = [
  [2, 3, null, 4],
  [5, 6, null, 7],
  [8, 9, null, 10],
];
const REAR_BENCH = [11, 12, 13, 14];
const FRONT_PASSENGER = 1;

type SeatState = "taken" | "open" | "selected" | "mine";

const STYLE: Record<SeatState, { seat: string; back: string }> = {
  taken: { seat: "border-ink-400/30 bg-ink-400/20 text-ink-400 cursor-not-allowed", back: "bg-ink-400/35" },
  open: {
    seat: "border-ink-400/50 bg-white text-ink-900 hover:border-maroon-500 hover:bg-maroon-50 cursor-pointer",
    back: "bg-ink-400/40",
  },
  selected: { seat: "border-maroon-700 bg-maroon-700 text-white shadow-sm cursor-pointer", back: "bg-maroon-900" },
  mine: { seat: "border-gold-600 bg-gold-400 text-ink-900 shadow-sm", back: "bg-gold-600" },
};

interface SeatProps {
  seat: number;
  state: SeatState;
  interactive: boolean;
  onSelect: (seat: number) => void;
}

/** One seat seen from above: cushion with the backrest along its rear edge. */
function Seat({ seat, state, interactive, onSelect }: SeatProps) {
  const disabled = !interactive || state === "taken" || state === "mine";
  const label = { taken: "taken", open: "open", selected: "selected", mine: "your seat" }[state];
  const style = STYLE[state];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(seat)}
      aria-label={`Seat ${seat}, ${label}`}
      aria-pressed={state === "selected"}
      className={`relative flex h-12 w-full min-w-11 items-center justify-center overflow-hidden rounded-t-lg rounded-b-xl border-2 pb-1.5 text-sm font-bold transition active:scale-95 disabled:active:scale-100 ${style.seat}`}
    >
      {seat}
      <span aria-hidden className={`absolute inset-x-0 bottom-0 h-[7px] ${style.back}`} />
    </button>
  );
}

export function SeatGrid({ takenSeats, mySeat, selectedSeat, interactive, onSelect }: SeatGridProps) {
  const stateOf = (seat: number): SeatState =>
    seat === mySeat ? "mine" : takenSeats.includes(seat) ? "taken" : seat === selectedSeat ? "selected" : "open";
  const seat = (n: number) => <Seat key={n} seat={n} state={stateOf(n)} interactive={interactive} onSelect={onSelect} />;

  return (
    <div>
      <div className="relative mx-auto w-full max-w-[272px]">
        {/* Side mirrors */}
        <span aria-hidden className="absolute top-[52px] -left-2.5 h-5 w-3 rounded-l-md bg-ink-700" />
        <span aria-hidden className="absolute top-[52px] -right-2.5 h-5 w-3 rounded-r-md bg-ink-700" />
        {/* Sliding door on the passenger side, beside the first cabin row */}
        <span
          aria-hidden
          className="absolute top-[150px] -right-[5px] h-[58px] w-[5px] rounded-r bg-gold-500"
        />
        <div className="relative overflow-hidden rounded-t-[44px] rounded-b-[22px] border-[3px] border-ink-700 bg-paper shadow-card">
          {/* Hood and windshield */}
          <div className="relative h-11 bg-white">
            <p className="pt-1 text-center text-[9px] font-bold tracking-[0.22em] text-ink-400 uppercase">Front</p>
            <div className="absolute inset-x-5 bottom-0 h-4 rounded-t-[14px] bg-gradient-to-b from-sky-900/70 to-sky-700/40" />
          </div>

          {/* Front row: driver on the left, one passenger on the right */}
          <div className="grid grid-cols-4 items-end gap-2 px-3 pt-3">
            <div
              className="relative flex h-12 flex-col items-center justify-center overflow-hidden rounded-t-lg rounded-b-xl bg-ink-900 pb-1.5 text-white"
              role="img"
              aria-label="Driver seat"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden />
              <span className="text-[8px] font-semibold tracking-wider uppercase">Driver</span>
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-[7px] bg-black" />
            </div>
            <span className="col-span-2 self-center text-center text-[9px] font-semibold tracking-wider text-ink-400 uppercase">
              Console
            </span>
            {seat(FRONT_PASSENGER)}
          </div>

          {/* Partition between the cab and the passenger cabin */}
          <div className="mx-3 mt-3 flex items-center gap-2">
            <span className="h-px flex-1 border-t border-dashed border-ink-400/50" />
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-gold-600 uppercase">
              Sliding door <DoorOpen className="h-3 w-3" aria-hidden />
            </span>
          </div>

          {/* Cabin rows: two-seat bench, aisle, single seat */}
          <div className="relative space-y-2 px-3 pt-2">
            <span
              aria-hidden
              className="pointer-events-none absolute top-2 bottom-0 left-[calc(50%+4px)] flex w-[calc(25%-10px)] items-center justify-center rounded-md bg-ink-400/8 text-[9px] font-semibold tracking-[0.2em] text-ink-400 uppercase [writing-mode:vertical-rl]"
            >
              Aisle
            </span>
            {CABIN_ROWS.map((row) => (
              <div key={row.join("-")} className="grid grid-cols-4 gap-2">
                {row.map((n, i) => (n === null ? <span key={`aisle-${i}`} /> : seat(n)))}
              </div>
            ))}
          </div>

          {/* Rear bench across the full width */}
          <div className="grid grid-cols-4 gap-2 px-3 pt-2 pb-2">{REAR_BENCH.map(seat)}</div>
          <p className="border-t border-line bg-white py-1 text-center text-[9px] font-bold tracking-[0.22em] text-ink-400 uppercase">
            Rear doors
          </p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs font-medium text-ink-600">
        <Key className="border-ink-400/50 bg-white" label="Open" />
        <Key className="border-maroon-700 bg-maroon-700" label="Selected" />
        <Key className="border-gold-600 bg-gold-400" label="Your seat" />
        <Key className="border-ink-400/30 bg-ink-400/20" label="Taken" />
      </ul>
    </div>
  );
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className={`h-3.5 w-3.5 rounded border-2 ${className}`} />
      {label}
    </li>
  );
}
