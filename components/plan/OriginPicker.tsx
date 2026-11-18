"use client";

import { MapPin } from "lucide-react";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { KNOWN_ORIGINS } from "@/lib/planner";

interface OriginPickerProps {
  value: string;
  onChange: (next: string) => void;
  error?: string;
}

const MAX_SUGGESTIONS = 8;

export function OriginPicker({ value, onChange, error }: OriginPickerProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return KNOWN_ORIGINS.slice(0, MAX_SUGGESTIONS);
    return KNOWN_ORIGINS.filter((o) => o.name.toLowerCase().includes(q) || o.region.toLowerCase().includes(q))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(q)) - Number(a.name.toLowerCase().startsWith(q)))
      .slice(0, MAX_SUGGESTIONS);
  }, [value]);

  const showList = open && suggestions.length > 0;

  const choose = (name: string): void => {
    onChange(name);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter" && showList && active >= 0) {
      event.preventDefault();
      choose(suggestions[active].name);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <label className="label" htmlFor={`${listId}-input`}>
        Starting from
      </label>
      <div className="relative">
        <MapPin size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-maroon-700" aria-hidden />
        <input
          id={`${listId}-input`}
          className="input pl-10"
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          placeholder="Town, neighborhood, or address"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-maroon-700">{error}</p> : null}
      {showList ? (
        <ul id={listId} role="listbox" className="card absolute z-20 mt-1.5 max-h-72 w-full animate-fade overflow-auto p-1.5 shadow-lift">
          {suggestions.map((o, i) => (
            <li
              key={o.name}
              role="option"
              aria-selected={i === active}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${i === active ? "bg-maroon-50" : "hover:bg-paper"}`}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o.name);
              }}
            >
              <span className="font-semibold text-ink-900">{o.name}</span>
              <span className="text-xs text-ink-500">{o.region}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
