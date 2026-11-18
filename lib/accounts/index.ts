import { firebaseBackend } from "./firebaseBackend";
import { localBackend } from "./localBackend";
import { AccountError, type AccountBackend, type AccountErrorCode } from "./types";

export * from "./types";
export { MIN_PASSWORD_LENGTH, classmateCardOf, dedupeById, isDemoStudent } from "./shared";

/**
 * Which accounts backend this build uses.
 * - Default: Firebase Auth + Firestore (real shared accounts; config in lib/firebase.ts).
 * - NEXT_PUBLIC_RAMHUB_BACKEND=mock: local mock in this browser, for offline demos and tests.
 */
export const BACKEND_KIND: AccountBackend["kind"] =
  process.env.NEXT_PUBLIC_RAMHUB_BACKEND === "mock" ? "local" : "firebase";

export const accounts: AccountBackend = BACKEND_KIND === "local" ? localBackend : firebaseBackend;

const MESSAGES: Record<AccountErrorCode, string> = {
  "invalid-email": "That email address does not look right.",
  "not-fordham": "Use your @fordham.edu email address. Ram Hub accounts are for Fordham students.",
  "weak-password": "Use a password with at least 8 characters.",
  "email-exists": "An account with this email already exists. Sign in or reset your password.",
  "invalid-credentials": "Email or password is incorrect.",
  "account-not-found": "No Ram Hub account on this device uses that email.",
  "invalid-reset-code": "This reset link has expired or was already used. Request a new one.",
  "too-many-requests": "Too many attempts. Wait a minute and try again.",
  network: "Could not reach the server. Check your connection and try again.",
  "popup-closed": "The Google window was closed before sign-in finished.",
  "popup-blocked": "Your browser blocked the Google window. Allow pop-ups for this site and try again.",
  "unauthorized-domain":
    "This web address is not allowed to sign in yet. Add it under Authentication > Settings > Authorized domains in Firebase.",
  "operation-not-allowed": "This sign-in method is turned off for Ram Hub.",
  "permission-denied": "Your data could not be read or saved. The database rules may need to be published.",
  unknown: "Something went wrong. Please try again.",
};

export function accountErrorCode(error: unknown): AccountErrorCode {
  return error instanceof AccountError ? error.code : "unknown";
}

/** A sentence a student can act on, for any error thrown by the accounts backend. */
export function accountErrorMessage(error: unknown): string {
  return MESSAGES[accountErrorCode(error)];
}
