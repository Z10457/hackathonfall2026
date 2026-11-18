import { Bike, Bus, Car, Footprints, TrainFront, TramFront } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TransitMode } from "@/lib/types";

const MODE_ICON: Record<TransitMode, LucideIcon> = {
  "ram-van": Bus,
  subway: TramFront,
  bus: Bus,
  "metro-north": TrainFront,
  lirr: TrainFront,
  "nj-transit": TrainFront,
  walk: Footprints,
  carpool: Car,
  bike: Bike,
};

export function ModeIcon({ mode, className }: { mode: TransitMode; className?: string }) {
  const Icon = MODE_ICON[mode];
  return <Icon className={className} aria-hidden />;
}
