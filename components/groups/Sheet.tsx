"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface SheetProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Pinned below the scrolling body (action buttons, message input). */
  footer?: ReactNode;
  /** Fills most of the viewport height (used by chat). */
  tall?: boolean;
}

/** Bottom sheet on mobile, centered dialog from sm up. Sits above the tab bar (z-50). */
export function Sheet({ title, subtitle, onClose, children, footer, tall = false }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex animate-fade items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-900/55 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex w-full max-w-lg animate-sheet flex-col overflow-hidden rounded-t-3xl border border-line bg-white shadow-lift focus:outline-none sm:rounded-3xl ${
          tall ? "h-[88dvh] sm:h-[640px] sm:max-h-[86dvh]" : "max-h-[92dvh] sm:max-h-[88dvh]"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line bg-paper px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-ink-900">{title}</h2>
            {subtitle ? <p className="mt-0.5 truncate text-sm text-ink-500">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-ghost -mr-2 !min-h-11 !w-11 !p-0">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="border-t border-line bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
      </div>
    </div>
  );
}
