import type { ReactNode } from "react";
import { BRAND_ASSETS } from "@/lib/constants";

interface EmptyStateProps {
  title: string;
  message: string;
  /** Optional call to action (a button or link). */
  action?: ReactNode;
}

/** Empty state with the Fordham Ram. Use whenever a list or result set has nothing to show. */
export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="card flex animate-fade flex-col items-center px-6 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND_ASSETS.ramMascot} alt="" width={88} height={88} className="h-22 w-22 opacity-90" />
      <h3 className="mt-4 text-xl font-bold text-ink-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-600">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
