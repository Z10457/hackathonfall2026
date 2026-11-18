"use client";

import { BRAND_ASSETS, DIRECTION_COLOR, DIRECTION_LABEL } from "@/lib/constants";
import type { Direction, Van } from "@/lib/types";
import { etaLabel, openSeats, statusStyle } from "./format";

export type DirectionFilter = "all" | Direction;

const FILTERS: Array<{ id: DirectionFilter; label: string }> = [
  { id: "to-rose-hill", label: "To Rose Hill" },
  { id: "to-lincoln-center", label: "To Lincoln Center" },
  { id: "all", label: "All" },
];

interface ArrivalListProps {
  vans: Van[];
  filter: DirectionFilter;
  onFilter: (filter: DirectionFilter) => void;
  selectedId: string | null;
  onSelect: (vanId: string) => void;
}

function Row({ van, selected, onSelect }: { van: Van; selected: boolean; onSelect: (id: string) => void }) {
  const color = DIRECTION_COLOR[van.direction];
  const status = statusStyle(van);
  const open = openSeats(van);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(van.id)}
        aria-pressed={selected}
        className={`card flex min-h-[72px] w-full items-center gap-3 p-3 text-left transition hover:shadow-lift ${
          selected ? "ring-2 ring-maroon-700" : ""
        }`}
      >
        <span className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_ASSETS.ramVanIcon}
            alt=""
            width={56}
            height={28}
            className="h-7 w-14"
            style={{
              filter: `drop-shadow(1.5px 0 0 ${color}) drop-shadow(-1.5px 0 0 ${color}) drop-shadow(0 1.5px 0 ${color}) drop-shadow(0 -1.5px 0 ${color})`,
            }}
          />
          <span
            className="absolute -top-1 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-extrabold text-white ring-2 ring-white"
            style={{ backgroundColor: color }}
          >
            {van.number}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold" style={{ color }}>
            Van {van.number} · {DIRECTION_LABEL[van.direction]}
          </span>
          <span className="block truncate text-xs text-ink-600">Next: {van.nextStop}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={status.className}>{status.label}</span>
            <span className="text-xs font-medium text-ink-600">{open === 0 ? "Full" : `${open} open`}</span>
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-display text-2xl leading-none font-bold text-ink-900">{etaLabel(van.etaMinutes)}</span>
          <span className="text-[10px] font-bold tracking-widest text-ink-400 uppercase">ETA</span>
        </span>
      </button>
    </li>
  );
}

export function ArrivalList({ vans, filter, onFilter, selectedId, onSelect }: ArrivalListProps) {
  return (
    <section aria-label="Arriving soonest">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="section-title">Arriving soonest</h2>
        <div className="flex gap-1.5" role="group" aria-label="Filter by direction">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="chip-toggle" aria-pressed={filter === f.id} onClick={() => onFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="space-y-2.5">
        {vans.map((van) => (
          <Row key={van.id} van={van} selected={van.id === selectedId} onSelect={onSelect} />
        ))}
      </ul>
    </section>
  );
}
