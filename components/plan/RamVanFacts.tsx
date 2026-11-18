import Link from "next/link";
import { CalendarClock, Clock, Ticket, Wallet } from "lucide-react";
import { RAM_VAN_FARE } from "@/lib/constants";

const FACTS = [
  { icon: Wallet, text: `$${RAM_VAN_FARE.toFixed(2)} one way` },
  { icon: Ticket, text: "Lincoln Center students ride on a pass" },
  { icon: CalendarClock, text: "Reserve up to 48 hours ahead" },
  { icon: Clock, text: "About every half hour from 6:15 AM" },
] as const;

export function RamVanFacts() {
  return (
    <div className="rounded-xl border border-maroon-200 bg-maroon-50/60 p-3.5">
      <p className="eyebrow">Ram Van facts</p>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {FACTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2 text-sm text-ink-700">
            <Icon size={15} className="shrink-0 text-maroon-700" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
      <Link href="/" className="btn-primary mt-3 w-full sm:w-auto">
        Reserve a seat
      </Link>
    </div>
  );
}
