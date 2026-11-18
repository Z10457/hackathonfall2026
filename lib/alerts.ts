import type { Alert } from "./types";

/** Length of one rotation slot. The visible alerts change every 5 minutes. */
const ROTATION_MS = 5 * 60 * 1000;

/** Seeded service alerts for the Live tab banner. Titles stay under 60 characters. */
export const SERVICE_ALERTS: Alert[] = [
  {
    id: "alert-01",
    severity: "info",
    title: "Vans 5 and 6 added for the evening peak",
    message: "Vans 5 and 6 run from 4 to 6 PM today, so there are more seats on the evening return.",
    affects: "ram-van",
    source: "Ram Van Office",
  },
  {
    id: "alert-02",
    severity: "warning",
    title: "Rose Hill pickup moved to the garage ground level",
    message: "Board across from O'Hare Hall on the garage ground level until further notice.",
    affects: "ram-van",
    source: "Ram Van Office",
  },
  {
    id: "alert-03",
    severity: "info",
    title: "Reserve 48 hours ahead for Thursday evening trips",
    message: "Thursday evening vans are filling early, so reserve online up to 48 hours ahead.",
    affects: "ram-van",
    source: "Ram Van Office",
  },
  {
    id: "alert-04",
    severity: "warning",
    title: "Expect 10 to 15 minute delays on the Henry Hudson Parkway",
    message: "Heavy northbound traffic is slowing the vans, so leave extra time for the morning run.",
    affects: "ram-van",
    source: "Ram Van Office",
  },
  {
    id: "alert-05",
    severity: "info",
    title: "Vans 1 to 4 run about every half hour",
    message: "Vans 1 to 4 run roughly every 30 minutes from 6:15 AM to midnight on weekdays.",
    affects: "ram-van",
    source: "Ram Van Office",
  },
  {
    id: "alert-06",
    severity: "critical",
    title: "D trains run local between 36 St and 34 St",
    message: "D trains run local between 36 St and 34 St this weekend, adding about 10 minutes to Fordham trips.",
    affects: "subway",
    source: "MTA",
  },
  {
    id: "alert-07",
    severity: "warning",
    title: "4 train has residual delays near 149 St",
    message: "Northbound 4 trains are running with delays after a signal problem near 149 St-Grand Concourse.",
    affects: "subway",
    source: "MTA",
  },
  {
    id: "alert-08",
    severity: "info",
    title: "1 train skips 72 St on weekend nights",
    message: "Late-night 1 trains skip 72 St while crews work, so use 66 St-Lincoln Center or 79 St instead.",
    affects: "subway",
    source: "MTA",
  },
  {
    id: "alert-09",
    severity: "warning",
    title: "Bx12 SBS detour on Fordham Rd",
    message: "Bx12 SBS buses detour around construction near Fordham Plaza, so allow 10 extra minutes.",
    affects: "bus",
    source: "MTA Bus",
  },
  {
    id: "alert-10",
    severity: "critical",
    title: "Harlem Line service change at Fordham station",
    message: "Some Harlem Line trains skip Fordham station this weekend, so check the schedule before you ride.",
    affects: "metro-north",
    source: "Metro-North",
  },
  {
    id: "alert-11",
    severity: "warning",
    title: "New Haven Line running 15 minutes behind",
    message: "New Haven Line trains are running about 15 minutes behind schedule near Fordham station.",
    affects: "metro-north",
    source: "Metro-North",
  },
  {
    id: "alert-12",
    severity: "info",
    title: "Port Jefferson Branch on a Saturday schedule",
    message: "Port Jefferson Branch trains follow a modified weekend timetable, so check times before you travel.",
    affects: "lirr",
    source: "LIRR",
  },
  {
    id: "alert-13",
    severity: "warning",
    title: "NJ Transit 166 bus rerouted at Port Authority",
    message: "The 166 bus now stops at a different bay at Port Authority, so follow the new signs.",
    affects: "nj-transit",
    source: "NJ Transit",
  },
  {
    id: "alert-14",
    severity: "warning",
    title: "Snow likely Thursday morning",
    message: "Expect slower roads and possible transit delays Thursday, so leave a little early.",
    affects: "all",
    source: "National Weather Service",
  },
  {
    id: "alert-15",
    severity: "info",
    title: "Heat this week, bring water on long commutes",
    message: "Temperatures near 90 degrees are forecast this week, so carry water on long walks and waits.",
    affects: "all",
    source: "National Weather Service",
  },
];

/**
 * Deterministically picks `count` alerts for `now`. The window start rotates every 5 minutes,
 * and a Ram Van alert is always included when one exists. Pure: no input or module state changes.
 */
export function getActiveAlerts(now: Date, count = 2): Alert[] {
  const total = SERVICE_ALERTS.length;
  const size = Math.min(Math.max(0, Math.floor(count)), total);
  if (size === 0) return [];

  const slot = Math.floor(now.getTime() / ROTATION_MS);
  const start = ((slot % total) + total) % total;
  const rotated = Array.from({ length: size }, (_, i) => SERVICE_ALERTS[(start + i) % total]);

  if (rotated.some((alert) => alert.affects === "ram-van")) return rotated;

  const vanAlerts = SERVICE_ALERTS.filter((alert) => alert.affects === "ram-van");
  if (vanAlerts.length === 0) return rotated;

  const van = vanAlerts[((slot % vanAlerts.length) + vanAlerts.length) % vanAlerts.length];
  return [...rotated.slice(0, size - 1), van];
}
