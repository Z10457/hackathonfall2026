import { Bike, Bus, Car, Footprints, TrainFront, TrainFrontTunnel, TramFront, type LucideIcon } from "lucide-react";
import type { TransitMode } from "@/lib/types";

export const MODE_ICON: Record<TransitMode, LucideIcon> = {
  "ram-van": Bus,
  subway: TrainFrontTunnel,
  bus: Bus,
  "metro-north": TrainFront,
  lirr: TramFront,
  "nj-transit": TrainFront,
  walk: Footprints,
  carpool: Car,
  bike: Bike,
};

/** Solid background per mode (full class names so Tailwind can see them). */
export const MODE_BG: Record<TransitMode, string> = {
  "ram-van": "bg-maroon-700",
  subway: "bg-lc-500",
  bus: "bg-emerald-600",
  "metro-north": "bg-teal-700",
  lirr: "bg-violet-700",
  "nj-transit": "bg-orange-600",
  walk: "bg-ink-500",
  carpool: "bg-ink-600",
  bike: "bg-ink-600",
};

export const MODE_LINE: Record<TransitMode, string> = {
  "ram-van": "border-maroon-700",
  subway: "border-lc-500",
  bus: "border-emerald-600",
  "metro-north": "border-teal-700",
  lirr: "border-violet-700",
  "nj-transit": "border-orange-600",
  walk: "border-ink-400",
  carpool: "border-ink-500",
  bike: "border-ink-500",
};

interface ModeBadgeProps {
  mode: TransitMode;
  /** Pixel size of the circle. */
  size?: number;
}

export function ModeBadge({ mode, size = 40 }: ModeBadgeProps) {
  const Icon = MODE_ICON[mode];
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-white ${MODE_BG[mode]}`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </span>
  );
}
