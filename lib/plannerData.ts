import type { Campus, Region, TransitMode, TransitStep } from "./types";

/** Manhattan transfer points a commuter rail or bus trip can arrive at. */
export type Hub = "grand-central" | "penn" | "port-authority" | "path-33" | "gwb";

/** One local NYC hop (subway or bus) from a neighborhood to a campus. */
export interface Hop {
  /** Station or stop where the trip starts. */
  from: string;
  /** Short name for the card title, e.g. "B train". */
  label: string;
  /** Full instruction phrase, e.g. "B to Fordham Rd". */
  line: string;
  /** Minutes on board, including any train to train change. */
  ride: number;
  /** Transfers inside the ride itself (not counting the final bus to Rose Hill). */
  transfers: number;
  /** Minutes of walking after the ride when heading to Lincoln Center. Default 5. */
  walkOut?: number;
  /** Bus hops that stop at the campus, so no final connection is needed. */
  direct?: boolean;
  /** Fare override in dollars. Default is the subway and local bus fare. */
  fare?: number;
}

export interface LocalRoutes {
  subway?: Hop;
  bus?: Hop;
  /** Door to door walking minutes when the campus is close enough to walk. */
  walk?: number;
}

export interface MetroNorthRoute {
  kind: "metro-north";
  line: "Harlem" | "Hudson" | "New Haven";
  station: string;
  /** Minutes from home to the station. */
  access: number;
  /** Direct to Fordham station (Harlem and New Haven lines). */
  toFordham?: { minutes: number; fare: number };
  toGct: { minutes: number; fare: number };
  /** When set, the route only makes sense for this destination. */
  only?: Campus;
}

export interface LirrRoute {
  kind: "lirr";
  branch: string;
  station: string;
  access: number;
  /** Minutes to Penn Station. Grand Central Madison runs about 3 minutes longer. */
  minutes: number;
  fare: number;
}

/** PATH, NJ Transit, Amtrak and coach buses that end at a Manhattan hub. */
export interface HubRoute {
  kind: "hub";
  mode: TransitMode;
  label: string;
  station: string;
  access: number;
  hub: Hub;
  minutes: number;
  fare: number;
  /** Extra changes before the hub, e.g. at Secaucus. */
  transfers: number;
  note?: string;
}

export type RailRoute = MetroNorthRoute | LirrRoute | HubRoute;

export interface OriginProfile {
  name: string;
  region: Region;
  aliases?: string[];
  /** Set for the two campus entries. */
  campus?: Campus;
  /** Routes when heading to Rose Hill. */
  rh?: LocalRoutes;
  /** Routes when heading to Lincoln Center. */
  lc?: LocalRoutes;
  rail?: RailRoute;
}

export interface HubLeg {
  steps: TransitStep[];
  fare: number;
  /** Boardings after arriving at the hub. */
  transfers: number;
}

const walk = (instruction: string, durationMinutes: number): TransitStep => ({
  mode: "walk",
  instruction,
  durationMinutes,
});
const subway = (instruction: string, durationMinutes: number): TransitStep => ({
  mode: "subway",
  instruction,
  durationMinutes,
});
const bus = (instruction: string, durationMinutes: number): TransitStep => ({
  mode: "bus",
  instruction,
  durationMinutes,
});

const FORDHAM_BUS = "Transfer to the Bx12 SBS east on Fordham Rd to the Rose Hill gate";
const LC_WALK = "Walk to Lincoln Center (60th St and Columbus Ave)";

