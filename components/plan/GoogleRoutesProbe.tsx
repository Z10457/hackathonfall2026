"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

interface GoogleRoutesProbeProps {
  onReady: (google: typeof globalThis.google) => void;
}

/** Loads the Google "routes" library and hands the global namespace to the planner. Renders nothing. */
export function GoogleRoutesProbe({ onReady }: GoogleRoutesProbeProps) {
  const routes = useMapsLibrary("routes");
  useEffect(() => {
    if (routes) onReady(globalThis.google);
  }, [routes, onReady]);
  return null;
}
