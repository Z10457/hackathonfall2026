"use client";

import { Clock, FastForward, RotateCcw, Sunrise, UsersRound, X, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DEMO_FAST_FORWARD, DEMO_TOGGLE_EVENT } from "@/lib/demo";
import { clearAllStored } from "@/lib/storage";
import { toast } from "@/lib/toast";
import { useVanSimulation, vanSim } from "@/lib/vanSimulation";

interface DemoAction {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  active?: boolean;
  run: () => void;
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Presenter controls. Press D (or tap the "Demo data" badge) to open. */
export function DemoMode() {
  const [open, setOpen] = useState(false);
  const [peakForced, setPeakForced] = useState(false);
  const { speedMultiplier } = useVanSimulation();
  const fast = speedMultiplier > 1;

  const toggleFast = useCallback(() => {
    const next = vanSim.getSnapshot().speedMultiplier > 1 ? 1 : DEMO_FAST_FORWARD;
    vanSim.setSpeedMultiplier(next);
    toast({
      title: next > 1 ? `Fast-forward on (${DEMO_FAST_FORWARD}x)` : "Back to real time",
      message: next > 1 ? "Vans now cover the route in about a minute." : undefined,
    });
  }, []);

  const injectDelay = useCallback(() => {
    const van = vanSim.injectDelay(undefined, 12);
    if (van) {
      toast({
        title: `Van ${van.number} is delayed`,
        message: "Heavy traffic on the Henry Hudson Parkway. ETAs updated.",
        tone: "warning",
      });
    }
  }, []);

  const fillVan = useCallback(() => {
    const van = vanSim.fillVan();
    if (van) {
      toast({
        title: `Van ${van.number} is now full`,
        message: "Open it on the map to join the waitlist.",
        tone: "warning",
      });
    }
  }, []);

  const togglePeak = useCallback(() => {
    const next = !peakForced;
    setPeakForced(next);
    vanSim.setPeakOverride(next ? true : null);
    toast({
      title: next ? "Peak service on" : "Peak override off",
      message: next ? "Vans 5 and 6 join the route." : "Vans 5 and 6 follow the clock again.",
    });
  }, [peakForced]);

  const resetAll = useCallback(() => {
    vanSim.reset();
    clearAllStored({ keepStudent: true });
    setPeakForced(false);
    toast({ title: "Demo reset", message: "Vans, seats, reservations, groups, and chats are back to the start.", tone: "success" });
  }, []);

  useEffect(() => {
    const onToggle = () => setOpen((prev) => !prev);
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "d") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (key === "escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(DEMO_TOGGLE_EVENT, onToggle);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(DEMO_TOGGLE_EVENT, onToggle);
    };
  }, []);

  // Number shortcuts only while the panel is open, so they never surprise a presenter.
  useEffect(() => {
    if (!open) return;
    const shortcuts: Record<string, () => void> = {
      "1": toggleFast,
      "2": injectDelay,
      "3": fillVan,
      "4": togglePeak,
      "0": resetAll,
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const action = shortcuts[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, toggleFast, injectDelay, fillVan, togglePeak, resetAll]);

  if (!open) return null;

  const actions: DemoAction[] = [
    { key: "1", label: fast ? "Stop fast-forward" : "Fast-forward", hint: `${DEMO_FAST_FORWARD}x simulation speed`, icon: FastForward, active: fast, run: toggleFast },
    { key: "2", label: "Inject a delay", hint: "Slow the next arriving van", icon: Clock, run: injectDelay },
    { key: "3", label: "Fill a van", hint: "Show full and waitlist", icon: UsersRound, run: fillVan },
    { key: "4", label: peakForced ? "End peak service" : "Peak service", hint: "Bring out vans 5 and 6", icon: Sunrise, active: peakForced, run: togglePeak },
    { key: "0", label: "Reset everything", hint: "Clear all demo data", icon: RotateCcw, run: resetAll },
  ];

  return (
    <aside
      role="dialog"
      aria-label="Demo controls"
      className="fixed right-3 bottom-[72px] left-3 z-[55] animate-sheet rounded-2xl border border-gold-500/60 bg-ink-900/95 p-3 text-white shadow-lift backdrop-blur sm:left-auto sm:w-[340px] lg:right-6 lg:bottom-6"
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-gold-400 uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-gold-400" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" />
          </span>
          Demo mode
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close demo controls"
          className="cursor-pointer rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="space-y-1">
        {actions.map(({ key, label, hint, icon: Icon, active, run }) => (
          <li key={key}>
            <button
              type="button"
              onClick={run}
              aria-pressed={active}
              className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                active ? "bg-gold-500 text-ink-900" : "bg-white/5 hover:bg-white/12"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-tight font-semibold">{label}</span>
                <span className={`block text-xs ${active ? "text-ink-900/70" : "text-white/60"}`}>{hint}</span>
              </span>
              <kbd
                className={`hidden rounded border px-1.5 py-0.5 font-mono text-[11px] sm:inline ${
                  active ? "border-ink-900/30" : "border-white/25 text-white/70"
                }`}
              >
                {key}
              </kbd>
            </button>
          </li>
        ))}
      </ul>
      <p className="px-1 pt-2 text-[11px] text-white/50">Press D to hide. All data on this screen is simulated.</p>
    </aside>
  );
}