/** Last miles from each Manhattan hub to each campus. */
export const HUB_LEGS: Record<Hub, Record<Campus, HubLeg>> = {
  "grand-central": {
    "rose-hill": {
      steps: [
        walk("Walk to the 4 train platform at Grand Central-42 St", 6),
        subway("Take the 4 to Fordham Rd", 27),
        bus(FORDHAM_BUS, 9),
      ],
      fare: 2.9,
      transfers: 2,
    },
    "lincoln-center": {
      steps: [
        walk("Follow signs to the 42 St Shuttle (S)", 5),
        subway("Take the S to Times Sq, then the 1 to 66 St-Lincoln Center", 12),
        walk(LC_WALK, 4),
      ],
      fare: 2.9,
      transfers: 2,
    },
  },
  penn: {
    "rose-hill": {
      steps: [
        walk("Walk to 34 St-Herald Sq for the B or D", 8),
        subway("Take the D to Fordham Rd", 31),
        bus(FORDHAM_BUS, 9),
      ],
      fare: 2.9,
      transfers: 2,
    },
    "lincoln-center": {
      steps: [
        walk("Walk to the A/C platform at 34 St-Penn Station", 5),
        subway("Take the A or C to 59 St-Columbus Circle", 8),
        walk(LC_WALK, 4),
      ],
      fare: 2.9,
      transfers: 1,
    },
  },
  "port-authority": {
    "rose-hill": {
      steps: [
        walk("Walk to the A/C platform at 42 St-Port Authority", 5),
        subway("Take the A to 145 St, then the D to Fordham Rd", 30),
        bus(FORDHAM_BUS, 9),
      ],
      fare: 2.9,
      transfers: 3,
    },
    "lincoln-center": {
      steps: [
        walk("Walk to the A/C platform at 42 St-Port Authority", 5),
        subway("Take the A or C to 59 St-Columbus Circle", 5),
        walk(LC_WALK, 4),
      ],
      fare: 2.9,
      transfers: 1,
    },
  },
  "path-33": {
    "rose-hill": {
      steps: [
        walk("Walk to the B or D at 34 St-Herald Sq", 5),
        subway("Take the D to Fordham Rd", 31),
        bus(FORDHAM_BUS, 9),
      ],
      fare: 2.9,
      transfers: 2,
    },
    "lincoln-center": {
      steps: [
        walk("Walk to the B or D at 34 St-Herald Sq", 5),
        subway("Take the B or D to 59 St-Columbus Circle", 8),
        walk(LC_WALK, 4),
      ],
      fare: 2.9,
      transfers: 1,
    },
  },
  gwb: {
    "rose-hill": {
      steps: [
        walk("Walk to 175 St station from the George Washington Bridge Bus Station", 5),
        subway("Take the A to 145 St, then the D to Fordham Rd", 22),
        bus(FORDHAM_BUS, 9),
      ],
      fare: 2.9,
      transfers: 3,
    },
    "lincoln-center": {
      steps: [
        walk("Walk to 175 St station from the George Washington Bridge Bus Station", 5),
        subway("Take the A to 59 St-Columbus Circle", 15),
        walk(LC_WALK, 4),
      ],
      fare: 2.9,
      transfers: 1,
    },
  },
};

/* ---------------------------------------------------------- Rail builders */

const mnr = (
  line: MetroNorthRoute["line"],
  station: string,
  access: number,
  toGct: [number, number],
  toFordham?: [number, number],
  only?: Campus,
): MetroNorthRoute => ({
  kind: "metro-north",
  line,
  station,
  access,
  toGct: { minutes: toGct[0], fare: toGct[1] },
  toFordham: toFordham ? { minutes: toFordham[0], fare: toFordham[1] } : undefined,
  only,
});

const lirr = (branch: string, station: string, minutes: number, fare: number, access = 10): LirrRoute => ({
  kind: "lirr",
  branch,
  station,
  access,
  minutes,
  fare,
});

const hubRoute = (
  mode: TransitMode,
  label: string,
  station: string,
  hub: Hub,
  minutes: number,
  fare: number,
  access = 10,
  transfers = 0,
  note?: string,
): HubRoute => ({ kind: "hub", mode, label, station, access, hub, minutes, fare, transfers, note });

/* --------------------------------------------------------- Origin profiles */

