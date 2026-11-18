"use client";

import { BRAND } from "@/lib/constants";
import { LAND_RINGS, type LandArea } from "@/lib/mapGeo";
import { CAMPUSES, ROUTE_WAYPOINTS } from "@/lib/routes";
import type { LatLng, Van } from "@/lib/types";
import { VanMarker } from "./VanMarker";

/**
 * Map frame. Shorelines come from real boundary data (lib/mapGeo.ts) and the route from real
 * road geometry (lib/routes.ts), drawn with an equirectangular projection corrected for latitude
 * so distances and shapes are true to scale.
 */
const VIEW = { north: 40.9026, south: 40.7346, west: -74.018, east: -73.858 } as const;
const LAT_SPAN = VIEW.north - VIEW.south;
const LNG_SPAN = VIEW.east - VIEW.west;
const W = 400;
const H = Math.round((W * LAT_SPAN) / (LNG_SPAN * Math.cos((((VIEW.north + VIEW.south) / 2) * Math.PI) / 180)));

function project(point: LatLng): { x: number; y: number } {
  return {
    x: ((point.lng - VIEW.west) / LNG_SPAN) * W,
    y: ((VIEW.north - point.lat) / LAT_SPAN) * H,
  };
}

function at(lat: number, lng: number, rotate = 0): string {
  const { x, y } = project({ lat, lng });
  return `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rotate})`;
}

/** Flat [lat, lng, lat, lng, ...] ring -> SVG points string. */
function ringToPoints(ring: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < ring.length; i += 2) {
    const { x, y } = project({ lat: ring[i], lng: ring[i + 1] });
    out.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return out.join(" ");
}

const AREA_ORDER: LandArea[] = ["new-jersey", "westchester", "queens", "brooklyn", "bronx", "manhattan"];
const LAND: Array<{ area: LandArea; points: string[] }> = AREA_ORDER.filter((area) => LAND_RINGS[area]).map(
  (area) => ({ area, points: LAND_RINGS[area].map(ringToPoints) }),
);
const MANHATTAN_POINTS = LAND.find((l) => l.area === "manhattan")?.points ?? [];

