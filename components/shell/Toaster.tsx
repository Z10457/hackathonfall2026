"use client";

import { BellRing, CircleCheck, TriangleAlert, X } from "lucide-react";
import { dismissToast, useToasts, type ToastTone } from "@/lib/toast";

const TONE: Record<ToastTone, { icon: typeof BellRing; className: string }> = {
  info: { icon: BellRing, className: "text-maroon-700" },
  success: { icon: CircleCheck, className: "text-emerald-600" },
  warning: { icon: TriangleAlert, className: "text-amber-600" },
};

export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[68px] z-[60] flex flex-col items-center gap-2 px-4 sm:top-20 sm:items-end sm:px-6"
    >
      {toasts.map((t) => {
        const { icon: Icon, className } = TONE[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm animate-toast items-start gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-lift"
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${className}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{t.title}</p>
              {t.message ? <p className="mt-0.5 text-[13px] leading-snug text-ink-600">{t.message}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="-m-1 rounded-lg p-1 text-ink-400 hover:bg-paper hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