export const ORIGIN_PROFILES: OriginProfile[] = [
  /* Campuses */
  {
    name: "Rose Hill",
    region: "Bronx",
    campus: "rose-hill",
    aliases: ["Fordham University Rose Hill", "Rose Hill campus", "Fordham Rd"],
    rh: {
      walk: 8,
      bus: { from: "Fordham Plaza", label: "Bx12 SBS", line: "Bx12 SBS to Rose Hill", ride: 5, transfers: 0, direct: true },
    },
    lc: {
      subway: { from: "Fordham Rd (B/D)", label: "D train", line: "D to 59 St-Columbus Circle", ride: 29, transfers: 0, walkOut: 6 },
    },
    rail: mnr("Harlem", "Fordham", 8, [19, 6.5], undefined, "lincoln-center"),
  },
  {
    name: "Lincoln Center",
    region: "Manhattan",
    campus: "lincoln-center",
    aliases: ["Fordham Lincoln Center", "Lincoln Center campus", "60th and Columbus", "Columbus Circle"],
    lc: {
      walk: 6,
      bus: { from: "Columbus Ave", label: "M104", line: "M104 to Lincoln Center", ride: 4, transfers: 0, direct: true },
    },
    rh: {
      subway: { from: "59 St-Columbus Circle", label: "D train", line: "D to Fordham Rd", ride: 27, transfers: 0 },
    },
  },

  /* Manhattan */
  {
    name: "Midtown Manhattan",
    region: "Manhattan",
    aliases: ["Midtown", "Times Square", "Grand Central", "Penn Station"],
    rh: { subway: { from: "Bryant Park (B/D)", label: "B/D train", line: "B or D to Fordham Rd", ride: 33, transfers: 0 } },
    lc: {
      subway: { from: "Times Sq-42 St", label: "1 train", line: "1 to 66 St-Lincoln Center", ride: 9, transfers: 0, walkOut: 3 },
      bus: { from: "Broadway at 42nd St", label: "M104", line: "M104 up Broadway to Lincoln Center", ride: 19, transfers: 0, direct: true },
    },
  },
  {
    name: "Upper West Side",
    region: "Manhattan",
    aliases: ["UWS"],
    rh: { subway: { from: "86 St (B/C)", label: "B train", line: "B to Fordham Rd", ride: 27, transfers: 0 } },
    lc: {
      walk: 26,
      subway: { from: "86 St (1)", label: "1 train", line: "1 to 66 St-Lincoln Center", ride: 8, transfers: 0, walkOut: 2 },
    },
  },
  {
    name: "Harlem",
    region: "Manhattan",
    aliases: ["East Harlem", "Morningside Heights"],
    rh: { subway: { from: "125 St (A/B/C/D)", label: "D train", line: "D to Fordham Rd", ride: 14, transfers: 0 } },
    lc: { subway: { from: "125 St (A/B/C/D)", label: "B/C train", line: "B or C to 59 St-Columbus Circle", ride: 10, transfers: 0 } },
    rail: mnr("Harlem", "Harlem-125 St", 8, [10, 5.75], [11, 5.75], "rose-hill"),
  },
  {
    name: "Washington Heights",
    region: "Manhattan",
    aliases: ["Inwood"],
    rh: { subway: { from: "174-175 Sts (B/D)", label: "D train", line: "D to Fordham Rd", ride: 10, transfers: 0 } },
    lc: { subway: { from: "175 St (A)", label: "A train", line: "A to 59 St-Columbus Circle", ride: 16, transfers: 0 } },
  },
  {
    name: "Upper East Side",
    region: "Manhattan",
    aliases: ["UES"],
    rh: { subway: { from: "86 St (4/5/6)", label: "4 train", line: "4 to Fordham Rd", ride: 24, transfers: 0 } },
    lc: { bus: { from: "72nd St crosstown stop", label: "M72", line: "M72 crosstown to Lincoln Center", ride: 26, transfers: 0, direct: true } },
  },
  {
    name: "Lower Manhattan",
    region: "Manhattan",
    aliases: ["Financial District", "FiDi", "Battery Park", "Tribeca"],
    rh: { subway: { from: "Wall St (4/5)", label: "4 train", line: "4 to Fordham Rd", ride: 42, transfers: 0 } },
    lc: { subway: { from: "Fulton St (A/C)", label: "A/C train", line: "A or C to 59 St-Columbus Circle", ride: 17, transfers: 0 } },
  },
  {
    name: "Greenwich Village",
    region: "Manhattan",
    aliases: ["West Village", "East Village", "SoHo", "Chelsea"],
    rh: { subway: { from: "West 4 St (B/D)", label: "B/D train", line: "B or D to Fordham Rd", ride: 36, transfers: 0 } },
    lc: { subway: { from: "West 4 St (A/C)", label: "A/C train", line: "A or C to 59 St-Columbus Circle", ride: 13, transfers: 0 } },
  },
  {
    name: "Hell's Kitchen",
    region: "Manhattan",
    aliases: ["Hells Kitchen", "Clinton"],
    rh: { subway: { from: "50 St (C/E)", label: "C + D trains", line: "C to 145 St, then the D to Fordham Rd", ride: 30, transfers: 1 } },
    lc: {
      walk: 16,
      subway: { from: "50 St (C/E)", label: "C train", line: "C to 59 St-Columbus Circle", ride: 4, transfers: 0 },
    },
  },

  /* Bronx */
  {
    name: "Belmont / Arthur Ave",
    region: "Bronx",
    aliases: ["Belmont", "Arthur Avenue", "Little Italy Bronx"],
    rh: {
      walk: 11,
      bus: { from: "Fordham Rd stop", label: "Bx12 SBS", line: "Bx12 SBS to Rose Hill", ride: 4, transfers: 0, direct: true },
    },
    lc: { subway: { from: "Fordham Rd (B/D)", label: "D train", line: "D to 59 St-Columbus Circle", ride: 29, transfers: 0, walkOut: 6 } },
  },
  {
    name: "Bedford Park",
    region: "Bronx",
    aliases: ["Kingsbridge", "Norwood", "University Heights"],
    rh: {
      walk: 26,
      subway: { from: "Bedford Park Blvd (B/D)", label: "D train", line: "D to Fordham Rd", ride: 5, transfers: 0 },
      bus: { from: "Kingsbridge Rd stop", label: "Bx9", line: "Bx9 east on Kingsbridge Rd to Rose Hill", ride: 14, transfers: 0, direct: true },
    },
    lc: { subway: { from: "Bedford Park Blvd (B/D)", label: "D train", line: "D to 59 St-Columbus Circle", ride: 34, transfers: 0, walkOut: 6 } },
  },
  {
    name: "Riverdale",
    region: "Bronx",
    aliases: ["Spuyten Duyvil", "Marble Hill"],
    rh: { bus: { from: "Riverdale Ave stop", label: "Bx9", line: "Bx9 to Rose Hill via Kingsbridge Rd", ride: 34, transfers: 0, direct: true } },
    lc: { subway: { from: "231 St (1)", label: "1 train", line: "1 to 66 St-Lincoln Center", ride: 40, transfers: 0, walkOut: 3 } },
  },
  {
    name: "Concourse / Yankee Stadium",
    region: "Bronx",
    aliases: ["Concourse", "Yankee Stadium", "Highbridge", "Mott Haven"],
    rh: { subway: { from: "161 St-Yankee Stadium (B/D)", label: "D train", line: "D to Fordham Rd", ride: 10, transfers: 0 } },
    lc: { subway: { from: "161 St-Yankee Stadium (B/D)", label: "B/D train", line: "D to 59 St-Columbus Circle", ride: 24, transfers: 0, walkOut: 6 } },
  },
  {
    name: "Pelham Bay",
    region: "Bronx",
    aliases: ["Co-op City", "Throgs Neck", "Parkchester"],
    rh: { bus: { from: "Pelham Bay Park (6)", label: "Bx12 SBS", line: "Bx12 SBS along Fordham Rd to Rose Hill", ride: 42, transfers: 0, direct: true } },
    lc: { subway: { from: "Pelham Bay Park (6)", label: "6 + N/R trains", line: "6 to 59 St-Lexington Av, then the N or R to 57 St-7 Av", ride: 62, transfers: 1, walkOut: 9 } },
  },

  /* Brooklyn */
  {
    name: "Downtown Brooklyn",
    region: "Brooklyn",
    aliases: ["Brooklyn Heights", "Borough Hall", "Fort Greene", "Dumbo"],
    rh: { subway: { from: "Borough Hall (4/5)", label: "4 train", line: "4 to Fordham Rd", ride: 52, transfers: 0 } },
    lc: { subway: { from: "Jay St-MetroTech (A/C)", label: "A/C train", line: "A or C to 59 St-Columbus Circle", ride: 20, transfers: 0 } },
  },
  {
    name: "Williamsburg",
    region: "Brooklyn",
    aliases: ["Greenpoint", "Bushwick"],
    rh: { subway: { from: "Bedford Av (L)", label: "L + 4 trains", line: "L to 14 St-Union Sq, then the 4 to Fordham Rd", ride: 50, transfers: 1 } },
    lc: { subway: { from: "Bedford Av (L)", label: "L + A/C trains", line: "L to 8 Av, then the A or C to 59 St-Columbus Circle", ride: 34, transfers: 1 } },
  },
  {
    name: "Park Slope",
    region: "Brooklyn",
    aliases: ["Prospect Heights", "Brooklyn"],
    rh: { subway: { from: "7 Av (B/Q)", label: "Q + 4 trains", line: "Q to Atlantic Av-Barclays Ctr, then the 4 to Fordham Rd", ride: 58, transfers: 1 } },
    lc: { subway: { from: "7 Av (B/Q)", label: "B train", line: "B to 59 St-Columbus Circle", ride: 33, transfers: 0 } },
  },
  {
    name: "Bay Ridge",
    region: "Brooklyn",
    aliases: ["Sunset Park", "Bensonhurst"],
    rh: { subway: { from: "Bay Ridge Av (R)", label: "R + D trains", line: "R to 36 St, then the D to Fordham Rd", ride: 78, transfers: 1 } },
    lc: { subway: { from: "Bay Ridge Av (R)", label: "R + D trains", line: "R to 36 St, then the D to 59 St-Columbus Circle", ride: 50, transfers: 1 } },
  },
  {
    name: "Flatbush",
    region: "Brooklyn",
    aliases: ["Midwood", "Crown Heights", "Brooklyn College"],
    rh: { subway: { from: "Church Av (B/Q)", label: "B train", line: "B to Fordham Rd", ride: 72, transfers: 0 } },
    lc: { subway: { from: "Church Av (B/Q)", label: "B train", line: "B to 59 St-Columbus Circle", ride: 47, transfers: 0 } },
  },

  /* Queens */
  {
    name: "Astoria",
    region: "Queens",
    aliases: ["Ditmars"],
    rh: { subway: { from: "Astoria Blvd (N/W)", label: "N + 4 trains", line: "N to 59 St-Lexington Av, then the 4 to Fordham Rd", ride: 50, transfers: 1 } },
    lc: { subway: { from: "Astoria Blvd (N/W)", label: "N/W train", line: "N or W to 57 St-7 Av", ride: 22, transfers: 0, walkOut: 9 } },
  },
  {
    name: "Flushing",
    region: "Queens",
    aliases: ["Main Street Flushing"],
    rh: { subway: { from: "Flushing-Main St (7)", label: "7 + 4 trains", line: "7 to Grand Central-42 St, then the 4 to Fordham Rd", ride: 68, transfers: 1 } },
    lc: { subway: { from: "Flushing-Main St (7)", label: "7 + 1 trains", line: "7 to Times Sq-42 St, then the 1 to 66 St-Lincoln Center", ride: 56, transfers: 1, walkOut: 3 } },
  },
  {
    name: "Jamaica",
    region: "Queens",
    aliases: ["Jamaica Queens", "Jamaica Estates"],
    rh: { subway: { from: "Jamaica Center (E)", label: "E + D trains", line: "E to 7 Av, then the D to Fordham Rd", ride: 85, transfers: 1 } },
    lc: { subway: { from: "Jamaica Center (E)", label: "E + C trains", line: "E to 50 St, then the C to 59 St-Columbus Circle", ride: 52, transfers: 1 } },
    rail: lirr("Main Line", "Jamaica", 20, 9.5, 8),
  },
  {
    name: "Forest Hills",
    region: "Queens",
    aliases: ["Kew Gardens", "Rego Park"],
    rh: { subway: { from: "Forest Hills-71 Av (E/F)", label: "E + D trains", line: "E to 7 Av, then the D to Fordham Rd", ride: 60, transfers: 1 } },
    lc: { subway: { from: "Forest Hills-71 Av (E/F)", label: "E + C trains", line: "E to 50 St, then the C to 59 St-Columbus Circle", ride: 36, transfers: 1 } },
    rail: lirr("Port Washington Branch", "Forest Hills", 14, 9.5, 6),
  },
  {
    name: "Long Island City",
    region: "Queens",
    aliases: ["LIC", "Sunnyside"],
    rh: { subway: { from: "Court Sq (E/7)", label: "E + D trains", line: "E to 7 Av, then the D to Fordham Rd", ride: 50, transfers: 1 } },
    lc: { subway: { from: "Court Sq (E/7)", label: "E + C trains", line: "E to 50 St, then the C to 59 St-Columbus Circle", ride: 22, transfers: 1 } },
  },
  {
    name: "Bayside",
    region: "Queens",
    aliases: ["Douglaston", "Little Neck"],
    rail: lirr("Port Washington Branch", "Bayside", 27, 10.25, 10),
  },

  /* Staten Island */
  {
    name: "St. George",
    region: "Staten Island",
    aliases: ["Staten Island", "Stapleton", "Tompkinsville"],
    rh: { subway: { from: "St. George Ferry Terminal", label: "Ferry + 4 train", line: "Staten Island Ferry to Whitehall, then the 4 from Bowling Green to Fordham Rd", ride: 80, transfers: 1 } },
    lc: { subway: { from: "St. George Ferry Terminal", label: "Ferry + 1 train", line: "Staten Island Ferry to Whitehall, then the 1 from South Ferry to 66 St-Lincoln Center", ride: 64, transfers: 1, walkOut: 3 } },
  },
  {
    name: "Great Kills",
    region: "Staten Island",
    aliases: ["Tottenville", "New Dorp", "Eltingville"],
    rh: { subway: { from: "Great Kills (SIR)", label: "SIR + Ferry + 4", line: "SIR to St. George, the Ferry, then the 4 from Bowling Green to Fordham Rd", ride: 112, transfers: 2 } },
    lc: {
      subway: { from: "Great Kills (SIR)", label: "SIR + Ferry + 1", line: "SIR to St. George, the Ferry, then the 1 to 66 St-Lincoln Center", ride: 92, transfers: 2, walkOut: 3 },
      bus: { from: "Great Kills express stop", label: "SIM1C express", line: "SIM1C express to Midtown, then the 1 to 66 St-Lincoln Center", ride: 88, transfers: 1, walkOut: 3, fare: 7 },
    },
  },

  /* Long Island */
  { name: "Hicksville", region: "Long Island", rail: lirr("Port Jefferson Branch", "Hicksville", 38, 14.5) },
  { name: "Garden City", region: "Long Island", rail: lirr("Hempstead Branch", "Garden City", 30, 12.75) },
  { name: "Mineola", region: "Long Island", rail: lirr("Oyster Bay Branch", "Mineola", 26, 12) },
  { name: "Great Neck", region: "Long Island", rail: lirr("Port Washington Branch", "Great Neck", 28, 11.75) },
  { name: "Port Washington", region: "Long Island", aliases: ["Manhasset"], rail: lirr("Port Washington Branch", "Port Washington", 40, 13.5) },
  { name: "Huntington", region: "Long Island", aliases: ["Northport", "Smithtown"], rail: lirr("Port Jefferson Branch", "Huntington", 55, 18.75) },
  { name: "Babylon", region: "Long Island", aliases: ["Bay Shore", "Lindenhurst"], rail: lirr("Babylon Branch", "Babylon", 56, 18.5) },
  { name: "Freeport", region: "Long Island", aliases: ["Baldwin", "Merrick"], rail: lirr("Babylon Branch", "Freeport", 36, 14.5) },
  { name: "Hempstead", region: "Long Island", aliases: ["Westbury", "Uniondale"], rail: lirr("Hempstead Branch", "Hempstead", 40, 14) },
  { name: "Massapequa", region: "Long Island", aliases: ["Amityville", "Seaford"], rail: lirr("Babylon Branch", "Massapequa", 46, 16) },
  { name: "Ronkonkoma", region: "Long Island", aliases: ["Patchogue", "Stony Brook"], rail: lirr("Ronkonkoma Branch", "Ronkonkoma", 76, 21.25) },
  { name: "Long Beach", region: "Long Island", aliases: ["Rockville Centre", "Oceanside"], rail: lirr("Long Beach Branch", "Long Beach", 52, 15) },

  /* Westchester */
  { name: "White Plains", region: "Westchester", rail: mnr("Harlem", "White Plains", 10, [38, 13.25], [30, 9.75]) },
  { name: "Scarsdale", region: "Westchester", aliases: ["Hartsdale", "Hastings-on-Hudson"], rail: mnr("Harlem", "Scarsdale", 8, [33, 11.75], [26, 8.5]) },
  { name: "Bronxville", region: "Westchester", aliases: ["Tuckahoe", "Eastchester"], rail: mnr("Harlem", "Bronxville", 8, [26, 10.25], [18, 6.25]) },
  { name: "Mount Vernon", region: "Westchester", aliases: ["Pelham"], rail: mnr("Harlem", "Mount Vernon West", 8, [22, 8.75], [14, 5.75]) },
  { name: "New Rochelle", region: "Westchester", aliases: ["Larchmont", "Mamaroneck"], rail: mnr("New Haven", "New Rochelle", 8, [30, 11.25], [22, 7.75]) },
  { name: "Yonkers", region: "Westchester", aliases: ["Dobbs Ferry", "Ardsley"], rail: mnr("Hudson", "Yonkers", 10, [34, 10.75]) },
  { name: "Tarrytown", region: "Westchester", aliases: ["Sleepy Hollow", "Ossining", "Croton"], rail: mnr("Hudson", "Tarrytown", 10, [44, 14]) },

  /* Rockland */
  {
    name: "Nyack",
    region: "Rockland",
    aliases: ["Pearl River", "Tappan"],
    rail: hubRoute("bus", "Rockland Coaches to Port Authority", "Nyack", "port-authority", 58, 13.5, 12, 0, "Coach bus fares and times vary with traffic on the Tappan Zee Bridge and Lincoln Tunnel."),
  },
  {
    name: "Spring Valley",
    region: "Rockland",
    aliases: ["Suffern", "Monsey", "New City"],
    rail: hubRoute("bus", "Rockland Coaches to Port Authority", "Spring Valley", "port-authority", 55, 12.5, 12, 0, "Coach bus fares and times vary with traffic on the Lincoln Tunnel."),
  },

  /* Hudson Valley and upstate */
  { name: "Poughkeepsie", region: "Hudson Valley & Upstate", aliases: ["Hyde Park", "Beacon"], rail: mnr("Hudson", "Poughkeepsie", 12, [98, 26]) },
  { name: "Newburgh", region: "Hudson Valley & Upstate", aliases: ["New Windsor", "Cornwall"], rail: mnr("Hudson", "Beacon", 25, [82, 21.75]) },
  {
    name: "Albany",
    region: "Hudson Valley & Upstate",
    aliases: ["Rensselaer", "Troy", "Saratoga"],
    rail: hubRoute("metro-north", "Amtrak Empire Service", "Albany-Rensselaer", "penn", 145, 40, 15, 0, "Amtrak intercity train. Fares vary by day and are shown as a typical walk-up price."),
  },

  /* New Jersey */
  { name: "Hoboken", region: "New Jersey", rail: hubRoute("subway", "PATH train", "Hoboken Terminal", "path-33", 12, 3, 8) },
  { name: "Jersey City", region: "New Jersey", aliases: ["Journal Square", "Exchange Place", "Grove Street"], rail: hubRoute("subway", "PATH train", "Journal Square", "path-33", 18, 3, 8) },
  { name: "Newark", region: "New Jersey", aliases: ["East Orange", "Montclair", "Bloomfield"], rail: hubRoute("nj-transit", "NJ Transit Northeast Corridor", "Newark Penn Station", "penn", 24, 6.25, 12) },
  {
    name: "Fort Lee / Bergen County",
    region: "New Jersey",
    aliases: ["Fort Lee", "Bergen County", "Englewood", "Teaneck", "Edgewater", "Cliffside Park"],
    rail: hubRoute("nj-transit", "NJ Transit 182 bus", "Fort Lee", "gwb", 18, 3.75, 6),
  },
  { name: "Hackensack", region: "New Jersey", aliases: ["Paramus", "Ridgewood"], rail: hubRoute("nj-transit", "NJ Transit 165 bus", "Hackensack", "port-authority", 42, 5.75, 8) },
  { name: "Paterson", region: "New Jersey", aliases: ["Clifton", "Passaic"], rail: hubRoute("nj-transit", "NJ Transit Main Line", "Paterson", "penn", 58, 8.5, 10, 1) },

  /* Connecticut */
  { name: "Stamford", region: "Connecticut", rail: mnr("New Haven", "Stamford", 10, [50, 15.5], [45, 13]) },
  { name: "Greenwich", region: "Connecticut", aliases: ["Old Greenwich", "Cos Cob", "Riverside"], rail: mnr("New Haven", "Greenwich", 10, [42, 13.25], [38, 11.5]) },
  { name: "Norwalk", region: "Connecticut", aliases: ["Westport", "Darien"], rail: mnr("New Haven", "South Norwalk", 10, [63, 18.5], [55, 15.75]) },
  { name: "Bridgeport", region: "Connecticut", aliases: ["Fairfield", "Stratford"], rail: mnr("New Haven", "Bridgeport", 10, [78, 21.25], [70, 19.25]) },
  { name: "New Haven", region: "Connecticut", aliases: ["Yale", "Hamden"], rail: mnr("New Haven", "New Haven Union Station", 12, [95, 25], [85, 22.5]) },
];

/** Representative profile used when only the region is recognised. */
export const REGION_FALLBACK: Record<Region, string> = {
  Manhattan: "Midtown Manhattan",
  Bronx: "Bedford Park",
  Brooklyn: "Downtown Brooklyn",
  Queens: "Jamaica",
  "Staten Island": "St. George",
  "Long Island": "Hicksville",
  Westchester: "White Plains",
  Rockland: "Nyack",
  "Hudson Valley & Upstate": "Poughkeepsie",
  "New Jersey": "Newark",
  Connecticut: "Stamford",
};

/** US state suffix appended to origin text sent to Google. */
export const REGION_STATE: Record<Region, string> = {
  Manhattan: "New York, NY",
  Bronx: "Bronx, NY",
  Brooklyn: "Brooklyn, NY",
  Queens: "Queens, NY",
  "Staten Island": "Staten Island, NY",
  "Long Island": "NY",
  Westchester: "NY",
  Rockland: "NY",
  "Hudson Valley & Upstate": "NY",
  "New Jersey": "NJ",
  Connecticut: "CT",
};
