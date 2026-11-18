import { Clock, MapPin, MessageCircle, Route, Users } from "lucide-react";
import { CAMPUS_LABEL, DAYS, MODE_LABEL, formatTime } from "@/lib/constants";
import { displayMemberCount } from "@/lib/groups";
import type { Group } from "@/lib/types";
import { ModeIcon } from "./ModeIcon";

interface GroupCardProps {
  group: Group;
  joined: boolean;
  onToggleJoin: (group: Group) => void;
  onOpenChat: (group: Group) => void;
}

export function GroupCard({ group, joined, onToggleJoin, onOpenChat }: GroupCardProps) {
  const count = displayMemberCount(group, joined);
  return (
    <article className={`card flex animate-rise flex-col gap-3 p-4 sm:p-5 ${joined ? "border-maroon-200 ring-1 ring-maroon-100" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-bold text-ink-900">{group.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {group.origin}, {group.region}
            </span>
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink-700" title="Members">
          <Users className="h-4 w-4 text-ink-400" aria-hidden />
          {count}
          <span className="sr-only"> members</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip">
          <ModeIcon mode={group.mode} className="h-3.5 w-3.5" />
          {MODE_LABEL[group.mode]}
        </span>
        <span className={group.campus === "rose-hill" ? "chip-maroon" : "chip-blue"}>{CAMPUS_LABEL[group.campus]}</span>
        {group.isCustom ? <span className="chip-gold">Created by you</span> : null}
        {joined ? <span className="chip-green">Joined</span> : null}
      </div>

      <p className="flex items-start gap-1.5 text-sm text-ink-700">
        <Route className="mt-0.5 h-4 w-4 shrink-0 text-maroon-700" aria-hidden />
        {group.route}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
          <Clock className="h-4 w-4 text-gold-600" aria-hidden />
          Departs {formatTime(group.departureTime)}
        </span>
        <ul className="flex flex-wrap gap-1" aria-label="Days">
          {DAYS.filter((d) => group.days.includes(d)).map((d) => (
            <li key={d} className="rounded-md bg-maroon-50 px-1.5 py-0.5 text-[11px] font-semibold text-maroon-800">
              {d}
            </li>
          ))}
        </ul>
      </div>

      {group.description ? <p className="text-sm leading-relaxed text-ink-600">{group.description}</p> : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onToggleJoin(group)}
          className={joined ? "btn-secondary flex-1" : "btn-primary flex-1"}
          aria-label={`${joined ? "Leave" : "Join"} ${group.name}`}
        >
          {joined ? "Leave group" : "Join group"}
        </button>
        {joined ? (
          <button type="button" onClick={() => onOpenChat(group)} className="btn-secondary flex-1">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Chat
          </button>
        ) : null}
      </div>
    </article>
  );
}
