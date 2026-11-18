import { Repeat, Wallet, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { MODE_LABEL } from "@/lib/constants";
import type { TransitOption, TransitTag } from "@/lib/types";
import { formatCost, formatDuration } from "./format";

interface PlannerSummaryProps {
  options: TransitOption[];
}

interface TileProps {
  icon: ReactNode;
  title: string;
  value: string;
  tone: string;
}

function Tile({ icon, title, value, tone }: TileProps) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${tone}`}>
      <span aria-hidden className="shrink-0">{icon}</span>
      <p className="min-w-0 leading-snug">
        <span className="block text-[11px] font-bold tracking-wide text-ink-600 uppercase">{title}</span>
        <span className="block text-sm font-semibold text-ink-900">{value}</span>
      </p>
    </div>
  );
}

const find = (options: TransitOption[], tag: TransitTag): TransitOption | undefined =>
  options.find((o) => o.tags.includes(tag));

export function PlannerSummary({ options }: PlannerSummaryProps) {
  const fastest = find(options, "fastest");
  const cheapest = find(options, "cheapest");
  const fewest = find(options, "fewest-transfers");
  return (
    <div className="@container">
    <div className="grid gap-2.5 @xl:grid-cols-3" role="list" aria-label="Best options">
      {fastest ? (
        <div role="listitem">
          <Tile icon={<Zap size={18} className="text-gold-600" />} title="Fastest" value={`${MODE_LABEL[fastest.mode]}, ${formatDuration(fastest.durationMinutes)}`} tone="border-gold-400/60 bg-gold-100/50" />
        </div>
      ) : null}
      {cheapest ? (
        <div role="listitem">
          <Tile icon={<Wallet size={18} className="text-emerald-700" />} title="Cheapest" value={`${MODE_LABEL[cheapest.mode]}, ${formatCost(cheapest.cost)}`} tone="border-emerald-200 bg-emerald-50" />
        </div>
      ) : null}
      {fewest ? (
        <div role="listitem">
          <Tile icon={<Repeat size={18} className="text-lc-600" />} title="Fewest transfers" value={`${MODE_LABEL[fewest.mode]}, ${fewest.transfers === 0 ? "no transfers" : fewest.transfers === 1 ? "1 transfer" : `${fewest.transfers} transfers`}`} tone="border-lc-500/30 bg-lc-50" />
        </div>
      ) : null}
    </div>
    </div>
  );
}
