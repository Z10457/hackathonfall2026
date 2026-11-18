"use client";

import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CourseInput } from "@/components/ui/CourseInput";
import { isValidEmail, useStudent } from "@/lib/auth";
import { BRAND_ASSETS, CAMPUS_LABEL, REGIONS } from "@/lib/constants";
import { auth } from "@/lib/firebase";
import {
  authErrorMessage,
  createAccountWithEmail,
  loadProfile,
  saveProfile,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/firebaseAuth";
import { makeId } from "@/lib/storage";
import { toast } from "@/lib/toast";
import type { Campus, Region, Student } from "@/lib/types";
import type { User } from "firebase/auth";

interface Draft {
  email: string;
  password: string;
  name: string;
  campus: Campus;
  homeRegion: Region;
  homeArea: string;
  arrivalTime: string;
  courses: string[];
  shareProfile: boolean;
}

const EMPTY_DRAFT: Draft = {
  email: "",
  password: "",
  name: "",
  campus: "rose-hill",
  homeRegion: "Bronx",
  homeArea: "",
  arrivalTime: "09:30",
  courses: [],
  shareProfile: false,
};

/** Local-only profile so judges can try the app without an account. Never sent to Firebase. */
const DEMO_STUDENT: Omit<Student, "id"> = {
  name: "Jordan Rivera",
  email: "jrivera42@fordham.edu",
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

const STEPS = ["Sign in", "Your commute", "Classes and privacy"] as const;

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

export function AuthScreen() {
  const { saveStudent } = useStudent();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = (changes: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...changes }));
    setError(null);
  };

  /** After any sign-in: load a saved profile, or continue to onboarding. */
  const afterSignIn = async (user: User) => {
    const saved = await loadProfile(user.uid);
    if (saved) {
      saveStudent(saved);
      toast({ title: `Welcome back, ${saved.name.split(" ")[0]}`, message: "Your saved profile is loaded.", tone: "success" });
      return;
    }
    setDraft((prev) => ({
      ...prev,
      email: user.email ?? prev.email,
      name: prev.name.trim() || user.displayName || "",
      password: "",
    }));
    setStep(1);
  };

  const run = async (action: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = () => run(async () => afterSignIn(await signInWithGoogle()));

  const handleEmailAuth = () =>
    run(async () => {
      const user =
        mode === "signup"
          ? await createAccountWithEmail(draft.email, draft.password, draft.name)
          : await signInWithEmail(draft.email, draft.password);
      await afterSignIn(user);
    });

  const useDemoProfile = () => {
    saveStudent({ ...DEMO_STUDENT, id: makeId("demo") });
    toast({ title: "Signed in with the demo profile", message: "Jordan Rivera, Rose Hill commuter. Saved only in this browser.", tone: "success" });
  };

  const validate = (): string | null => {
    if (step === 0) {
      if (!isValidEmail(draft.email)) return "Enter a valid email address.";
      if (draft.password.length < 6) return "Use a password with at least 6 characters.";
      if (mode === "signup" && draft.name.trim().length < 2)
        return "Enter your name so drivers and classmates know who you are.";
    }
    if (step === 1) {
      if (draft.homeArea.trim().length < 2) return "Add your town or neighborhood, for example Hicksville or Astoria.";
      if (!/^\d{2}:\d{2}$/.test(draft.arrivalTime)) return "Pick the time you usually need to be on campus.";
    }
    return null;
  };

  const finish = () =>
    run(async () => {
      const user = auth.currentUser;
      if (!user) {
        setStep(0);
        throw new Error("Your sign-in expired. Please sign in again.");
      }
      const student: Student = {
        id: user.uid,
        name: draft.name.trim() || user.displayName || "Ram Hub rider",
        email: user.email ?? draft.email.trim(),
        campus: draft.campus,
        homeRegion: draft.homeRegion,
        homeArea: draft.homeArea.trim(),
        arrivalTime: draft.arrivalTime,
        courses: draft.courses,
        shareProfile: draft.shareProfile,
      };
      await saveProfile(student);
      saveStudent(student);
      toast({ title: `Welcome to Ram Hub, ${student.name.split(" ")[0]}`, message: "Your commute is set up.", tone: "success" });
    });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (step === 0) handleEmailAuth();
    else if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  const switchMode = () => {
    setMode(mode === "signup" ? "signin" : "signup");
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
          <p className="text-[11px] font-bold tracking-[0.22em] text-gold-400 uppercase">The commuter app for Rams</p>
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
          <div className="flex items-center justify-between">
            <StepDots step={step} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND_ASSETS.ramMascot} alt="Fordham Ram" width={56} height={56} className="h-14 w-14" />
          </div>
          <form key={step} onSubmit={onSubmit} noValidate className="mt-5 animate-rise space-y-5">
            {step === 0 ? (
              <>
                <header>
                  <p className="eyebrow">Step 1 of 3</p>
                  <h2 className="mt-1 text-3xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
                  <p className="mt-2 text-sm text-ink-600">
                    {mode === "signup" ? "Use any email address." : "Sign in to load your saved commute."}
                  </p>
                </header>
                <button type="button" onClick={handleGoogleLogin} disabled={busy} className="btn-secondary w-full">
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  <span className="h-px flex-1 bg-line" /> or use email <span className="h-px flex-1 bg-line" />
                </div>
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
                  <label className="label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="input"
                    value={draft.email}
                    onChange={(e) => patch({ email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder={mode === "signup" ? "At least 6 characters" : ""}
                    className="input"
                    value={draft.password}
                    onChange={(e) => patch({ password: e.target.value })}
                  />
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <header>
                  <p className="eyebrow">Step 2 of 3</p>
                  <h2 className="mt-1 text-3xl font-bold">Your commute</h2>
                  <p className="mt-2 text-sm text-ink-600">We use this to suggest groups and routes.</p>
                </header>
                <fieldset>
                  <legend className="label">Home campus</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(CAMPUS_LABEL) as Campus[]).map((campus) => (
                      <button
                        key={campus}
                        type="button"
                        aria-pressed={draft.campus === campus}
                        onClick={() => patch({ campus })}
                        className="min-h-12 cursor-pointer rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink-700 transition hover:border-maroon-300 aria-pressed:border-maroon-700 aria-pressed:bg-maroon-700 aria-pressed:text-white"
                      >
                        {CAMPUS_LABEL[campus]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="region">Home region</label>
                    <select
                      id="region"
                      className="input"
                      value={draft.homeRegion}
                      onChange={(e) => patch({ homeRegion: e.target.value as Region })}
                    >
                      {REGIONS.map((region) => (
                        <option key={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="area">Town or neighborhood</label>
                    <input
                      id="area"
                      placeholder="Hicksville"
                      className="input"
                      value={draft.homeArea}
                      onChange={(e) => patch({ homeArea: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="arrival">Usual arrival time on campus</label>
                  <input
                    id="arrival"
                    type="time"
                    className="input"
                    value={draft.arrivalTime}
                    onChange={(e) => patch({ arrivalTime: e.target.value })}
                  />
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <header>
                  <p className="eyebrow">Step 3 of 3</p>
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
              <p role="alert" className="rounded-xl border border-maroon-200 bg-maroon-50 px-3.5 py-2.5 text-sm font-medium text-maroon-800">
                {error}
              </p>
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
                    : step === STEPS.length - 1 ? "Finish setup" : "Continue"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {step === 0 ? (
            <>
              <p className="mt-4 text-center text-sm text-ink-600">
                {mode === "signup" ? "Already have an account?" : "New to Ram Hub?"}{" "}
                <button type="button" onClick={switchMode} className="cursor-pointer font-semibold text-maroon-700 underline-offset-2 hover:underline">
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
            are simulated demo data. Accounts and profiles are stored in Firebase; the demo profile stays in this browser.
          </p>
        </div>
      </section>
    </div>
  );
}
