import { Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";
import { CAMPUS_LABEL, DAYS, MODE_LABEL, REGIONS } from "@/lib/constants";
import { TIME_BUCKETS, activeFilterCount } from "@/lib/groups";
import type { GroupFilterState } from "@/lib/groups";
import type { Campus, Day, TransitMode } from "@/lib/types";

interface GroupFiltersProps {
  filters: GroupFilterState;
  resultCount: number;
  forYouActive: boolean;
  onChange: (next: GroupFilterState) => void;
  onForYou: () => void;
  onClear: () => void;
}

interface RowProps {
  label: string;
  children: ReactNode;
}

function Row({ label, children }: RowProps) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button type="button" className="chip-toggle shrink-0 whitespace-nowrap" aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

const CAMPUS_IDS: Campus[] = ["rose-hill", "lincoln-center"];
const MODE_IDS = Object.keys(MODE_LABEL) as TransitMode[];

export function GroupFilters({ filters, resultCount, forYouActive, onChange, onForYou, onClear }: GroupFiltersProps) {
  const active = activeFilterCount(filters);
  const toggleDay = (day: Day): void => {
    const days = filters.days.includes(day) ? filters.days.filter((d) => d !== day) : [...filters.days, day];
    onChange({ ...filters, days });
  };

  return (
    <section aria-label="Filter groups" className="card mb-5 space-y-3.5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="chip-toggle" aria-pressed={forYouActive} onClick={onForYou}>
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          For you
        </button>
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-ink-700" aria-live="polite">
            {resultCount} {resultCount === 1 ? "group" : "groups"}
          </p>
          {active > 0 ? (
            <button type="button" className="btn-ghost btn-sm" onClick={onClear}>
              <X className="h-3.5 w-3.5" aria-hidden />
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <Row label="Region">
        <Chip active={filters.region === "All"} onClick={() => onChange({ ...filters, region: "All" })}>
          All
        </Chip>
        {REGIONS.map((r) => (
          <Chip key={r} active={filters.region === r} onClick={() => onChange({ ...filters, region: r })}>
            {r}
          </Chip>
        ))}
      </Row>

      <Row label="Mode">
        <Chip active={filters.mode === "All"} onClick={() => onChange({ ...filters, mode: "All" })}>
          All
        </Chip>
        {MODE_IDS.map((m) => (
          <Chip key={m} active={filters.mode === m} onClick={() => onChange({ ...filters, mode: m })}>
            {MODE_LABEL[m]}
          </Chip>
        ))}
      </Row>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 [&>*]:min-w-0">
        <Row label="Campus">
          <Chip active={filters.campus === "All"} onClick={() => onChange({ ...filters, campus: "All" })}>
            All
          </Chip>
          {CAMPUS_IDS.map((c) => (
            <Chip key={c} active={filters.campus === c} onClick={() => onChange({ ...filters, campus: c })}>
              {CAMPUS_LABEL[c]}
            </Chip>
          ))}
        </Row>
        <Row label="Days">
          {DAYS.map((d) => (
            <Chip key={d} active={filters.days.includes(d)} onClick={() => toggleDay(d)}>
              {d}
            </Chip>
          ))}
        </Row>
      </div>

      <Row label="Departure time">
        <Chip active={filters.time === "All"} onClick={() => onChange({ ...filters, time: "All" })}>
          Any time
        </Chip>
        {TIME_BUCKETS.map((t) => (
          <Chip key={t.id} active={filters.time === t.id} onClick={() => onChange({ ...filters, time: t.id })}>
            {t.label}
          </Chip>
        ))}
      </Row>
    </section>
  );
}
