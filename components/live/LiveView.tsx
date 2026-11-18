"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStudent } from "@/lib/auth";
import { isLocalOnlyStudent } from "@/lib/firebaseAuth";
import { useVanSimulation } from "@/lib/vanSimulation";
import { ArrivalList, type DirectionFilter } from "./ArrivalList";
import { RideCard } from "./RideCard";
import { ScheduleView } from "./ScheduleView";
import { TicketDialog } from "./Ticket";
import { VanMap } from "./VanMap";
import { VanPanel } from "./VanPanel";
import { cancelReservation, installReservationWatcher, isActive, useReservations } from "./reservations";

function LiveSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]" aria-busy="true" aria-label="Loading live vans">
      <div className="skeleton h-[60vh] min-h-[420px] rounded-2xl" />
      <div className="space-y-3">
        <div className="skeleton h-8 w-48" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[72px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function LiveView() {
  const { student } = useStudent();
  if (student && !isLocalOnlyStudent(student)) return <ScheduleView student={student} />;
  return <SimulatedLiveView />;
}

/** The simulated live map, shown only for the demo profile. */
function SimulatedLiveView() {
  const { student } = useStudent();
  const sim = useVanSimulation();
  const [reservations] = useReservations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [filter, setFilter] = useState<DirectionFilter>(() =>
    student?.campus === "lincoln-center" ? "to-lincoln-center" : "to-rose-hill",
  );

  useEffect(() => {
    installReservationWatcher();
  }, []);

  const mine = useMemo(
    () => (student ? reservations.filter((r) => r.studentId === student.id && isActive(r)) : []),
    [reservations, student],
  );
  const vans = sim.vans;
  const selected = vans.find((v) => v.id === selectedId) ?? null;
  const shown = useMemo(
    () =>
      vans
        .filter((v) => filter === "all" || v.direction === filter)
        .sort((a, b) => a.etaMinutes - b.etaMinutes),
    [vans, filter],
  );
  const ride = mine[0] ?? null;
  const ticketReservation = mine.find((r) => r.id === ticketId && r.status === "confirmed") ?? null;
  const selectedReservation = selected ? (mine.find((r) => r.vanId === selected.id) ?? null) : null;

  const openRide = (): void => {
    if (!ride) return;
    if (ride.status === "confirmed") setTicketId(ride.id);
    else setSelectedId(ride.vanId);
  };

  if (!student) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Live"
        title="Ram Vans right now"
        description="Tap a van to see its seats and reserve. Positions are simulated for this demo."
      />
      {ride ? <RideCard reservation={ride} van={vans.find((v) => v.id === ride.vanId) ?? null} onOpen={openRide} /> : null}
      {vans.length === 0 ? (
        <LiveSkeleton />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          <div className="card h-[60vh] min-h-[440px] overflow-hidden lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)] lg:min-h-[560px]">
            <VanMap
              vans={vans}
              traffic={sim.traffic}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
            />
          </div>
          <div className="min-w-0">
            {selected ? (
              <VanPanel
                key={selected.id}
                van={selected}
                student={student}
                reservation={selectedReservation}
                onClose={() => setSelectedId(null)}
                onOpenTicket={() => selectedReservation && setTicketId(selectedReservation.id)}
              />
            ) : null}
            <div className={selected ? "mt-5 lg:hidden" : ""}>
              {shown.length === 0 ? (
                <EmptyState
                  title="No vans on this route"
                  message="No Ram Vans are heading this way right now. Try another direction."
                  action={
                    <button type="button" className="btn-primary" onClick={() => setFilter("all")}>
                      Show all vans
                    </button>
                  }
                />
              ) : (
                <ArrivalList
                  vans={shown}
                  filter={filter}
                  onFilter={setFilter}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
            </div>
          </div>
        </div>
      )}
      {ticketReservation ? (
        <TicketDialog
          reservation={ticketReservation}
          onClose={() => setTicketId(null)}
          onCancel={() => cancelReservation(ticketReservation)}
        />
      ) : null}
    </div>
  );
}
