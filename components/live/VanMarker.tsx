"use client";

import { BRAND_ASSETS, DIRECTION_COLOR, DIRECTION_LABEL } from "@/lib/constants";
import type { Van } from "@/lib/types";

interface VanMarkerProps {
  van: Van;
  selected: boolean;
  onSelect: (vanId: string) => void;
}

function outlineFilter(color: string): string {
  return [
    `drop-shadow(2.5px 0 0 ${color})`,
    `drop-shadow(-2.5px 0 0 ${color})`,
    `drop-shadow(0 2.5px 0 ${color})`,
    `drop-shadow(0 -2.5px 0 ${color})`,
    "drop-shadow(0 3px 3px rgb(0 0 0 / 0.3))",
  ].join(" ");
}

/** Van icon with a direction-colored outline and the painted van number. Shared by both maps. */
export function VanMarker({ van, selected, onSelect }: VanMarkerProps) {
  const color = DIRECTION_COLOR[van.direction];
  const facesEast = van.heading > 0 && van.heading < 180;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect(van.id);
      }}
      aria-label={`Van ${van.number}, ${DIRECTION_LABEL[van.direction]}, ${van.etaMinutes} minutes`}
      aria-pressed={selected}
      className="relative flex h-12 w-[68px] cursor-pointer items-center justify-center"
      style={{
        transform: `scale(${selected ? 1.25 : 1})`,
        transition: "transform 0.2s ease",
      }}
    >
      {selected ? (
        <span
          aria-hidden
          className="absolute inset-1 animate-ping-slow rounded-full"
          style={{ backgroundColor: color, opacity: 0.45 }}
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_ASSETS.ramVanIcon}
        alt=""
        width={64}
        height={32}
        draggable={false}
        className="relative h-8 w-16 max-w-none select-none"
        style={{
          filter: outlineFilter(color),
          transform: facesEast ? "scaleX(-1)" : undefined,
        }}
      />
      <span
        aria-hidden
        className="absolute -top-1.5 -right-1.5 flex h-[26px] min-w-[26px] items-center justify-center rounded-full text-[13px] leading-none font-extrabold text-white ring-2 ring-white"
        style={{ backgroundColor: color, boxShadow: "0 1px 4px rgb(0 0 0 / 0.4)" }}
      >
        {van.number}
      </span>
    </button>
  );
}