const latLngPoints = (pts: Array<[number, number]>): string =>
  pts
    .map(([lat, lng]) => {
      const { x, y } = project({ lat, lng });
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

/** Central Park corners: Columbus Circle, Grand Army Plaza, 110th and 5th, 110th and CPW. */
const CENTRAL_PARK = latLngPoints([
  [40.7681, -73.9819],
  [40.7644, -73.973],
  [40.7968, -73.9493],
  [40.8005, -73.9582],
]);
/** George Washington Bridge, Manhattan anchorage to Fort Lee. */
const GW_BRIDGE = latLngPoints([
  [40.8503, -73.9462],
  [40.8537, -73.9642],
]);

const ROUTE_POINTS = ROUTE_WAYPOINTS.map((w) => {
  const { x, y } = project(w);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");

interface LandmarkStyle {
  text: string;
  dx: number;
  dy: number;
  anchor: "start" | "end";
}

/** Which labeled route waypoints to print on the map, and where the text sits. */
const LANDMARK_STYLE: Record<string, LandmarkStyle> = {
  "Grand Concourse": { text: "Grand Concourse", dx: 0, dy: 13, anchor: "start" },
  "University Heights Bridge": { text: "University Hts Bridge", dx: 4, dy: 14, anchor: "start" },
  "W 155th St": { text: "W 155th St", dx: 8, dy: 3, anchor: "start" },
  "W 125th St": { text: "W 125th St", dx: 8, dy: 3, anchor: "start" },
  "W 96th St": { text: "W 96th St", dx: 8, dy: 3, anchor: "start" },
  "W 72nd St": { text: "W 72nd St", dx: -8, dy: 3, anchor: "end" },
};
const LANDMARKS = ROUTE_WAYPOINTS.filter((w) => w.label && LANDMARK_STYLE[w.label]).map((w) => ({
  at: { lat: w.lat, lng: w.lng },
  ...LANDMARK_STYLE[w.label as string],
}));

interface PinLabelProps {
  at: LatLng;
  text: string;
  /** Where the name pill sits relative to the pin. */
  place: "above" | "below";
}

function PinLabel({ at: point, text, place }: PinLabelProps) {
  const { x, y } = project(point);
  const width = text.length * 6.4 + 18;
  const rectY = place === "above" ? y - 36 : y + 14;
  return (
    <g>
      <rect x={x - width / 2} y={rectY} width={width} height={22} rx={11} fill={BRAND.maroon} stroke="#fff" strokeWidth={2} />
      <text x={x} y={rectY + 15} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#fff">
        {text}
      </text>
      <circle cx={x} cy={y} r={8} fill={BRAND.maroon} stroke={BRAND.gold} strokeWidth={3} />
      <circle cx={x} cy={y} r={2.8} fill="#fff" />
    </g>
  );
}

const WATER = "#cfe1ee";
const LAND_FILL = "#f4efe6";
const SHORE = "#d6ccba";

interface FallbackMapProps {
  vans: Van[];
  selectedId: string | null;
  onSelect: (vanId: string) => void;
}

/** Built-in SVG map used when Google Maps has no key or fails to load. */
export function FallbackMap({ vans, selectedId, onSelect }: FallbackMapProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ backgroundColor: WATER }}>
      <div className="relative h-full shrink-0" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full overflow-visible"
          role="img"
          aria-label="Map of the Ram Van route between Rose Hill in the Bronx and Lincoln Center in Manhattan"
        >
          <defs>
            <clipPath id="manhattan-clip">
              {MANHATTAN_POINTS.map((points, i) => (
                <polygon key={i} points={points} />
              ))}
            </clipPath>
            {/* Manhattan's street grid runs about 29 degrees east of north. */}
            <pattern id="street-grid" width="7" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(29)">
              <path d="M0 0V18M0 0H7" fill="none" stroke="#b9ad98" strokeOpacity="0.4" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect x={-W * 2} y={-H} width={W * 5} height={H * 3} fill={WATER} />
          {LAND.map(({ area, points }) =>
            points.map((ring, i) => (
              <polygon
                key={`${area}-${i}`}
                points={ring}
                fill={LAND_FILL}
                // New Jersey is drawn from ZIP areas, so its internal borders are hidden.
                stroke={area === "new-jersey" ? LAND_FILL : SHORE}
                strokeWidth={area === "new-jersey" ? 0.8 : 1}
                strokeLinejoin="round"
              />
            )),
          )}
          <rect x={0} y={0} width={W} height={H} fill="url(#street-grid)" clipPath="url(#manhattan-clip)" />
          <polygon points={CENTRAL_PARK} fill="#cfe3c4" stroke="#b8d3ab" strokeWidth={1} strokeLinejoin="round" />
          <text transform={at(40.7826, -73.9655, -61)} fontSize={7.5} fill="#55764a" textAnchor="middle" fontWeight={600}>
            Central Park
          </text>
          <polyline points={GW_BRIDGE} fill="none" stroke="#8d97a3" strokeWidth={2} />
          <text transform={at(40.8548, -73.9575, 14)} fontSize={7} fill="#6b7480" textAnchor="middle" fontWeight={600}>
            GW Bridge
          </text>
          <g fontSize={9} fontStyle="italic" fill="#5f84a3">
            <text transform={at(40.806, -73.9762, -61)} textAnchor="middle">Hudson River</text>
            <text transform={at(40.8395, -73.9325, -72)} textAnchor="middle" fontSize={7}>Harlem River</text>
            <text transform={at(40.7755, -73.9385, -52)} textAnchor="middle" fontSize={8}>East River</text>
          </g>
          <g fontSize={10} fontWeight={700} fill="#8a7f6c" letterSpacing={2.2} textAnchor="middle">
            <text transform={at(40.842, -73.893)}>THE BRONX</text>
            <text transform={at(40.7985, -73.9415, -61)}>MANHATTAN</text>
            <text transform={at(40.8, -74.004, -61)}>NEW JERSEY</text>
            <text transform={at(40.757, -73.9)}>QUEENS</text>
          </g>
          <g fontSize={7.5} fontWeight={600} fill="#9a8f7c" textAnchor="middle">
            <text transform={at(40.868, -73.9215)}>Inwood</text>
            <text transform={at(40.8296, -73.9205)}>Yankee Stadium</text>
            <text transform={at(40.8725, -73.878)}>Botanical Garden</text>
          </g>
          <circle {...(({ x, y }) => ({ cx: x, cy: y }))(project({ lat: 40.8296, lng: -73.9262 }))} r={2.2} fill="#9a8f7c" />
          <polyline points={ROUTE_POINTS} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={ROUTE_POINTS} fill="none" stroke={BRAND.maroon} strokeOpacity={0.92} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={ROUTE_POINTS} fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={1.1} strokeDasharray="1 7" strokeLinecap="round" />
          {LANDMARKS.map((l) => {
            const { x, y } = project(l.at);
            return (
              <g key={l.text}>
                <circle cx={x} cy={y} r={3} fill="#fff" stroke={BRAND.maroon} strokeWidth={1.7} />
                <text x={x + l.dx} y={y + l.dy} textAnchor={l.anchor} fontSize={8.5} fontWeight={600} fill="#3b3631" stroke="#fff" strokeWidth={3} paintOrder="stroke">
                  {l.text}
                </text>
              </g>
            );
          })}
          <PinLabel at={CAMPUSES["rose-hill"].position} text="Rose Hill" place="above" />
          <PinLabel at={CAMPUSES["lincoln-center"].position} text="Lincoln Center" place="below" />
        </svg>
        {vans.map((van) => {
          const { x, y } = project(van.position);
          const selected = van.id === selectedId;
          return (
            <div
              key={van.id}
              className="absolute"
              style={{
                left: `${(x / W) * 100}%`,
                top: `${(y / H) * 100}%`,
                transform: "translate(-50%, -50%)",
                transition: "left 0.3s linear, top 0.3s linear",
                zIndex: selected ? 20 : 10,
              }}
            >
              <VanMarker van={van} selected={selected} onSelect={onSelect} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
