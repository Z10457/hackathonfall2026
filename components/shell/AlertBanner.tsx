"use client";

import { ChevronLeft, ChevronRight, Info, Megaphone, TriangleAlert, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getActiveAlerts } from "@/lib/alerts";
import { MODE_LABEL } from "@/lib/constants";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";
import type { Alert, AlertSeverity } from "@/lib/types";

const NONE_DISMISSED: string[] = [];
const VISIBLE_COUNT = 3;
const ROTATE_MS = 7000;
const REFRESH_MS = 60_000;

const STYLE: Record<AlertSeverity, { bar: string; icon: typeof Info; label: string }> = {
  info: { bar: "border-lc-500/25 bg-lc-50 text-lc-700", icon: Info, label: "Notice" },
  warning: { bar: "border-amber-300 bg-amber-50 text-amber-950", icon: TriangleAlert, label: "Delay" },
  critical: { bar: "border-maroon-300 bg-maroon-50 text-maroon-900", icon: Megaphone, label: "Service alert" },
};

/** Rotating service alert strip under the top bar. Data comes from lib/alerts.ts. */
export function AlertBanner() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dismissed, setDismissed] = useStoredState<string[]>(STORAGE_KEYS.dismissedAlerts, NONE_DISMISSED);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const alerts: Alert[] = useMemo(
    () => getActiveAlerts(now, VISIBLE_COUNT).filter((alert) => !dismissed.includes(alert.id)),
    [now, dismissed],
  );

  useEffect(() => {
    if (paused || alerts.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => i + 1), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, alerts.length]);

  if (alerts.length === 0) return null;
  const current = alerts[((index % alerts.length) + alerts.length) % alerts.length];
  const { bar, icon: Icon, label } = STYLE[current.severity];
  const about = current.affects === "all" ? "All services" : MODE_LABEL[current.affects];

  return (
    <section
      aria-label="Service alerts"
      className={`border-b ${bar}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-[1400px] items-start gap-2.5 px-4 py-2 sm:items-center sm:px-6">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" aria-hidden />
        <p key={current.id} className="min-w-0 flex-1 animate-fade text-[13px] leading-snug" role="status">
          <span className="sr-only">{label}: </span>
          <span className="mr-1.5 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
            {about}
          </span>
          <span className="font-semibold">{current.title}.</span>{" "}
          <span className="opacity-90">{current.message}</span>
          {current.source ? <span className="opacity-70"> · {current.source}</span> : null}
        </p>
        <div className="flex shrink-0 items-center">
          {alerts.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                aria-label="Previous alert"
                className="hidden cursor-pointer rounded-md p-1 hover:bg-white/60 sm:block"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="hidden px-0.5 text-[11px] font-semibold tabular-nums opacity-70 sm:inline">
                {(((index % alerts.length) + alerts.length) % alerts.length) + 1}/{alerts.length}
              </span>
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                aria-label="Next alert"
                className="cursor-pointer rounded-md p-1 hover:bg-white/60"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setDismissed((prev) => [...prev, current.id])}
            aria-label="Dismiss alert"
            className="cursor-pointer rounded-md p-1 hover:bg-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
