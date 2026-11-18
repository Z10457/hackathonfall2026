"use client";

import { useSyncExternalStore } from "react";

export type ToastTone = "info" | "success" | "warning";

export interface Toast {
  id: number;
  title: string;
  message?: string;
  tone: ToastTone;
}

const DURATION_MS = 5000;
const MAX_VISIBLE = 3;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const EMPTY: Toast[] = [];

function emit(next: Toast[]): void {
  toasts = next;
  listeners.forEach((listener) => listener());
}

export function dismissToast(id: number): void {
  emit(toasts.filter((t) => t.id !== id));
}

/**
 * Show a toast from anywhere (components, the simulation, demo mode).
 * Example: toast({ title: "Van 3 is 5 minutes away", tone: "info" })
 */
export function toast(input: { title: string; message?: string; tone?: ToastTone }): void {
  if (typeof window === "undefined") return;
  const id = nextId++;
  const next: Toast = { id, title: input.title, message: input.message, tone: input.tone ?? "info" };
  emit([...toasts, next].slice(-MAX_VISIBLE));
  window.setTimeout(() => dismissToast(id), DURATION_MS);
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => toasts,
    () => EMPTY,
  );
}
