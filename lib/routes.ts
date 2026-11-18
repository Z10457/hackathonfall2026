import type { Campus, Direction, LatLng } from "./types";

/** Pickup points. */
export const CAMPUSES: Record<Campus, { name: string; pickup: string; position: LatLng }> = {
  "rose-hill": {
    name: "Rose Hill",
    pickup: "Ram Van office, ground level of the parking garage, across from O'Hare Hall",
    position: { lat: 40.86014, lng: -73.88217 },
  },
  "lincoln-center": {
    name: "Lincoln Center",
    pickup: "Corner of 60th Street and Columbus (9th) Avenue",
    position: { lat: 40.7695, lng: -73.98457 },
  },
};

export interface RouteWaypoint extends LatLng {
  /** Landmark label, present on notable waypoints only. */
  label?: string;
}

/**
 * Ram Van route, ordered Rose Hill -> Lincoln Center, following real road geometry
 * (OpenStreetMap data routed with OSRM, simplified to about 110 points):
 * Fordham Rd west, University Heights Bridge, Dyckman St, Henry Hudson Pkwy south along the
 * Hudson, exit at 57th, up to 60th and Columbus.
 */
export const ROUTE_WAYPOINTS: RouteWaypoint[] = [
  { lat: 40.86014, lng: -73.88217, label: "Rose Hill Ram Van office" },
  { lat: 40.86, lng: -73.88183 },
  { lat: 40.85987, lng: -73.8819 },
  { lat: 40.85945, lng: -73.88084 },
  { lat: 40.85846, lng: -73.88104 },
  { lat: 40.85838, lng: -73.88122 },
  { lat: 40.85781, lng: -73.88165 },
  { lat: 40.85789, lng: -73.88223 },
  { lat: 40.85819, lng: -73.8834 },
  { lat: 40.85825, lng: -73.88395 },
  { lat: 40.85821, lng: -73.88434 },
  { lat: 40.85847, lng: -73.88521 },
  { lat: 40.86091, lng: -73.88989, label: "Fordham Plaza" },
  { lat: 40.86183, lng: -73.89144 },
  { lat: 40.86194, lng: -73.89176 },
  { lat: 40.86184, lng: -73.89256 },
  { lat: 40.86187, lng: -73.89309 },
  { lat: 40.86209, lng: -73.89498 },
  { lat: 40.86246, lng: -73.89693, label: "Grand Concourse" },
  { lat: 40.86241, lng: -73.89785 },
  { lat: 40.86216, lng: -73.8994 },
  { lat: 40.86281, lng: -73.90121, label: "Jerome Ave" },
  { lat: 40.86271, lng: -73.90264 },
  { lat: 40.86284, lng: -73.9081 },
  { lat: 40.86271, lng: -73.90894 },
  { lat: 40.86252, lng: -73.9095 },
  { lat: 40.86176, lng: -73.91064 },
  { lat: 40.86166, lng: -73.91089 },
  { lat: 40.86174, lng: -73.91181 },
  { lat: 40.86198, lng: -73.91288 },
  { lat: 40.86187, lng: -73.91302 },
  { lat: 40.86183, lng: -73.91288 },
  { lat: 40.86178, lng: -73.91251 },
  { lat: 40.86189, lng: -73.91238 },
  { lat: 40.86197, lng: -73.91284 },
  { lat: 40.86219, lng: -73.91348, label: "University Heights Bridge" },
  { lat: 40.86461, lng: -73.9192 },
  { lat: 40.86771, lng: -73.92122 },
  { lat: 40.86553, lng: -73.92727, label: "Dyckman St" },
  { lat: 40.86563, lng: -73.92778 },
  { lat: 40.86568, lng: -73.92896 },
  { lat: 40.86584, lng: -73.92963 },
  { lat: 40.86606, lng: -73.93001 },
  { lat: 40.86681, lng: -73.93091 },
  { lat: 40.86692, lng: -73.93127, label: "Henry Hudson Pkwy" },
  { lat: 40.86694, lng: -73.9317 },
  { lat: 40.86687, lng: -73.93194 },
  { lat: 40.86652, lng: -73.93259 },
  { lat: 40.86632, lng: -73.93279 },
  { lat: 40.86407, lng: -73.93399 },
  { lat: 40.86226, lng: -73.93521 },
  { lat: 40.8605, lng: -73.93623 },
  { lat: 40.85851, lng: -73.93791 },
  { lat: 40.85721, lng: -73.93891 },
  { lat: 40.85537, lng: -73.94025 },
  { lat: 40.85283, lng: -73.94193 },
  { lat: 40.85195, lng: -73.94278 },
  { lat: 40.85065, lng: -73.94438 },
  { lat: 40.84988, lng: -73.94494, label: "George Washington Bridge" },
  { lat: 40.84924, lng: -73.94517 },
  { lat: 40.84848, lng: -73.94524 },
  { lat: 40.84398, lng: -73.94506 },
  { lat: 40.84296, lng: -73.94519 },
  { lat: 40.84203, lng: -73.94543 },
  { lat: 40.84084, lng: -73.94596 },
  { lat: 40.83989, lng: -73.94653 },
  { lat: 40.83882, lng: -73.9474 },
  { lat: 40.83753, lng: -73.94863 },
  { lat: 40.83692, lng: -73.94907 },
  { lat: 40.83648, lng: -73.94925 },
  { lat: 40.83152, lng: -73.95074, label: "W 155th St" },
  { lat: 40.83068, lng: -73.95108 },
  { lat: 40.82987, lng: -73.95153 },
  { lat: 40.82871, lng: -73.95239 },
  { lat: 40.82472, lng: -73.95607 },
  { lat: 40.82036, lng: -73.95949 },
  { lat: 40.81872, lng: -73.96095, label: "W 125th St" },
  { lat: 40.81648, lng: -73.96323 },
  { lat: 40.81538, lng: -73.96416 },
  { lat: 40.81371, lng: -73.96518 },
  { lat: 40.81164, lng: -73.96672 },
  { lat: 40.80804, lng: -73.96906 },
  { lat: 40.80382, lng: -73.97228 },
  { lat: 40.80137, lng: -73.97399 },
  { lat: 40.79996, lng: -73.9748 },
  { lat: 40.79787, lng: -73.97563 },
  { lat: 40.79657, lng: -73.97627, label: "W 96th St" },
  { lat: 40.79575, lng: -73.97701 },
  { lat: 40.79351, lng: -73.97949 },
  { lat: 40.79185, lng: -73.98084 },
  { lat: 40.79088, lng: -73.9815 },
  { lat: 40.7897, lng: -73.98218 },
  { lat: 40.78847, lng: -73.98275 },
  { lat: 40.78656, lng: -73.98349 },
  { lat: 40.78523, lng: -73.98429, label: "W 79th St" },
  { lat: 40.7818, lng: -73.98676 },
  { lat: 40.7807, lng: -73.98781, label: "W 72nd St" },
  { lat: 40.78013, lng: -73.98827 },
  { lat: 40.77167, lng: -73.99441 },
  { lat: 40.77126, lng: -73.99458 },
  { lat: 40.77081, lng: -73.99468 },
  { lat: 40.77063, lng: -73.99423 },
  { lat: 40.77105, lng: -73.99414, label: "W 57th St exit" },
  { lat: 40.77127, lng: -73.99396 },
  { lat: 40.7713, lng: -73.99386 },
  { lat: 40.77123, lng: -73.99357 },
  { lat: 40.77032, lng: -73.99139 },
  { lat: 40.77286, lng: -73.98954 },
  { lat: 40.77166, lng: -73.98668 },
  { lat: 40.77228, lng: -73.98622 },
  { lat: 40.7711, lng: -73.98341 },
  { lat: 40.7695, lng: -73.98457, label: "Lincoln Center, 60th and Columbus" },
];

/** Bounding box of the route with a little padding. Useful for the fallback SVG map. */
export const ROUTE_BOUNDS = {
  north: 40.872,
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

/** Total one-way route length in miles (about 11.7). */
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
