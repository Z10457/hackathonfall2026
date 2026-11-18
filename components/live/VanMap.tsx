"use client";

import { useCallback, useEffect, useState } from "react";
import type { TrafficLevel, Van } from "@/lib/types";
import { FallbackMap } from "./FallbackMap";
import { GoogleRouteMap } from "./GoogleRouteMap";
import { Legend, SimulatedNote, TrafficChip } from "./Legend";

interface VanMapProps {
  vans: Van[];
  traffic: TrafficLevel;
  selectedId: string | null;
  onSelect: (vanId: string) => void;
  /** Route and pickups only: hides the simulated traffic and "simulated" notes. */
  scheduleOnly?: boolean;
}

const LOAD_TIMEOUT_MS = 9000;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

/** Google Map when a key works, otherwise the styled SVG fallback. Never shows a broken map. */
export function VanMap({ vans, traffic, selectedId, onSelect, scheduleOnly = false }: VanMapProps) {
  const [failed, setFailed] = useState(API_KEY === "");
  const [ready, setReady] = useState(false);

  const fail = useCallback(() => setFailed(true), []);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (failed) return;
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      setFailed(true);
      previous?.();
    };
    const timer = window.setTimeout(() => {
      setFailed((current) => current || !ready);
    }, LOAD_TIMEOUT_MS);
    return () => {
      window.clearTimeout(timer);
      window.gm_authFailure = previous;
    };
  }, [failed, ready]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {failed ? (
        <FallbackMap vans={vans} selectedId={selectedId} onSelect={onSelect} />
      ) : (
        <GoogleRouteMap
          apiKey={API_KEY}
          vans={vans}
          selectedId={selectedId}
          onSelect={onSelect}
          onReady={markReady}
          onFail={fail}
        />
      )}
      <div className="pointer-events-none absolute top-3 left-3 z-30">
        <Legend />
      </div>
      {scheduleOnly ? null : (
        <>
          <div className="pointer-events-none absolute right-3 bottom-3 z-30">
            <TrafficChip level={traffic} />
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 z-30">
            <SimulatedNote />
          </div>
        </>
      )}
    </div>
  );
}
