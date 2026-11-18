/**
 * Ram Hub shared contract. Every feature module imports its domain types from here.
 * Do not redefine these shapes locally. If a field is missing, add it here (optional)
 * rather than creating a parallel type.
 */

export type Campus = "rose-hill" | "lincoln-center";

/** Direction a van is heading. Maroon outline = to Rose Hill, blue outline = to Lincoln Center. */
export type Direction = "to-rose-hill" | "to-lincoln-center";

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type Region =
  | "Manhattan"
  | "Bronx"
  | "Brooklyn"
  | "Queens"
  | "Staten Island"
  | "Long Island"
  | "Westchester"
  | "Rockland"
  | "Hudson Valley & Upstate"
  | "New Jersey"
  | "Connecticut";

export type TransitMode =
  | "ram-van"
  | "subway"
  | "bus"
  | "metro-north"
  | "lirr"
  | "nj-transit"
  | "walk"
  | "carpool"
  | "bike";

export interface LatLng {
  lat: number;
  lng: number;
}

/* ------------------------------------------------------------------ Vans */

export type VanStatus = "boarding" | "on-time" | "delayed" | "arriving" | "layover";

export type TrafficLevel = "light" | "moderate" | "heavy";

export const VAN_CAPACITY = 14;

export interface Van {
  /** Stable id, e.g. "van-3". */
  id: string;
  /** The number painted on the van (1 to 6). Shown as the badge on every van icon. */
  number: number;
  direction: Direction;
  position: LatLng;
  /** 0 to 1 along the route in the current direction of travel. */
  progress: number;
  /** Compass heading in degrees, 0 = north. */
  heading: number;
  status: VanStatus;
  speedMph: number;
  /** Minutes until it reaches the destination campus of its current trip. */
  etaMinutes: number;
  /** Human readable next landmark or stop. */
  nextStop: string;
  delayMinutes: number;
  capacity: number;
  /** Seat numbers (1 to capacity) already taken, including the signed-in student's. */
  takenSeats: number[];
  /** Number of students on the waitlist for this trip. */
  waitlistCount: number;
  /** ISO timestamp of the scheduled departure of the current trip. */
  departureTime: string;
  /** True for vans 5 and 6, which only run 8 to 10 AM and 4 to 6 PM. */
  peakOnly: boolean;
}

export type ReservationStatus = "confirmed" | "waitlisted" | "cancelled" | "boarded" | "forfeited";

export interface Reservation {
  id: string;
  vanId: string;
  vanNumber: number;
  direction: Direction;
  /** Seat number 1 to 14. Null while waitlisted. */
  seat: number | null;
  studentId: string;
  studentName: string;
  /** ISO timestamp of scheduled departure. */
  departureTime: string;
  createdAt: string;
  status: ReservationStatus;
  /** String encoded in the boarding QR code. */
  qrPayload: string;
  /** Fare in dollars. $3.50 one way; 0 for Lincoln Center pass holders. */
  price: number;
  /** 1-based position when status is "waitlisted". */
  waitlistPosition?: number;
}

/* -------------------------------------------------------------- Students */

export interface Student {
  id: string;
  name: string;
  email?: string;
  campus: Campus;
  homeRegion: Region;
  /** Town or neighborhood, e.g. "Hicksville" or "Astoria". */
  homeArea: string;
  /** Usual arrival time on campus, 24h "HH:MM". */
  arrivalTime: string;
  /** Course codes, upper case, e.g. "CISC 2000". */
  courses: string[];
  /**
   * Privacy opt-in. When false the student appears to classmates as initials only
   * (e.g. "J.M.") and their home area is hidden.
   */
  shareProfile: boolean;
  commuteMode?: TransitMode;
  commuteDays?: Day[];
  year?: "First-year" | "Sophomore" | "Junior" | "Senior" | "Graduate";
  major?: string;
}

/* ---------------------------------------------------------------- Groups */

export interface Group {
  id: string;
  name: string;
  region: Region;
  /** Starting town or neighborhood, e.g. "Hoboken". */
  origin: string;
  /** Short route description, e.g. "LIRR to Penn, then D train to Fordham Rd". */
  route: string;
  mode: TransitMode;
  campus: Campus;
  /** 24h "HH:MM" departure from the origin. */
  departureTime: string;
  days: Day[];
  memberCount: number;
  description: string;
  /** True for groups created by the signed-in student (stored in localStorage). */
  isCustom?: boolean;
  createdBy?: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  text: string;
  /** ISO timestamp. */
  sentAt: string;
}

export interface ClassmateMatch {
  student: Student;
  /** 0 to 100. */
  score: number;
  sharedCourses: string[];
  /** Short human readable reasons, e.g. "Same region", "Arrives within 30 min". */
  reasons: string[];
  /** Name to render: full name if the classmate opted in, otherwise initials. */
  displayName: string;
}

/* ---------------------------------------------------------------- Alerts */

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  /** What the alert is about. */
  affects: TransitMode | "all";
  /** Optional link label shown at the end of the banner. */
  source?: string;
}

/* --------------------------------------------------------------- Planner */

export interface TransitStep {
  mode: TransitMode;
  instruction: string;
  durationMinutes: number;
}

export type TransitTag = "fastest" | "cheapest" | "fewest-transfers";

export interface TransitOption {
  id: string;
  mode: TransitMode;
  /** e.g. "Ram Van", "D train", "Metro-North Harlem Line". */
  label: string;
  summary: string;
  durationMinutes: number;
  /** One-way cost in dollars. */
  cost: number;
  transfers: number;
  /** 24h "HH:MM" latest time to leave the origin to arrive on time. */
  leaveBy: string;
  /** 24h "HH:MM". */
  arriveBy: string;
  steps: TransitStep[];
  tags: TransitTag[];
  source: "google" | "mock";
  note?: string;
}
