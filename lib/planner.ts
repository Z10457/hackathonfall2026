import { CAMPUS_LABEL, MODE_LABEL, PEAK_WINDOWS, RAM_VAN_FARE, SUBWAY_FARE, fromMinutes, livesOnCampus, otherCampus, toMinutes } from "./constants";
import { fetchGoogleOptions } from "./plannerGoogle";
import {
  HUB_LEGS,
  ORIGIN_PROFILES,
  REGION_FALLBACK,
  REGION_STATE,
  type Hop,
  type HubLeg,
  type OriginProfile,
  type RailRoute,
} from "./plannerData";
import type { Campus, Region, Student, TransitMode, TransitOption, TransitStep, TransitTag } from "./types";

export interface PlanRequest {
  origin: string;
  campus: Campus;
  /** 24h "HH:MM". */
  arriveBy: string;
  /** True for Lincoln Center students, whose Ram Van rides are covered by a pass. */
  lincolnCenterPass?: boolean;
}

export const KNOWN_ORIGINS: Array<{ name: string; region: Region }> = ORIGIN_PROFILES.map((p) => ({
  name: p.name,
  region: p.region,
}));

/** Exact KNOWN_ORIGINS names of the two campuses. */
export const CAMPUS_ORIGIN: Record<Campus, string> = {
  "rose-hill": "Rose Hill",
  "lincoln-center": "Lincoln Center",
};

export interface PlannerDefaults {
  origin: string;
  campus: Campus;
}

/**
 * Starting point and destination for a student with no saved planner prefs. Residents start at
 * the campus they live on and head to their class campus (or the other campus when it is the same).
 * Commuters start from their home area and head to their class campus.
 */
export function plannerDefaultsFor(student: Student | null): PlannerDefaults {
  if (student && livesOnCampus(student)) {
    const residence = student.residenceCampus ?? student.campus;
    return {
      origin: CAMPUS_ORIGIN[residence],
      campus: student.campus !== residence ? student.campus : otherCampus(residence),
    };
  }
  return { origin: student?.homeArea ?? "", campus: student?.campus ?? "rose-hill" };
}

const MOCK_DELAY_MS = 500;
const GOOGLE_TIMEOUT_MS = 6000;
const TRANSIT_BUFFER_MIN = 5;
const VAN_BUFFER_MIN = 10;
/** First van of the day leaves at 6:15 AM. */
const FIRST_VAN_MIN = 6 * 60 + 15;
const VAN_WAIT_MIN = 10;

/* ----------------------------------------------------------- Origin lookup */

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const KEYWORD_REGIONS: Array<[RegExp, Region]> = [
  [/staten island/, "Staten Island"],
  [/brooklyn|bklyn/, "Brooklyn"],
  [/queens/, "Queens"],
  [/bronx/, "Bronx"],
  [/manhattan|new york city|\bnyc\b/, "Manhattan"],
  [/long island|nassau|suffolk/, "Long Island"],
  [/westchester/, "Westchester"],
  [/rockland/, "Rockland"],
  [/hudson valley|upstate|dutchess|ulster|orange county/, "Hudson Valley & Upstate"],
  [/new jersey|\bnj\b|bergen|essex county|hudson county/, "New Jersey"],
  [/connecticut|\bct\b|fairfield county/, "Connecticut"],
];

function zipRegion(text: string): Region | null {
  const match = /\b(\d{5})\b/.exec(text);
  if (!match) return null;
  const zip = match[1];
  const three = Number(zip.slice(0, 3));
  if (zip.startsWith("06")) return "Connecticut";
  if (zip.startsWith("07") || zip.startsWith("08")) return "New Jersey";
  if (three >= 100 && three <= 102) return "Manhattan";
  if (three === 103) return "Staten Island";
  if (three === 104) return "Bronx";
  if (three >= 105 && three <= 108) return "Westchester";
  if (three === 109) return "Rockland";
  if ([110, 111, 113, 114, 116].includes(three)) return "Queens";
  if (three === 112) return "Brooklyn";
  if ([115, 117, 118, 119].includes(three)) return "Long Island";
  if (three >= 120 && three <= 129) return "Hudson Valley & Upstate";
  return null;
}

function profileByName(name: string): OriginProfile {
  return ORIGIN_PROFILES.find((p) => p.name === name) ?? ORIGIN_PROFILES[0];
}

export interface ResolvedOrigin {
  profile: OriginProfile;
  /** True when the text matched a known place. */
  exact: boolean;
}

