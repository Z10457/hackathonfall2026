import { RAM_VAN_FARE } from "@/lib/constants";
import type { Student, Van, VanStatus } from "@/lib/types";

export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function etaLabel(minutes: number): string {
  if (minutes <= 0) return "Now";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function fareFor(student: Student): number {
  return student.campus === "lincoln-center" ? 0 : RAM_VAN_FARE;
}

export function fareLabel(price: number): string {
  return price === 0 ? "Pass" : `$${price.toFixed(2)}`;
}

export function openSeats(van: Van): number {
  return Math.max(0, van.capacity - van.takenSeats.length);
}

export interface StatusStyle {
  label: string;
  className: string;
}

export function statusStyle(van: Pick<Van, "status" | "delayMinutes">): StatusStyle {
  const map: Record<VanStatus, StatusStyle> = {
    "on-time": { label: "On time", className: "chip-green" },
    delayed: { label: `Delayed +${van.delayMinutes} min`, className: "chip-amber" },
    boarding: { label: "Boarding", className: "chip-gold" },
    arriving: { label: "Arriving", className: "chip-blue" },
    layover: { label: "Layover", className: "chip" },
  };
  return map[van.status];
}
