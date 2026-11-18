"use client";

import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CourseInput } from "@/components/ui/CourseInput";
import {
  AccountError,
  BACKEND_KIND,
  MIN_PASSWORD_LENGTH,
  accountErrorCode,
  accountErrorMessage,
  accounts,
  type AccountErrorCode,
  type SignedInAccount,
} from "@/lib/accounts";
import { useStudent } from "@/lib/auth";
import { BRAND_ASSETS, isFordhamEmail, normalizeEmail } from "@/lib/constants";
import { toast } from "@/lib/toast";
import type { Student } from "@/lib/types";
import { EMPTY_DRAFT, studentFromDraft, validateTrips, type OnboardingDraft } from "./onboarding";
import { RoleStep, TripDetailsStep } from "./TripSteps";

/** Local-only profile so judges can try the app without an account. Never sent to a backend. */
const DEMO_STUDENT: Student = {
  id: "demo-student",
  name: "Jordan Rivera",
  email: "jrivera42@fordham.edu",
  role: "commuter",
  campus: "rose-hill",
  homeRegion: "Long Island",
  homeArea: "Hicksville",
  arrivalTime: "09:30",
  courses: ["CISC 2000", "ECON 1100", "THEO 1000", "PHIL 1000"],
  shareProfile: true,
  commuteMode: "lirr",
  commuteDays: ["Mon", "Tue", "Wed", "Thu"],
  year: "Sophomore",
  major: "Computer Science",
};

type AuthMode = "signup" | "signin";

const NOT_FORDHAM_MESSAGE = accountErrorMessage(new AccountError("not-fordham"));

const STEPS = ["Account", "Getting around", "Your trips", "Classes and privacy"] as const;
const LAST_STEP = STEPS.length - 1;

interface FormError {
  message: string;
  code: AccountErrorCode | "validation";
}