export function resolveOrigin(text: string): ResolvedOrigin {
  const input = normalize(text);
  if (input) {
    let best: { profile: OriginProfile; score: number } | null = null;
    for (const profile of ORIGIN_PROFILES) {
      for (const candidate of [profile.name, ...(profile.aliases ?? [])].map(normalize)) {
        let score = 0;
        if (candidate === input) score = 1000;
        else if (candidate.length >= 4 && ` ${input} `.includes(` ${candidate} `)) score = candidate.length;
        else if (input.length >= 3 && candidate.startsWith(input)) score = input.length / 2;
        if (score > 0 && (!best || score > best.score)) best = { profile, score };
      }
    }
    if (best) return { profile: best.profile, exact: true };
  }
  const region =
    zipRegion(input) ?? KEYWORD_REGIONS.find(([pattern]) => pattern.test(input))?.[1] ?? null;
  return { profile: profileByName(REGION_FALLBACK[region ?? "Manhattan"]), exact: false };
}

/** Text sent to Google, e.g. "Hicksville, NY". */
export function googleOriginQuery(origin: string): string {
  const resolved = resolveOrigin(origin);
  if (!resolved.exact || normalize(origin).length === 0) return origin.trim();
  return /,/.test(origin) ? origin.trim() : `${origin.trim()}, ${REGION_STATE[resolved.profile.region]}`;
}

/* ------------------------------------------------------------ Draft model */

interface Draft {
  key: string;
  mode: TransitMode;
  label: string;
  steps: TransitStep[];
  cost: number;
  transfers: number;
  note?: string;
}

const step = (mode: TransitMode, instruction: string, durationMinutes: number): TransitStep => ({
  mode,
  instruction,
  durationMinutes,
});
const sum = (steps: TransitStep[]): number => steps.reduce((total, s) => total + s.durationMinutes, 0);
const money = (n: number): number => Math.round(n * 100) / 100;

function summarize(steps: TransitStep[]): string {
  const parts = steps.filter((s) => s.mode !== "walk").map((s) => s.instruction);
  return (parts.length > 0 ? parts : steps.map((s) => s.instruction)).slice(0, 3).join(", then ");
}

function finalize(draft: Draft, request: PlanRequest): TransitOption {
  const duration = sum(draft.steps);
  const hasVan = draft.steps.some((s) => s.mode === "ram-van");
  const buffer = hasVan ? VAN_BUFFER_MIN : TRANSIT_BUFFER_MIN;
  return {
    id: draft.key,
    mode: draft.mode,
    label: draft.label,
    summary: summarize(draft.steps),
    durationMinutes: duration,
    cost: money(draft.cost),
    transfers: draft.transfers,
    leaveBy: fromMinutes(toMinutes(request.arriveBy) - duration - buffer),
    arriveBy: request.arriveBy,
    steps: draft.steps,
    tags: [],
    source: "mock",
    note: draft.note,
  };
}

/* --------------------------------------------------------- Local NYC legs */

function hopSteps(mode: "subway" | "bus", hop: Hop, campus: Campus, pickup: boolean): TransitStep[] {
  const ride = step(mode, mode === "subway" ? `Take the ${hop.line}` : `Ride the ${hop.line}`, hop.ride);
  const head = step("walk", `Walk to ${hop.from}`, 6);
  if (campus === "rose-hill") {
    return [head, ride, hop.direct ? step("walk", "Walk to the Rose Hill gate", 3) : step("bus", FORDHAM_BUS, 9)];
  }
  const tail = pickup ? "Walk to the Ram Van pickup at 60th St and Columbus Ave" : "Walk to Lincoln Center";
  return [head, ride, step("walk", tail, hop.walkOut ?? (hop.direct ? 3 : 5))];
}

const FORDHAM_BUS = "Transfer to the Bx12 SBS east on Fordham Rd to the Rose Hill gate";

const hopTransfers = (hop: Hop, campus: Campus): number =>
  hop.transfers + (campus === "rose-hill" && !hop.direct ? 1 : 0);

function localDrafts(profile: OriginProfile, campus: Campus): Draft[] {
  const routes = campus === "rose-hill" ? profile.rh : profile.lc;
  if (!routes) return [];
  const drafts: Draft[] = [];
  if (routes.subway) {
    drafts.push({
      key: "subway",
      mode: "subway",
      label: routes.subway.label,
      steps: hopSteps("subway", routes.subway, campus, false),
      cost: routes.subway.fare ?? SUBWAY_FARE,
      transfers: hopTransfers(routes.subway, campus),
    });
  }
  if (routes.bus) {
    drafts.push({
      key: "bus",
      mode: "bus",
      label: routes.bus.label,
      steps: hopSteps("bus", routes.bus, campus, false),
      cost: routes.bus.fare ?? SUBWAY_FARE,
      transfers: hopTransfers(routes.bus, campus),
      note: routes.bus.fare ? "Express bus fare. Transfers to the subway are free within 2 hours." : undefined,
    });
  }
  if (routes.walk !== undefined) {
    drafts.push({
      key: "walk",
      mode: "walk",
      label: "Walk",
      steps: [step("walk", `Walk to ${CAMPUS_LABEL[campus]}`, routes.walk)],
      cost: 0,
      transfers: 0,
    });
  }
  return drafts;
}

