import { CAMPUSES } from "./routes";
import { MODE_LABEL, SUBWAY_FARE, fromMinutes, toMinutes } from "./constants";
import type { PlanRequest } from "./planner";
import type { TransitMode, TransitOption, TransitStep } from "./types";

const BUFFER_MIN = 5;
const RAIL_FARE_ESTIMATE = 10;

function arrivalDate(arriveBy: string): Date {
  const minutes = toMinutes(arriveBy);
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
  return date;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function transitMode(vehicleType: string, agency: string): TransitMode {
  const a = agency.toLowerCase();
  if (vehicleType === "SUBWAY" || vehicleType === "METRO_RAIL" || vehicleType === "TRAM" || vehicleType === "MONORAIL") {
    return "subway";
  }
  if (a.includes("metro-north") || a.includes("amtrak")) return "metro-north";
  if (a.includes("long island")) return "lirr";
  if (a.includes("nj transit") || a.includes("new jersey")) return "nj-transit";
  if (vehicleType === "BUS" || vehicleType === "INTERCITY_BUS" || vehicleType === "TROLLEYBUS" || vehicleType === "FERRY") {
    return "bus";
  }
  return "metro-north";
}

function mapStep(step: google.maps.DirectionsStep): TransitStep & { line?: string } {
  const minutes = Math.max(1, Math.round((step.duration?.value ?? 60) / 60));
  const transit = step.transit;
  if (String(step.travel_mode) === "TRANSIT" && transit) {
    const agency = transit.line.agencies?.[0]?.name ?? "";
    const mode = transitMode(String(transit.line.vehicle?.type ?? ""), agency);
    const line = transit.line.short_name || transit.line.name || MODE_LABEL[mode];
    const from = transit.departure_stop?.name ? ` from ${transit.departure_stop.name}` : "";
    const to = transit.arrival_stop?.name ? ` to ${transit.arrival_stop.name}` : "";
    return { mode, instruction: `Take the ${line}${from}${to}`, durationMinutes: minutes, line };
  }
  return { mode: "walk", instruction: stripHtml(step.instructions || "Walk"), durationMinutes: minutes };
}

function estimateFare(steps: TransitStep[]): number {
  if (steps.some((s) => s.mode === "metro-north" || s.mode === "lirr" || s.mode === "nj-transit")) {
    return RAIL_FARE_ESTIMATE;
  }
  return steps.some((s) => s.mode === "subway" || s.mode === "bus") ? SUBWAY_FARE : 0;
}

function mapRoute(route: google.maps.DirectionsRoute, index: number, request: PlanRequest): TransitOption | null {
  const leg = route.legs[0];
  if (!leg) return null;
  const mapped = (leg.steps ?? []).map(mapStep);
  const transitSteps = mapped.filter((s) => s.mode !== "walk");
  if (transitSteps.length === 0) return null;

  const durationMinutes = Math.max(1, Math.round((leg.duration?.value ?? 0) / 60));
  const longest = [...transitSteps].sort((a, b) => b.durationMinutes - a.durationMinutes)[0];
  const lines = Array.from(new Set(mapped.map((s) => s.line).filter((l): l is string => Boolean(l))));
  const steps: TransitStep[] = mapped.map(({ mode, instruction, durationMinutes: d }) => ({
    mode,
    instruction,
    durationMinutes: d,
  }));
  return {
    id: `google-${index}`,
    mode: longest.mode,
    label: lines.length > 0 ? lines.join(" + ") : MODE_LABEL[longest.mode],
    summary: transitSteps.slice(0, 3).map((s) => s.instruction).join(", then "),
    durationMinutes,
    cost: route.fare?.value ?? estimateFare(steps),
    transfers: Math.max(0, transitSteps.length - 1),
    leaveBy: fromMinutes(toMinutes(request.arriveBy) - durationMinutes - BUFFER_MIN),
    arriveBy: request.arriveBy,
    steps,
    tags: [],
    source: "google",
  };
}

/**
 * Asks Google Directions for transit routes arriving by the requested time.
 * Rejects on timeout or any API error. Resolves to [] when Google finds nothing usable.
 */
export async function fetchGoogleOptions(
  request: PlanRequest,
  originQuery: string,
  google: typeof globalThis.google,
  timeoutMs: number,
): Promise<TransitOption[]> {
  const service = new google.maps.DirectionsService();
  const destination = CAMPUSES[request.campus].position;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Google Directions timed out")), timeoutMs);
  });
  try {
    const result = await Promise.race([
      service.route({
        origin: originQuery,
        destination,
        travelMode: google.maps.TravelMode.TRANSIT,
        provideRouteAlternatives: true,
        transitOptions: { arrivalTime: arrivalDate(request.arriveBy) },
      }),
      timeout,
    ]);
    return result.routes
      .map((route, i) => mapRoute(route, i, request))
      .filter((option): option is TransitOption => option !== null)
      .slice(0, 4);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
