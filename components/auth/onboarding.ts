import { RESIDENCE_HOME } from "@/lib/constants";
import type { Campus, Region, Student, StudentRole, TransitMode } from "@/lib/types";

/** Everything onboarding collects before the profile is saved. */
export interface OnboardingDraft {
  email: string;
  password: string;
  name: string;
  role: StudentRole;
  /** Campus for classes. */
  campus: Campus;
  residenceCampus: Campus;
  homeRegion: Region;
  homeArea: string;
  arrivalTime: string;
  commuteMode: TransitMode;
  courses: string[];
  shareProfile: boolean;
}

export const EMPTY_DRAFT: OnboardingDraft = {
  email: "",
  password: "",
  name: "",
  role: "commuter",
  campus: "rose-hill",
  residenceCampus: "rose-hill",
  homeRegion: "Bronx",
  homeArea: "",
  arrivalTime: "09:30",
  commuteMode: "subway",
  courses: [],
  shareProfile: false,
};

export const needsHomeFields = (role: StudentRole): boolean => role !== "resident";
export const needsResidence = (role: StudentRole): boolean => role !== "commuter";

/** Problem with the trip details step, or null when it can continue. */
export function validateTrips(draft: OnboardingDraft): string | null {
  if (needsHomeFields(draft.role) && draft.homeArea.trim().length < 2) {
    return "Add your town or neighborhood, for example Hicksville or Astoria.";
  }
  if (!/^\d{2}:\d{2}$/.test(draft.arrivalTime)) return "Pick the time you usually need to be on campus.";
  return null;
}

/** Builds the saved profile. Residents get their residence campus as home so matching and groups work. */
export function studentFromDraft(draft: OnboardingDraft, id: string, email: string, fallbackName: string): Student {
  const resident = draft.role === "resident";
  const home = RESIDENCE_HOME[draft.residenceCampus];
  const base: Student = {
    id,
    name: draft.name.trim() || fallbackName,
    email,
    role: draft.role,
    campus: draft.campus,
    homeRegion: resident ? home.region : draft.homeRegion,
    homeArea: resident ? home.area : draft.homeArea.trim(),
    arrivalTime: draft.arrivalTime,
    commuteMode: resident ? "ram-van" : draft.commuteMode,
    courses: draft.courses,
    shareProfile: draft.shareProfile,
  };
  return needsResidence(draft.role) ? { ...base, residenceCampus: draft.residenceCampus } : base;
}