/** Fastest local route to a campus, expressed as steps (used to build Ram Van combos). */
function bestLocal(profile: OriginProfile, campus: Campus, pickup: boolean): Draft | null {
  const routes = campus === "rose-hill" ? profile.rh : profile.lc;
  if (!routes) return null;
  const candidates: Draft[] = [];
  if (routes.subway) {
    candidates.push({ key: "x", mode: "subway", label: "", steps: hopSteps("subway", routes.subway, campus, pickup), cost: routes.subway.fare ?? SUBWAY_FARE, transfers: hopTransfers(routes.subway, campus) });
  }
  if (routes.bus) {
    candidates.push({ key: "x", mode: "bus", label: "", steps: hopSteps("bus", routes.bus, campus, pickup), cost: routes.bus.fare ?? SUBWAY_FARE, transfers: hopTransfers(routes.bus, campus) });
  }
  if (routes.walk !== undefined) {
    const label = pickup ? "Walk to the Ram Van pickup at 60th St and Columbus Ave" : `Walk to ${CAMPUS_LABEL[campus]}`;
    candidates.push({ key: "x", mode: "walk", label: "", steps: [step("walk", label, routes.walk)], cost: 0, transfers: 0 });
  }
  return candidates.sort((a, b) => sum(a.steps) - sum(b.steps))[0] ?? null;
}

/* ------------------------------------------------------------ Commuter rail */

const accessStep = (station: string, minutes: number): TransitStep =>
  step("walk", `Walk, bike, or get a ride to ${station} (about ${minutes} min)`, minutes);

interface RailLeg {
  steps: TransitStep[];
  cost: number;
  transfers: number;
  mode: TransitMode;
  label: string;
  /** Present when the rail trip ends at a Manhattan hub. */
  hubLeg?: HubLeg;
  note?: string;
}

function railToCampus(rail: RailRoute, campus: Campus): RailLeg | null {
  if (rail.kind === "metro-north") {
    if (rail.only && rail.only !== campus) return null;
    const label = `Metro-North ${rail.line} Line`;
    if (campus === "rose-hill" && rail.toFordham) {
      return {
        mode: "metro-north",
        label,
        cost: rail.toFordham.fare,
        transfers: 0,
        steps: [
          accessStep(`${rail.station} station`, rail.access),
          step("metro-north", `Take the ${rail.line} Line from ${rail.station} to Fordham`, rail.toFordham.minutes),
          step("walk", "Walk from Fordham station to the Rose Hill gate", 7),
        ],
        note: "Metro-North fares shown are peak one way. Off-peak is cheaper.",
      };
    }
    const hubLeg = HUB_LEGS["grand-central"][campus];
    return {
      mode: "metro-north",
      label,
      cost: rail.toGct.fare + hubLeg.fare,
      transfers: hubLeg.transfers,
      steps: [
        accessStep(`${rail.station} station`, rail.access),
        step("metro-north", `Take the ${rail.line} Line from ${rail.station} to Grand Central`, rail.toGct.minutes),
        ...hubLeg.steps,
      ],
      hubLeg,
      note: "Metro-North fares shown are peak one way, plus the subway fare.",
    };
  }
  if (rail.kind === "lirr") {
    const toRh = campus === "rose-hill";
    const hubLeg = HUB_LEGS[toRh ? "grand-central" : "penn"][campus];
    return {
      mode: "lirr",
      label: "LIRR",
      cost: rail.fare + hubLeg.fare,
      transfers: hubLeg.transfers,
      steps: [
        accessStep(`${rail.station} station`, rail.access),
        step("lirr", `Take the LIRR ${rail.branch} from ${rail.station} to ${toRh ? "Grand Central Madison" : "Penn Station"}`, rail.minutes + (toRh ? 3 : 0)),
        ...hubLeg.steps,
      ],
      hubLeg,
      note: "LIRR fares shown are peak one way, plus the subway fare.",
    };
  }
  const hubLeg = HUB_LEGS[rail.hub][campus];
  return {
    mode: rail.mode,
    label: rail.label,
    cost: rail.fare + hubLeg.fare,
    transfers: rail.transfers + hubLeg.transfers,
    steps: [
      accessStep(rail.station, rail.access),
      step(rail.mode, `Take the ${rail.label} from ${rail.station}`, rail.minutes),
      ...hubLeg.steps,
    ],
    hubLeg,
    note: rail.note,
  };
}

