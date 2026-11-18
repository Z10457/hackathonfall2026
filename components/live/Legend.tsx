import { BRAND } from "@/lib/constants";
import type { TrafficLevel } from "@/lib/types";

const TRAFFIC: Record<TrafficLevel, { label: string; dot: string }> = {
  light: { label: "Light traffic", dot: "#16a34a" },
  moderate: { label: "Moderate traffic", dot: "#d97706" },
  heavy: { label: "Heavy traffic", dot: "#dc2626" },
};

export function TrafficChip({ level }: { level: TrafficLevel }) {
  const { label, dot } = TRAFFIC[level];
  return (
    <span className="chip shadow-card">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
      {label}
    </span>
  );
}

export function Legend() {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-white/95 px-3 py-2 text-xs font-semibold text-ink-700 shadow-card backdrop-blur">
      <span className="flex items-center gap-2">
        <span aria-hidden className="h-2.5 w-5 rounded-full" style={{ backgroundColor: BRAND.maroon }} />
        To Rose Hill
      </span>
      <span className="flex items-center gap-2">
        <span aria-hidden className="h-2.5 w-5 rounded-full" style={{ backgroundColor: BRAND.blue }} />
        To Lincoln Center
      </span>
    </div>
  );
}

export function SimulatedNote() {
  return (
    <span className="rounded-full bg-ink-900/75 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur">
      Simulated · Demo data
    </span>
  );
}
