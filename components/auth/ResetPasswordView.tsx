"use client";

import { ArrowLeft, CircleCheck, KeyRound, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { MIN_PASSWORD_LENGTH, accountErrorMessage, accounts } from "@/lib/accounts";
import { BRAND_ASSETS } from "@/lib/constants";

interface ResetPasswordViewProps {
  initialEmail: string;
  /** Reset code from the emailed link (Firebase oobCode) or from the local mock. */
  code: string;
}

type Stage =
  | { kind: "request" }
  | { kind: "sent" }
  | { kind: "checking" }
  | { kind: "choose"; email: string }
  | { kind: "invalid"; message: string }
  | { kind: "done" };

const GENERIC_SENT = "If an account exists for that email, we sent a link to reset your password. Check your inbox and spam folder.";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-maroon-700 px-5 py-4 text-white shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_ASSETS.logoWhite} alt="Fordham University" width={134} height={36} className="h-8 w-auto" />
          <span aria-hidden className="h-7 w-px bg-white/30" />
          <span className="font-display text-xl font-bold">Ram Hub</span>
        </div>
        <div className="card animate-rise p-6">{children}</div>
        <Link href="/" className="btn-ghost mt-3 w-full">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}

export function ResetPasswordView({ initialEmail, code }: ResetPasswordViewProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(code ? { kind: "checking" } : { kind: "request" });
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    accounts
      .verifyResetCode(code)
      .then((owner) => !cancelled && setStage({ kind: "choose", email: owner }))
      .catch((err: unknown) => !cancelled && setStage({ kind: "invalid", message: accountErrorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [code]);

  const requestLink = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter the email address you signed up with.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await accounts.requestPasswordReset(email);
      if (result.kind === "local-code") {
        // Local mock: the account exists on this device, so continue straight to a new password.
        router.replace(`/reset-password?code=${encodeURIComponent(result.code)}`);
      } else {
        setStage({ kind: "sent" });
      }
    } catch (err) {
      setError(accountErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await accounts.confirmPasswordReset(code, password);
      setStage({ kind: "done" });
    } catch (err) {
      setError(accountErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const errorBox = error ? (
    <p role="alert" className="rounded-xl border border-maroon-200 bg-maroon-50 px-3.5 py-2.5 text-sm font-medium text-maroon-800">
      {error}
    </p>
  ) : null;

  if (stage.kind === "checking") {
    return (
      <Shell>
        <div className="space-y-3" aria-busy="true" aria-label="Checking your reset link">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-11 w-full" />
        </div>
      </Shell>
    );
  }

  if (stage.kind === "invalid") {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Link not valid</h1>
        <p className="mt-2 text-sm text-ink-600">{stage.message}</p>
        <Link href="/reset-password" className="btn-primary mt-5 w-full">Send a new link</Link>
      </Shell>
    );
  }

  if (stage.kind === "done") {
    return (
      <Shell>
        <CircleCheck className="h-9 w-9 text-emerald-600" aria-hidden />
        <h1 className="mt-3 text-2xl font-bold">Password updated</h1>
        <p className="mt-2 text-sm text-ink-600">Sign in with your new password.</p>
        <Link href="/" className="btn-primary mt-5 w-full">Go to sign in</Link>
      </Shell>
    );
  }

  if (stage.kind === "sent") {
    return (
      <Shell>
        <MailCheck className="h-9 w-9 text-maroon-700" aria-hidden />
        <h1 className="mt-3 text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-ink-600" role="status">{GENERIC_SENT}</p>
      </Shell>
    );
  }

  if (stage.kind === "choose") {
    return (
      <Shell>
        <form onSubmit={savePassword} noValidate className="space-y-4">
          <header>
            <p className="eyebrow">Reset password</p>
            <h1 className="mt-1 text-2xl font-bold">Choose a new password</h1>
            <p className="mt-1 text-sm text-ink-600">For {stage.email}</p>
          </header>
          <div>
            <label className="label" htmlFor="new-password">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" className="input" placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} />
          </div>
          <div>
            <label className="label" htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" className="input" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(null); }} />
          </div>
          {errorBox}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            <KeyRound className="h-4 w-4" /> {busy ? "Saving..." : "Save new password"}
          </button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell>
      <form onSubmit={requestLink} noValidate className="space-y-4">
        <header>
          <p className="eyebrow">Forgot password</p>
          <h1 className="mt-1 text-2xl font-bold">Reset your password</h1>
          <p className="mt-1 text-sm text-ink-600">
            {accounts.kind === "local"
              ? "Enter the email of an account on this device to choose a new password."
              : "Enter your account email and we will send you a reset link."}
          </p>
        </header>
        <div>
          <label className="label" htmlFor="reset-email">Email</label>
          <input id="reset-email" type="email" inputMode="email" autoComplete="email" placeholder="you@fordham.edu" className="input" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} />
        </div>
        {errorBox}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Please wait..." : accounts.kind === "local" ? "Continue" : "Send reset link"}
        </button>
      </form>
    </Shell>
  );
}
