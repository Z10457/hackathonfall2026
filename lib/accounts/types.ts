import type { Student } from "../types";

/** Failure reasons every backend maps its own errors onto, so the UI shows one consistent message. */
export type AccountErrorCode =
  | "invalid-email"
  | "not-fordham"
  | "weak-password"
  | "email-exists"
  | "invalid-credentials"
  | "account-not-found"
  | "invalid-reset-code"
  | "too-many-requests"
  | "network"
  | "popup-closed"
  | "popup-blocked"
  | "unauthorized-domain"
  | "operation-not-allowed"
  | "permission-denied"
  | "unknown";

export class AccountError extends Error {
  readonly code: AccountErrorCode;

  constructor(code: AccountErrorCode, message?: string) {
    super(message ?? code);
    this.name = "AccountError";
    this.code = code;
  }
}

export interface SignedInAccount {
  uid: string;
  /** Normalized (lowercased, trimmed). */
  email: string;
  displayName: string | null;
}

/** One person in one group. The pair (groupId, uid) is unique. */
export interface GroupMember {
  groupId: string;
  uid: string;
}

export type ResetRequestResult =
  /** Real backend: a link was emailed if the account exists. Never says which. */
  | { kind: "email-sent" }
  /** Local mock: the account exists; continue on /reset-password with this one-time code. */
  | { kind: "local-code"; code: string };

export type Unsubscribe = () => void;

/**
 * Everything the app needs from an accounts backend. Firebase is the real one; the local
 * mock keeps the same rules (unique normalized emails, hashed passwords) inside this browser.
 */
export interface AccountBackend {
  readonly kind: "firebase" | "local";
  readonly supportsGoogle: boolean;
  signUp(email: string, password: string, name: string): Promise<SignedInAccount>;
  signIn(email: string, password: string): Promise<SignedInAccount>;
  signInWithGoogle(): Promise<SignedInAccount>;
  /** Uid of the authenticated account, or null. */
  currentUid(): string | null;
  /** Calls back with the authenticated uid whenever it changes (and once on subscribe). */
  onSessionChange(listener: (uid: string | null) => void): Unsubscribe;
  /** Ends the session. Never deletes the account or its profile. */
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<ResetRequestResult>;
  /** Email the reset code belongs to; throws invalid-reset-code when expired or used. */
  verifyResetCode(code: string): Promise<string>;
  confirmPasswordReset(code: string, newPassword: string): Promise<void>;
  loadProfile(uid: string): Promise<Student | null>;
  /** Saves the private profile and publishes the privacy-safe classmate card. */
  saveProfile(student: Student): Promise<void>;
  /** Classmate cards of every account with a finished profile, live. */
  subscribeClassmates(listener: (cards: Student[]) => void, onError: (error: unknown) => void): Unsubscribe;
  /** Every group membership, live. */
  subscribeGroupMembers(listener: (members: GroupMember[]) => void, onError: (error: unknown) => void): Unsubscribe;
  joinGroup(groupId: string, uid: string): Promise<void>;
  leaveGroup(groupId: string, uid: string): Promise<void>;
}
