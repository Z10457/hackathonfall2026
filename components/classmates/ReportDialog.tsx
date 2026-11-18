"use client";

import { useState } from "react";
import { Sheet } from "@/components/groups/Sheet";

export const REPORT_REASONS: string[] = [
  "Inappropriate or harassing behavior",
  "Fake or impersonating profile",
  "Made me feel unsafe",
  "Spam or unwanted contact",
  "Something else",
];

interface ReportDialogProps {
  name: string;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

export function ReportDialog({ name, onSubmit, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  return (
    <Sheet
      title={`Report ${name}`}
      subtitle="Reports are reviewed by Fordham staff"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={() => {
              if (reason) onSubmit(reason);
              else setShowError(true);
            }}
          >
            Submit report
          </button>
        </div>
      }
    >
      <fieldset className="space-y-2 px-5 py-5">
        <legend className="mb-2 text-sm text-ink-600">What happened?</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition ${reason === r ? "border-maroon-700 bg-maroon-50 font-semibold" : "border-line hover:border-maroon-300"}`}>
            <input type="radio" name="report-reason" className="h-4 w-4 accent-[#900028]" checked={reason === r} onChange={() => { setReason(r); setShowError(false); }} />
            {r}
          </label>
        ))}
        {showError ? <p role="alert" className="text-xs font-medium text-maroon-700">Choose a reason to continue.</p> : null}
        <p className="pt-2 text-xs text-ink-500">In an emergency, call Fordham Public Safety at (718) 817-2222.</p>
      </fieldset>
    </Sheet>
  );
}
