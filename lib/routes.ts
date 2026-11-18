import type { Campus, Direction, LatLng } from "./types";

/** Pickup points. */
export const CAMPUSES: Record<Campus, { name: string; pickup: string; position: LatLng }> = {
  "rose-hill": {
    name: "Rose Hill",
    pickup: "Ram Van office, ground level of the parking garage, across from O'Hare Hall",
    position: { lat: 40.8601, lng: -73.8822 },
  },
  "lincoln-center": {
    name: "Lincoln Center",
    pickup: "Corner of 60th Street and Columbus (9th) Avenue",
    position: { lat: 40.7696, lng: -73.9848 },
  },
};

export interface RouteWaypoint extends LatLng {
  /** Landmark label, present on notable waypoints only. */
  label?: string;
}

/**
 * Approximate Ram Van route, ordered Rose Hill -> Lincoln Center:
 * Fordham Rd west, Major Deegan south, Alexander Hamilton Bridge,
 * Henry Hudson Pkwy south along the Hudson, exit at 57th, up to 60th and Columbus.
 */
export const ROUTE_WAYPOINTS: RouteWaypoint[] = [
  { lat: 40.8601, lng: -73.8822, label: "Rose Hill Ram Van office" },
  { lat: 40.8616, lng: -73.8812, label: "Southern Blvd" },
  { lat: 40.8612, lng: -73.8905, label: "Fordham Plaza" },
  { lat: 40.8625, lng: -73.897, label: "Grand Concourse" },
  { lat: 40.8627, lng: -73.9012, label: "Jerome Ave" },
  { lat: 40.8622, lng: -73.9075 },
  { lat: 40.8618, lng: -73.9128, label: "Major Deegan Expwy" },
  { lat: 40.8562, lng: -73.9178 },
  { lat: 40.8502, lng: -73.9222 },
  { lat: 40.8458, lng: -73.9262, label: "Alexander Hamilton Bridge" },
  { lat: 40.8472, lng: -73.9345 },
  { lat: 40.8492, lng: -73.9418 },
  { lat: 40.8478, lng: -73.9452, label: "Henry Hudson Pkwy" },
  { lat: 40.8408, lng: -73.9468 },
  { lat: 40.8335, lng: -73.95, label: "W 155th St" },
  { lat: 40.827, lng: -73.9535 },
  { lat: 40.82, lng: -73.959 },
  { lat: 40.8162, lng: -73.9622, label: "W 125th St" },
  { lat: 40.8095, lng: -73.968 },
  { lat: 40.8025, lng: -73.9735 },
  { lat: 40.797, lng: -73.977, label: "W 96th St" },
  { lat: 40.7905, lng: -73.9815 },
  { lat: 40.786, lng: -73.985, label: "W 79th St" },
  { lat: 40.781, lng: -73.9885, label: "W 72nd St" },
  { lat: 40.7748, lng: -73.992 },
  { lat: 40.7708, lng: -73.9938, label: "W 57th St exit" },
  { lat: 40.7689, lng: -73.9893 },
  { lat: 40.7706, lng: -73.9876, label: "Amsterdam Ave" },
  { lat: 40.7696, lng: -73.9848, label: "Lincoln Center, 60th and Columbus" },
];

/** Bounding box of the route with a little padding. Useful for the fallback SVG map. */
export const ROUTE_BOUNDS = {
  north: 40.868,
  south: 40.764,
  east: -73.874,
  west: -74.002,
} as const;

export const MAP_CENTER: LatLng = { lat: 40.816, lng: -73.94 };

const EARTH_RADIUS_MILES = 3958.8;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

export function distanceMiles(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

export function bearingDegrees(a: LatLng, b: LatLng): number {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const SEGMENT_MILES: number[] = ROUTE_WAYPOINTS.slice(1).map((point, i) =>
  distanceMiles(ROUTE_WAYPOINTS[i], point),
);

/** Total one-way route length in miles (about 9.5). */
export const ROUTE_LENGTH_MILES: number = SEGMENT_MILES.reduce((sum, d) => sum + d, 0);

/** Cumulative fraction (0 to 1) of the route at each waypoint, Rose Hill -> Lincoln Center. */
export const WAYPOINT_FRACTIONS: number[] = SEGMENT_MILES.reduce<number[]>(
  (acc, d) => [...acc, acc[acc.length - 1] + d / ROUTE_LENGTH_MILES],
  [0],
);

export interface RoutePoint {
  position: LatLng;
  /** Compass heading in the direction of travel. */
  heading: number;
  /** Next labeled landmark ahead of the van. */
  nextStop: string;
}

/**
 * Position of a van that is `progress` (0 to 1) of the way through its trip.
 * progress 0 is the origin campus for that direction, 1 is the destination.
 */
export function pointAtProgress(progress: number, direction: Direction): RoutePoint {
  const clamped = Math.min(1, Math.max(0, progress));
  // Fraction measured from Rose Hill.
  const f = direction === "to-lincoln-center" ? clamped : 1 - clamped;
  const last = ROUTE_WAYPOINTS.length - 1;
  const found = WAYPOINT_FRACTIONS.findIndex((wf) => wf >= f);
  const upper = found <= 0 ? 1 : found;
  const lower = upper - 1;
  const span = WAYPOINT_FRACTIONS[upper] - WAYPOINT_FRACTIONS[lower] || 1;
  const t = (f - WAYPOINT_FRACTIONS[lower]) / span;
  const a = ROUTE_WAYPOINTS[lower];
  const b = ROUTE_WAYPOINTS[upper];
  const position = { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
  const heading = direction === "to-lincoln-center" ? bearingDegrees(a, b) : bearingDegrees(b, a);

  const ahead =
    direction === "to-lincoln-center"
      ? ROUTE_WAYPOINTS.slice(upper).find((w) => w.label)
      : ROUTE_WAYPOINTS.slice(0, lower + 1)
          .reverse()
          .find((w) => w.label);
  const fallback = direction === "to-lincoln-center" ? ROUTE_WAYPOINTS[last] : ROUTE_WAYPOINTS[0];
  return { position, heading, nextStop: (ahead ?? fallback).label ?? "" };
}

export function destinationOf(direction: Direction): Campus {
  return direction === "to-rose-hill" ? "rose-hill" : "lincoln-center";
}

export function originOf(direction: Direction): Campus {
  return direction === "to-rose-hill" ? "lincoln-center" : "rose-hill";
}
