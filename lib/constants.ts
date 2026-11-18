import type { Campus, Day, Direction, Region, TransitMode } from "./types";

export const BRAND = {
  maroon: "#900028",
  maroonDark: "#6B001E",
  gold: "#C9A227",
  /** Outline color for vans heading to Lincoln Center. */
  blue: "#1A5FB4",
} as const;

export const BRAND_ASSETS = {
  logo: "/brand/fordham-logo.svg",
  logoWhite: "/brand/fordham-logo-white.svg",
  ramMascot: "/brand/ram-mascot.png",
  ramVan: "/brand/ram-van.png",
  /** Illustrated white van with the Fordham logo, 160 x 80 (2:1), faces LEFT. Used for map markers and lists. */
  ramVanIcon: "/brand/ram-van-illustrated.svg",
  /** Photo cutout of a real Ram Van (transparent PNG). Not used for markers. */
  ramVanCutout: "/brand/ram-van-icon.png",
  ramVanPhoto: "/brand/ram-van-photo.jpg",
  ramStatue: "/brand/ram-statue.jpg",
} as const;

export const DIRECTION_COLOR: Record<Direction, string> = {
  "to-rose-hill": BRAND.maroon,
  "to-lincoln-center": BRAND.blue,
};

export const DIRECTION_LABEL: Record<Direction, string> = {
  "to-rose-hill": "To Rose Hill",
  "to-lincoln-center": "To Lincoln Center",
};

export const CAMPUS_LABEL: Record<Campus, string> = {
  "rose-hill": "Rose Hill",
  "lincoln-center": "Lincoln Center",
};

export const REGIONS: Region[] = [
  "Manhattan",
  "Bronx",
  "Brooklyn",
  "Queens",
  "Staten Island",
  "Long Island",
  "Westchester",
  "Rockland",
  "Hudson Valley & Upstate",
  "New Jersey",
  "Connecticut",
];

export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const MODE_LABEL: Record<TransitMode, string> = {
  "ram-van": "Ram Van",
  subway: "Subway",
  bus: "Bus",
  "metro-north": "Metro-North",
  lirr: "LIRR",
  "nj-transit": "NJ Transit",
  walk: "Walk",
  carpool: "Carpool",
  bike: "Bike",
};

export const RAM_VAN_FARE = 3.5;
export const SUBWAY_FARE = 2.9;

/** Peak windows when vans 5 and 6 are in service (24h, end exclusive). */
export const PEAK_WINDOWS: Array<[number, number]> = [
  [8, 10],
  [16, 18],
];

export function isPeakHour(date: Date): boolean {
  const h = date.getHours();
  return PEAK_WINDOWS.some(([start, end]) => h >= start && h < end);
}

/** "08:30" -> "8:30 AM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "08:30" -> minutes since midnight */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** minutes since midnight -> "08:30" (wraps around midnight) */
export function fromMinutes(total: number): string {
  const t = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join("");
}
