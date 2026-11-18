"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { useAuthSessionGuard, useStudent } from "@/lib/auth";
import { isDemoStudent } from "@/lib/accounts";
import { BRAND_ASSETS, CAMPUS_LABEL, RAM_VAN_BOOKING_URL } from "@/lib/constants";
import { ExternalLink } from "lucide-react";
import { toggleDemoPanel } from "@/lib/demo";
import { AlertBanner } from "./AlertBanner";
import { DemoMode } from "./DemoMode";
import { Footer } from "./Footer";
import { NAV_ITEMS, isActive } from "./nav";
import { Toaster } from "./Toaster";

function TopBar({ subtitle, demo = true, booking = false }: { subtitle?: string; demo?: boolean; booking?: boolean }) {
  return (
    <header className="sticky top-0 z-40 bg-maroon-700 text-white shadow-[0_1px_0_rgb(201_162_39/0.9),0_6px_20px_-10px_rgb(72_0_20/0.6)]">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Ram Hub home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_ASSETS.logoWhite}
            alt="Fordham University"
            width={134}
            height={36}
            className="h-8 w-auto shrink-0 sm:h-9"
          />
          <span aria-hidden className="h-7 w-px shrink-0 bg-white/30" />
          <span className="font-display text-xl leading-none font-bold tracking-tight whitespace-nowrap sm:text-2xl">
            Ram Hub
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {subtitle ? (
            <span className="hidden text-sm text-white/80 md:inline">{subtitle}</span>
          ) : null}
          {booking ? (
            <a
              href={RAM_VAN_BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold whitespace-nowrap text-maroon-900 transition hover:bg-gold-400"
            >
              Book Ram Van <ExternalLink className="hidden h-3.5 w-3.5 sm:inline" aria-hidden />
            </a>
          ) : null}
          {demo ? (
          <button
            type="button"
            onClick={toggleDemoPanel}
            className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-gold-400/70 bg-maroon-900/40 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gold-100 transition hover:bg-maroon-900/70"
            title="Van positions and seats are simulated. Fordham has no public live feed. Click or press D for demo controls."
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-gold-400" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-400" />
            </span>
            Demo data
          </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function Sidebar({ pathname, demo }: { pathname: string; demo: boolean }) {
  return (
    <nav
      aria-label="Primary"
      className="sticky top-16 hidden h-[calc(100dvh-7rem)] self-start w-60 shrink-0 flex-col border-r border-line bg-white/70 px-3 py-6 backdrop-blur lg:flex"
    >
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  active ? "bg-maroon-700 text-white shadow-sm" : "text-ink-700 hover:bg-maroon-50"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
                <span className="min-w-0">
                  <span className="block text-sm leading-tight font-semibold">{item.label}</span>
                  <span className={`block truncate text-xs ${active ? "text-white/75" : "text-ink-500"}`}>
                    {item.hint}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {demo ? (
      <div className="mt-auto rounded-xl border border-line bg-paper p-3 text-xs leading-relaxed text-ink-600">
        <p className="font-semibold text-ink-900">Presenting?</p>
        <p>
          Press <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[11px]">D</kbd> for
          demo controls.
        </p>
      </div>
      ) : null}
    </nav>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                  active ? "text-maroon-700" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {active ? <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-maroon-700" /> : null}
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ShellSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8" aria-busy="true" aria-label="Loading Ram Hub">
      <div className="skeleton h-9 w-56" />
      <div className="skeleton h-64 w-full rounded-2xl" />
      <div className="skeleton h-24 w-full rounded-2xl" />
      <div className="skeleton h-24 w-full rounded-2xl" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { student, ready } = useStudent();
  useAuthSessionGuard();

  // Account recovery must work while signed out, so it skips the sign-in gate.
  if (pathname.startsWith("/reset-password")) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-dvh">
        <TopBar />
        <ShellSkeleton />
      </div>
    );
  }

  if (!student) {
    return (
      <>
        <AuthScreen />
        <Toaster />
      </>
    );
  }

  const demo = isDemoStudent(student);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-maroon-700"
      >
        Skip to content
      </a>
      <TopBar subtitle={`${student.name.split(" ")[0]} · ${CAMPUS_LABEL[student.campus]}`} demo={demo} booking />
      {demo ? <AlertBanner /> : null}
      <div className="mx-auto flex w-full max-w-[1400px] flex-1">
        <Sidebar pathname={pathname} demo={demo} />
        <div className="flex min-w-0 flex-1 flex-col">
          <main id="main" className="flex-1 px-4 pt-5 pb-8 sm:px-6 lg:px-8 lg:pt-8">
            {children}
          </main>
          <Footer />
        </div>
      </div>
      <BottomNav pathname={pathname} />
      <Toaster />
      {demo ? <DemoMode /> : null}
    </div>
  );
}