/* ----------------------------------------------------------------- Ram Van */

function vanRideMinutes(arriveBy: string): number {
  const hour = Math.floor(toMinutes(arriveBy) / 60);
  return PEAK_WINDOWS.some(([start, end]) => hour >= start && hour < end) ? 44 : 36;
}

function vanSegment(from: Campus, to: Campus, request: PlanRequest): TransitStep[] {
  return [
    step("ram-van", `Check in at the ${CAMPUS_LABEL[from]} pickup and wait for the next van (about every 30 min)`, VAN_WAIT_MIN),
    step("ram-van", `Ride the Ram Van to ${CAMPUS_LABEL[to]}`, vanRideMinutes(request.arriveBy)),
  ];
}

const vanFare = (request: PlanRequest): number => (request.lincolnCenterPass ? 0 : RAM_VAN_FARE);
const vanFeasible = (request: PlanRequest): boolean =>
  toMinutes(request.arriveBy) - vanRideMinutes(request.arriveBy) >= FIRST_VAN_MIN;

function vanNote(request: PlanRequest, extra?: string): string {
  const pass = request.lincolnCenterPass ? "Covered by your Lincoln Center pass." : `${"$"}${RAM_VAN_FARE.toFixed(2)} one way.`;
  return [extra, pass, "Reserve up to 48 hours ahead."].filter(Boolean).join(" ");
}

const PICKUP_STEP_TEXT = "Walk to the Ram Van pickup at 60th St and Columbus Ave";

function vanDrafts(profile: OriginProfile, request: PlanRequest): Draft[] {
  if (!vanFeasible(request)) return [];
  const dest = request.campus;
  const other: Campus = dest === "rose-hill" ? "lincoln-center" : "rose-hill";
  const fare = vanFare(request);

  if (profile.campus === other) {
    return [
      {
        key: "ram-van",
        mode: "ram-van",
        label: "Ram Van",
        steps: [step("walk", "Walk to the Ram Van pickup", 4), ...vanSegment(other, dest, request)],
        cost: fare,
        transfers: 0,
        note: vanNote(request, "Direct between campuses."),
      },
    ];
  }
  if (profile.campus === dest) return [];

  if (dest === "rose-hill" && profile.region === "Manhattan") {
    const pre = bestLocal(profile, "lincoln-center", true);
    if (!pre) return [];
    return [
      {
        key: "ram-van-lc",
        mode: "ram-van",
        label: "Ram Van from Lincoln Center",
        steps: [...pre.steps, ...vanSegment("lincoln-center", "rose-hill", request)],
        cost: pre.cost + fare,
        transfers: pre.transfers + 1,
        note: vanNote(request),
      },
    ];
  }
  if (dest === "rose-hill" && profile.rail) {
    const rail = profile.rail;
    if (rail.kind === "metro-north" && rail.toFordham) return [];
    const toLc = railToCampus(rail, "lincoln-center");
    if (!toLc?.hubLeg) return [];
    const lastIndex = toLc.steps.length - 1;
    const steps = toLc.steps.map((s, i) => (i === lastIndex ? step("walk", PICKUP_STEP_TEXT, s.durationMinutes) : s));
    return [
      {
        key: "ram-van-rail",
        mode: "ram-van",
        label: `${MODE_LABEL[toLc.mode]} + Ram Van`,
        steps: [...steps, ...vanSegment("lincoln-center", "rose-hill", request)],
        cost: toLc.cost + fare,
        transfers: toLc.transfers + 1,
        note: vanNote(request, "Ride into Manhattan, then take the van north."),
      },
    ];
  }
  if (dest === "lincoln-center" && profile.region === "Bronx") {
    const pre = bestLocal(profile, "rose-hill", false);
    if (!pre) return [];
    return [
      {
        key: "ram-van-rh",
        mode: "ram-van",
        label: "Ram Van from Rose Hill",
        steps: [...pre.steps, step("walk", "Walk to the Ram Van pickup at the Rose Hill garage", 3), ...vanSegment("rose-hill", "lincoln-center", request)],
        cost: pre.cost + fare,
        transfers: pre.transfers + 1,
        note: vanNote(request),
      },
    ];
  }
  if (dest === "lincoln-center" && profile.rail?.kind === "metro-north" && profile.rail.toFordham && !profile.rail.only) {
    const rail = profile.rail;
    const toFordham = rail.toFordham;
    if (!toFordham) return [];
    return [
      {
        key: "ram-van-mnr",
        mode: "ram-van",
        label: "Metro-North + Ram Van",
        steps: [
          accessStep(`${rail.station} station`, rail.access),
          step("metro-north", `Take the ${rail.line} Line from ${rail.station} to Fordham`, toFordham.minutes),
          step("walk", "Walk to the Ram Van pickup at the Rose Hill garage", 9),
          ...vanSegment("rose-hill", "lincoln-center", request),
        ],
        cost: toFordham.fare + fare,
        transfers: 1,
        note: vanNote(request, "Get off at Fordham and ride the van straight to Lincoln Center."),
      },
    ];
  }
  return [];
}

