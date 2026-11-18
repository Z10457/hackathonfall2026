import type { Alert } from "./types";

// STUB: replaced by the content worker. Export names and signatures are the contract.

/** 10+ rotating service alerts. */
export const SERVICE_ALERTS: Alert[] = [];

/** Deterministically picks the alerts to show for a given time (rotates every few minutes). */
export function getActiveAlerts(now: Date, count = 2): Alert[] {
  void now;
  return SERVICE_ALERTS.slice(0, count);
}
