import { CalendarClock, GraduationCap, MapPinned, UserRound, UsersRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Live", hint: "Track vans and reserve", icon: MapPinned },
  { href: "/plan", label: "Plan", hint: "Compare ways to campus", icon: CalendarClock },
  { href: "/groups", label: "Groups", hint: "Commute together", icon: UsersRound },
  { href: "/classmates", label: "Classmates", hint: "Same classes, same route", icon: GraduationCap },
  { href: "/profile", label: "Profile", hint: "Your commute settings", icon: UserRound },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