function StepDots({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === step ? "w-8 bg-maroon-700" : i < step ? "w-4 bg-gold-500" : "w-4 bg-line"
          }`}
        />
      ))}
    </ol>
  );
}

function resetHref(email: string): string {
  return email.trim() ? `/reset-password?email=${encodeURIComponent(normalizeEmail(email))}` : "/reset-password";
}

export function AuthScreen() {
  const { saveStudent } = useStudent();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);
  const [account, setAccount] = useState<SignedInAccount | null>(null);
  const [error, setError] = useState<FormError | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = (changes: Partial<OnboardingDraft>) => {
    setDraft((prev) => ({ ...prev, ...changes }));
    setError(null);
  };

  /** After any sign-in: load the saved profile, or continue to onboarding. */
  const afterSignIn = async (signedIn: SignedInAccount) => {
    const saved = await accounts.loadProfile(signedIn.uid);
    if (saved) {
      saveStudent(saved);
      toast({ title: `Welcome back, ${saved.name.split(" ")[0]}`, message: "Your saved profile is loaded.", tone: "success" });
      return;
    }
    setAccount(signedIn);
    setDraft((prev) => ({ ...prev, email: signedIn.email, name: prev.name.trim() || signedIn.displayName || "", password: "" }));
    setStep(1);
  };

  const run = async (action: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError({ message: accountErrorMessage(err), code: accountErrorCode(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => run(async () => afterSignIn(await accounts.signInWithGoogle()));

  const handleEmailAuth = () =>
    run(async () => {
      const signedIn =
        mode === "signup"
          ? await accounts.signUp(draft.email, draft.password, draft.name)
          : await accounts.signIn(draft.email, draft.password);
      await afterSignIn(signedIn);
    });

  const useDemoProfile = () => {
    saveStudent(DEMO_STUDENT);
    toast({ title: "Signed in with the demo profile", message: "Jordan Rivera, Rose Hill commuter. Saved only in this browser.", tone: "success" });
  };

  const validate = (): string | null => {
    if (step === 0) {
      if (mode === "signup" && draft.name.trim().length < 2) return "Enter your name so drivers and classmates know who you are.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) return "Enter a valid email address.";
      if (mode === "signup" && !isFordhamEmail(draft.email)) return NOT_FORDHAM_MESSAGE;
      if (mode === "signup" && draft.password.length < MIN_PASSWORD_LENGTH)
        return `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`;
      if (mode === "signin" && !draft.password) return "Enter your password.";
    }
    if (step === 2) return validateTrips(draft);
    return null;
  };

  const finish = () =>
    run(async () => {
      const uid = accounts.currentUid();
      if (!account || uid !== account.uid) {
        setStep(0);
        throw new Error("Your sign-in expired. Please sign in again.");
      }
      const student = studentFromDraft(draft, account.uid, account.email, account.displayName ?? "Ram Hub rider");
      await accounts.saveProfile(student);
      saveStudent(student);
      toast({ title: `Welcome to Ram Hub, ${student.name.split(" ")[0]}`, message: "You are all set.", tone: "success" });
    });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problem = validate();
    if (problem) {
      setError({ message: problem, code: "validation" });
      return;
    }
    if (step === 0) handleEmailAuth();
    else if (step < LAST_STEP) setStep(step + 1);
    else finish();
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative isolate flex flex-col justify-between overflow-hidden bg-maroon-800 px-6 pt-7 pb-8 text-white sm:px-10 lg:min-h-dvh lg:pb-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_ASSETS.ramVanPhoto}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_60%]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-maroon-900/92 via-maroon-800/78 to-maroon-900/95" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_ASSETS.logoWhite}
          alt="Fordham University"
          width={178}
          height={48}
          className="h-10 w-auto self-start sm:h-12"
        />
        <div className="mt-10 animate-rise lg:mt-0">
          <p className="text-[11px] font-bold tracking-[0.22em] text-gold-400 uppercase">For commuters and residents</p>
          <h1 className="mt-3 text-5xl leading-[0.95] font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Ram Hub
          </h1>
          <div className="mt-5 h-[3px] w-16 rounded-full bg-gold-500" />
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
            See every Ram Van live, hold your seat, and find the people who share your ride between Rose Hill,
            Lincoln Center, and home.
          </p>
        </div>
        <ul className="mt-8 hidden gap-x-6 gap-y-2 text-sm text-white/80 sm:flex sm:flex-wrap lg:mt-0">
          {["Live van map", "Seat reservations", "Commute planner", "Commuter groups"].map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-gold-400" /> {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Form panel */}
      <section className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <StepDots step={step} />
          <form key={step} onSubmit={onSubmit} noValidate className="mt-5 animate-rise space-y-5">
            {step === 0 ? (
              <>
                <header>
                  <p className="eyebrow">Step 1 of 4</p>
                  <h2 className="mt-1 text-3xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
                  <p className="mt-2 text-sm text-ink-600">
                    {mode === "signup" ? "Use your @fordham.edu email address." : "Sign in to load your saved profile."}
                  </p>
                </header>
                {accounts.supportsGoogle ? (
                  <>
                    <button type="button" onClick={handleGoogle} disabled={busy} className="btn-secondary w-full">
                      Continue with Fordham Google
                    </button>
                    <div className="flex items-center gap-3 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                      <span className="h-px flex-1 bg-line" /> or use email <span className="h-px flex-1 bg-line" />
                    </div>
                  </>
                ) : null}
                {mode === "signup" ? (
                  <div>
                    <label className="label" htmlFor="name">Full name</label>
                    <input
                      id="name"
                      autoComplete="name"
                      placeholder="Jordan Rivera"
                      className="input"
                      value={draft.name}
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                  </div>
                ) : null}
                <div>
                  <label className="label" htmlFor="email">Fordham email</label>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@fordham.edu"
                    className="input"
                    value={draft.email}
                    onChange={(e) => patch({ email: e.target.value })}
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <label className="label !mb-0" htmlFor="password">Password</label>
                    {mode === "signin" ? (
                      <Link href={resetHref(draft.email)} className="text-xs font-semibold text-maroon-700 underline-offset-2 hover:underline">
                        Forgot password?
                      </Link>
                    ) : null}
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder={mode === "signup" ? `At least ${MIN_PASSWORD_LENGTH} characters` : ""}
                    className="input"
                    value={draft.password}
                    onChange={(e) => patch({ password: e.target.value })}
                  />
                </div>
              </>
            ) : null}

            {step === 1 ? <RoleStep draft={draft} onChange={patch} /> : null}
            {step === 2 ? <TripDetailsStep draft={draft} onChange={patch} /> : null}

            {step === 3 ? (
              <>
                <header>
                  <p className="eyebrow">Step 4 of 4</p>
                  <h2 className="mt-1 text-3xl font-bold">Classes and privacy</h2>
                  <p className="mt-2 text-sm text-ink-600">
                    Add course codes to find classmates on your route. You can skip this.
                  </p>
                </header>
                <div>
                  <span className="label">Course codes</span>
                  <CourseInput courses={draft.courses} onChange={(courses) => patch({ courses })} />
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-4">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 shrink-0 accent-maroon-700"
                    checked={draft.shareProfile}
                    onChange={(e) => patch({ shareProfile: e.target.checked })}
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                      <ShieldCheck className="h-4 w-4 text-maroon-700" /> Show my name to matched classmates
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-ink-600">
                      Off by default. When off, you appear as initials only and your home area stays hidden.
                    </span>
                  </span>
                </label>
              </>
            ) : null}

            {error ? (
              <div role="alert" className="rounded-xl border border-maroon-200 bg-maroon-50 px-3.5 py-2.5 text-sm font-medium text-maroon-800">
                <p>{error.message}</p>
                {error.code === "email-exists" ? (
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    <button type="button" onClick={() => switchMode("signin")} className="cursor-pointer font-bold underline underline-offset-2">
                      Sign in
                    </button>
                    <Link href={resetHref(draft.email)} className="font-bold underline underline-offset-2">
                      Reset password
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex gap-2 pt-1">
              {step > 1 ? (
                <button type="button" className="btn-secondary" onClick={() => { setStep(step - 1); setError(null); }}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : null}
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                {busy
                  ? "Please wait..."
                  : step === 0
                    ? mode === "signup" ? "Create account" : "Sign in"
                    : step === LAST_STEP ? "Finish setup" : "Continue"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {step === 0 ? (
            <>
              <p className="mt-4 text-center text-sm text-ink-600">
                {mode === "signup" ? "Already have an account?" : "New to Ram Hub?"}{" "}
                <button
                  type="button"
                  onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
                  className="cursor-pointer font-semibold text-maroon-700 underline-offset-2 hover:underline"
                >
                  {mode === "signup" ? "Sign in" : "Create account"}
                </button>
              </p>
              <button type="button" onClick={useDemoProfile} className="btn-ghost mt-3 w-full">
                <Sparkles className="h-4 w-4" /> Skip with a demo profile
              </button>
            </>
          ) : null}

          <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-ink-500">
            Ram Hub is a student project and is not affiliated with Fordham University operations. Live van positions
            are simulated demo data.{" "}
            {BACKEND_KIND === "local"
              ? "Dev mode: accounts are a local mock stored only in this browser, with hashed passwords."
              : "Accounts and profiles are stored in Firebase; the demo profile stays in this browser."}
          </p>
        </div>
      </section>
    </div>
  );
}
