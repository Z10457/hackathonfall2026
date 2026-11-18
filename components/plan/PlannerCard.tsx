import { ArrowRight, ChevronDown, Repeat, Wallet, Zap } from "lucide-react";
import { BRAND_ASSETS, MODE_LABEL, formatTime } from "@/lib/constants";
import type { Campus, TransitOption, TransitTag } from "@/lib/types";
import { formatCost, formatDuration } from "./format";
import { ModeBadge } from "./modeMeta";
import { PlannerTimeline } from "./PlannerTimeline";
import { RamVanFacts } from "./RamVanFacts";

interface PlannerCardProps {
  option: TransitOption;
  origin: string;
  campus: Campus;
  expanded: boolean;
  onToggle: (id: string) => void;
}

const TAG_STYLE: Record<TransitTag, { label: string; chip: string; ring: string }> = {
  fastest: { label: "Fastest", chip: "chip-gold", ring: "border-gold-500 shadow-lift" },
  cheapest: { label: "Cheapest", chip: "chip-green", ring: "border-emerald-300" },
  "fewest-transfers": { label: "Fewest transfers", chip: "chip-blue", ring: "border-lc-500/40" },
};

function TagChip({ tag }: { tag: TransitTag }) {
  const style = TAG_STYLE[tag];
  const Icon = tag === "fastest" ? Zap : tag === "cheapest" ? Wallet : Repeat;
  return (
    <span className={`${style.chip} font-bold tracking-wide uppercase`}>
      <Icon size={12} aria-hidden /> {style.label}
    </span>
  );
}

export function PlannerCard({ option, origin, campus, expanded, onToggle }: PlannerCardProps) {
  const involvesVan = option.steps.some((s) => s.mode === "ram-van");
  const ring = option.tags.length > 0 ? TAG_STYLE[option.tags[0]].ring : "";
  const panelId = `plan-steps-${option.id}`;

  return (
    <article className={`card animate-rise overflow-hidden ${ring}`}>
      {option.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-b border-line bg-paper/70 px-4 py-2">
          {option.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      ) : null}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {option.mode === "ram-van" ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gold-500 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={BRAND_ASSETS.ramVanIcon} alt="" width={32} height={16} className="h-4 w-8" />
            </span>
          ) : (
            <ModeBadge mode={option.mode} size={44} />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg leading-tight font-bold text-ink-900">{option.label}</h3>
            <p className="mt-0.5 line-clamp-2 text-sm text-ink-600">{option.summary}</p>
            <p className="mt-1 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
              {MODE_LABEL[option.mode]}
              {option.source === "google" ? " | Live" : ""}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl leading-none font-bold text-ink-900">{formatDuration(option.durationMinutes)}</p>
            <p className="mt-1 text-sm font-semibold text-maroon-700">{formatCost(option.cost)}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-paper px-3.5 py-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-ink-500 uppercase">Leave by</p>
            <p className="text-base font-bold text-ink-900">{formatTime(option.leaveBy)}</p>
          </div>
          <ArrowRight size={16} className="text-ink-400" aria-hidden />
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-ink-500 uppercase">Arrive by</p>
            <p className="text-base font-bold text-ink-900">{formatTime(option.arriveBy)}</p>
          </div>
          <span className="chip ml-auto">
            {option.transfers === 0 ? "No transfers" : `${option.transfers} transfer${option.transfers === 1 ? "" : "s"}`}
          </span>
        </div>

        <button
          type="button"
          className="btn-ghost mt-3 w-full justify-between sm:w-auto"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => onToggle(option.id)}
        >
          {expanded ? "Hide steps" : `Show ${option.steps.length} steps`}
          <ChevronDown size={16} aria-hidden className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded ? (
          <div id={panelId} className="mt-3 animate-fade space-y-4 border-t border-line pt-4">
            <PlannerTimeline steps={option.steps} origin={origin} leaveBy={option.leaveBy} arriveBy={option.arriveBy} campus={campus} />
            {option.note ? <p className="rounded-lg bg-gold-100/60 px-3 py-2 text-xs leading-relaxed text-ink-700">{option.note}</p> : null}
            {involvesVan ? <RamVanFacts /> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
