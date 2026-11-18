/** 95 -> "1 h 35 min", 48 -> "48 min" */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatCost(dollars: number): string {
  return dollars === 0 ? "Free" : `$${dollars.toFixed(2)}`;
}

export type SortKey = "fastest" | "cheapest" | "transfers";

export const SORT_LABEL: Record<SortKey, string> = {
  fastest: "Fastest",
  cheapest: "Cheapest",
  transfers: "Fewest transfers",
};
