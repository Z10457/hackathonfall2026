import { CAMPUS_LABEL, formatTime } from "@/lib/constants";
import type { Campus, TransitStep } from "@/lib/types";
import { formatDuration } from "./format";
import { MODE_LINE, ModeBadge } from "./modeMeta";

interface PlannerTimelineProps {
  steps: TransitStep[];
  origin: string;
  leaveBy: string;
  arriveBy: string;
  campus: Campus;
}

export function PlannerTimeline({ steps, origin, leaveBy, arriveBy, campus }: PlannerTimelineProps) {
  return (
    <ol className="relative">
      <li className="flex gap-3 pb-4">
        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
          <span className="h-3 w-3 rounded-full border-[3px] border-maroon-700 bg-white" />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-ink-900">
            Leave {origin || "your origin"} by {formatTime(leaveBy)}
          </p>
        </div>
      </li>
      {steps.map((s, i) => (
        <li key={`${i}-${s.instruction}`} className="flex gap-3">
          <div className="flex w-6 shrink-0 flex-col items-center">
            <ModeBadge mode={s.mode} size={24} />
            <span className={`my-1 w-0 flex-1 border-l-2 ${s.mode === "walk" ? "border-dashed" : "border-solid"} ${MODE_LINE[s.mode]}`} />
          </div>
          <div className="min-w-0 flex-1 pb-4">
            <p className="text-sm leading-snug text-ink-900">{s.instruction}</p>
            <p className="mt-0.5 text-xs text-ink-500">{formatDuration(s.durationMinutes)}</p>
          </div>
        </li>
      ))}
      <li className="flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-maroon-700 ring-4 ring-maroon-100" />
        </span>
        <p className="pt-0.5 text-sm font-semibold text-ink-900">
          Arrive at {CAMPUS_LABEL[campus]} by {formatTime(arriveBy)}
        </p>
      </li>
    </ol>
  );
}
