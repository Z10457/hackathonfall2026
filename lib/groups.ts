import { formatTime, fromMinutes, toMinutes } from "./constants";
import type { Campus, ChatMessage, Day, Group, Region, Student, TransitMode } from "./types";
import { displayNameFor } from "./matching";

/* ------------------------------------------------------------ Filtering */

export type TimeBucket = "early" | "morning" | "midday" | "late";

export const TIME_BUCKETS: Array<{ id: TimeBucket; label: string }> = [
  { id: "early", label: "Early, before 8" },
  { id: "morning", label: "Morning, 8 to 10" },
  { id: "midday", label: "Midday, 10 to 2" },
  { id: "late", label: "After 2 PM" },
];

export function timeBucketOf(hhmm: string): TimeBucket {
  const m = toMinutes(hhmm);
  if (m < 8 * 60) return "early";
  if (m < 10 * 60) return "morning";
  if (m < 14 * 60) return "midday";
  return "late";
}

export interface GroupFilterState {
  region: Region | "All";
  mode: TransitMode | "All";
  campus: Campus | "All";
  time: TimeBucket | "All";
  days: Day[];
}

export const EMPTY_FILTERS: GroupFilterState = {
  region: "All",
  mode: "All",
  campus: "All",
  time: "All",
  days: [],
};

export function activeFilterCount(f: GroupFilterState): number {
  return (
    (f.region !== "All" ? 1 : 0) +
    (f.mode !== "All" ? 1 : 0) +
    (f.campus !== "All" ? 1 : 0) +
    (f.time !== "All" ? 1 : 0) +
    (f.days.length > 0 ? 1 : 0)
  );
}

export function matchesFilters(group: Group, f: GroupFilterState): boolean {
  if (f.region !== "All" && group.region !== f.region) return false;
  if (f.mode !== "All" && group.mode !== f.mode) return false;
  if (f.campus !== "All" && group.campus !== f.campus) return false;
  if (f.time !== "All" && timeBucketOf(group.departureTime) !== f.time) return false;
  if (f.days.length > 0 && !f.days.every((d) => group.days.includes(d))) return false;
  return true;
}

/** Member count shown on a card: the student counts once when joined. */
export function displayMemberCount(group: Group, joined: boolean): number {
  const base = group.isCustom ? Math.max(0, group.memberCount - 1) : group.memberCount;
  return base + (joined ? 1 : 0);
}

/* ----------------------------------------------------------------- Chat */

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FALLBACK_NAMES = ["Maya", "Daniel", "Priya", "Marcus", "Sofia", "Kevin", "Aaliyah", "Tomas"];

const MODE_CHATTER: Record<TransitMode, string> = {
  "ram-van": "The Ram Van was right on time",
  subway: "The train is packed again",
  bus: "The bus is running a few minutes behind",
  "metro-north": "Metro-North is showing 10 min delays today",
  lirr: "LIRR is showing a small delay out of Penn",
  "nj-transit": "NJ Transit just posted a 10 min delay",
  walk: "Perfect weather for the walk",
  carpool: "Traffic on the parkway looks light",
  bike: "Bike lane is clear this morning",
};

function firstNameOf(student: Student): string {
  // Respect privacy: only opted-in students are named, others stay as initials.
  const shown = displayNameFor(student);
  return student.shareProfile ? (shown.split(" ")[0] ?? shown) : shown;
}

interface Author {
  id: string;
  name: string;
}

function pickAuthors(group: Group, students: Student[]): Author[] {
  const seed = hashString(group.id);
  const pool = students.length >= 3 ? students : [];
  return Array.from({ length: 3 }, (_, i) => {
    if (pool.length > 0) {
      const s = pool[(seed + i * 7) % pool.length];
      return { id: `seed-${s.id}`, name: firstNameOf(s) };
    }
    return { id: `seed-name-${i}`, name: FALLBACK_NAMES[(seed + i * 3) % FALLBACK_NAMES.length] };
  });
}

/** Deterministic 3 to 5 message thread for a group. */
export function seedMessages(group: Group, students: Student[]): ChatMessage[] {
  const seed = hashString(group.id);
  const authors = pickAuthors(group, students);
  const dep = toMinutes(group.departureTime);
  const lead = formatTime(group.departureTime);
  const early = formatTime(fromMinutes(dep - 12));

  const pool: string[][] = [
    [`Running for the ${early}, save me a seat`, `Same, see you at ${group.origin}`],
    [MODE_CHATTER[group.mode], "Thanks for the heads up"],
    [`Anyone leaving from ${group.origin} tomorrow for the ${lead}?`, "I will be there"],
    ["Meet by the entrance like usual?", "Yes, I will wait by the stairs"],
  ];
  const count = 3 + (seed % 3);
  const lines: Array<{ author: Author; text: string }> = [];
  const flat = pool.flatMap((pair) => pair);
  const start = seed % flat.length;
  for (let i = 0; i < count; i += 1) {
    lines.push({ author: authors[i % authors.length], text: flat[(start + i) % flat.length] });
  }

  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return lines.map((line, i) => {
    const minutes = Math.max(0, dep - 90 + i * 17);
    const sentAt = new Date(base.getTime() + minutes * 60_000).toISOString();
    return {
      id: `${group.id}-seed-${i}`,
      groupId: group.id,
      authorId: line.author.id,
      authorName: line.author.name,
      text: line.text,
      sentAt,
    };
  });
}

const REPLIES = [
  "Sounds good, see you there!",
  "Nice, I will save you a spot.",
  "Thanks for the update!",
  "Got it. Safe travels everyone.",
  "Love it, see you at the stop.",
];

export function cannedReply(group: Group, students: Student[], count: number): ChatMessage {
  const authors = pickAuthors(group, students);
  const author = authors[count % authors.length];
  return {
    id: `${group.id}-reply-${Date.now().toString(36)}-${count}`,
    groupId: group.id,
    authorId: author.id,
    authorName: author.name,
    text: REPLIES[(hashString(group.id) + count) % REPLIES.length],
    sentAt: new Date().toISOString(),
  };
}

export function messageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
}
