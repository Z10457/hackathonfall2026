"use client";

import { useState } from "react";
import { REGIONS } from "@/lib/constants";
import { KNOWN_ORIGINS } from "@/lib/planner";
import type { Region } from "@/lib/types";

interface OriginQuickPicksProps {
  value: string;
  homeArea?: string;
  onPick: (name: string) => void;
}

export function OriginQuickPicks({ value, homeArea, onPick }: OriginQuickPicksProps) {
  const [region, setRegion] = useState<Region | null>(null);
  const names = region ? KNOWN_ORIGINS.filter((o) => o.region === region) : [];

  return (
    <div className="space-y-2.5">
      {homeArea ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip-toggle" aria-pressed={value.trim() === homeArea} onClick={() => onPick(homeArea)}>
            Home: {homeArea}
          </button>
        </div>
      ) : null}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-ink-500 uppercase">Browse by region</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {REGIONS.map((r) => (
            <button key={r} type="button" className="chip-toggle shrink-0" aria-pressed={region === r} onClick={() => setRegion(region === r ? null : r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
      {region ? (
        <div className="flex animate-fade flex-wrap gap-2">
          {names.map((o) => (
            <button key={o.name} type="button" className="chip-toggle" aria-pressed={value.trim() === o.name} onClick={() => onPick(o.name)}>
              {o.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