/* ------------------------------------------------------------ Public API */

export function tagOptions(options: TransitOption[]): TransitOption[] {
  const pick = (cmp: (a: TransitOption, b: TransitOption) => number): string | undefined =>
    [...options].sort(cmp)[0]?.id;
  const fastest = pick((a, b) => a.durationMinutes - b.durationMinutes || a.cost - b.cost);
  const cheapest = pick((a, b) => a.cost - b.cost || a.durationMinutes - b.durationMinutes);
  const fewest = pick((a, b) => a.transfers - b.transfers || a.durationMinutes - b.durationMinutes);
  return options.map((option) => {
    const tags: TransitTag[] = [];
    if (option.id === fastest) tags.push("fastest");
    if (option.id === cheapest) tags.push("cheapest");
    if (option.id === fewest) tags.push("fewest-transfers");
    return { ...option, tags };
  });
}

function genericDrafts(): Draft[] {
  return [
    {
      key: "subway",
      mode: "subway",
      label: "Subway",
      steps: [step("walk", "Walk to the nearest station", 8), step("subway", "Take the subway toward campus", 45), step("walk", "Walk to campus", 7)],
      cost: SUBWAY_FARE,
      transfers: 1,
      note: "Rough estimate based on typical subway and bus connections.",
    },
    {
      key: "bus",
      mode: "bus",
      label: "Bus",
      steps: [step("walk", "Walk to the nearest stop", 6), step("bus", "Ride local buses toward campus", 65), step("walk", "Walk to campus", 6)],
      cost: SUBWAY_FARE,
      transfers: 1,
      note: "Rough estimate based on typical subway and bus connections.",
    },
  ];
}

export function planCommuteMock(request: PlanRequest): TransitOption[] {
  const { profile, exact } = resolveOrigin(request.origin);
  const campus = request.campus;
  const drafts: Draft[] = [...localDrafts(profile, campus)];

  if (profile.rail) {
    const leg = railToCampus(profile.rail, campus);
    if (leg) {
      drafts.push({
        key: `rail-${leg.mode}`,
        mode: leg.mode,
        label: leg.label,
        steps: leg.steps,
        cost: leg.cost,
        transfers: leg.transfers,
        note: leg.note,
      });
    }
  }
  drafts.push(...vanDrafts(profile, request));
  if (drafts.length < 2) {
    drafts.push(...genericDrafts().slice(0, 2 - drafts.length));
  }

  const estimate = exact
    ? undefined
    : `Estimated from ${profile.name} because we could not match "${request.origin.trim() || "your origin"}" to a known place.`;
  const seen = new Set<string>();
  const options = drafts
    .map((draft) => ({ ...draft, note: [estimate, draft.note].filter(Boolean).join(" ") || undefined }))
    .filter((draft) => (seen.has(draft.key) ? false : (seen.add(draft.key), true)))
    .map((draft) => finalize(draft, request))
    .sort((a, b) => a.durationMinutes - b.durationMinutes);
  return tagOptions(options);
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function planCommute(
  request: PlanRequest,
  google?: typeof globalThis.google,
): Promise<TransitOption[]> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (google && key) {
    try {
      const live = await fetchGoogleOptions(request, googleOriginQuery(request.origin), google, GOOGLE_TIMEOUT_MS);
      if (live.length > 0) {
        const vans = planCommuteMock(request).filter((option) => option.mode === "ram-van");
        return tagOptions([...live, ...vans.map((van) => ({ ...van, id: `mock-${van.id}` }))]);
      }
    } catch {
      // Any Google failure (quota, key, network, timeout) falls back to the offline estimate below.
    }
  }
  await delay(MOCK_DELAY_MS);
  return planCommuteMock(request);
}
