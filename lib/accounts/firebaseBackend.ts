import {
  confirmPasswordReset as firebaseConfirmReset,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  verifyPasswordResetCode,
  type User,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, limit, onSnapshot, query, serverTimestamp, setDoc } from "firebase/firestore";
import { isFordhamEmail, normalizeEmail } from "../constants";
import { auth, db } from "../firebase";
import type { Student } from "../types";
import {
  classmateCardOf,
  dedupeById,
  dedupeMembers,
  groupMemberDocId,
  requireFordhamEmail,
  requireStrongPassword,
} from "./shared";
import { AccountError, type AccountBackend, type AccountErrorCode, type GroupMember, type SignedInAccount } from "./types";

const MAX_CLASSMATES = 500;
const MAX_MEMBERSHIPS = 2000;

const FIREBASE_CODES: Record<string, AccountErrorCode> = {
  "auth/invalid-email": "invalid-email",
  "auth/email-already-in-use": "email-exists",
  "auth/invalid-credential": "invalid-credentials",
  "auth/wrong-password": "invalid-credentials",
  "auth/user-not-found": "invalid-credentials",
  "auth/invalid-login-credentials": "invalid-credentials",
  "auth/weak-password": "weak-password",
  "auth/password-does-not-meet-requirements": "weak-password",
  "auth/too-many-requests": "too-many-requests",
  "auth/popup-closed-by-user": "popup-closed",
  "auth/cancelled-popup-request": "popup-closed",
  "auth/popup-blocked": "popup-blocked",
  "auth/unauthorized-domain": "unauthorized-domain",
  "auth/operation-not-allowed": "operation-not-allowed",
  "auth/network-request-failed": "network",
  "auth/expired-action-code": "invalid-reset-code",
  "auth/invalid-action-code": "invalid-reset-code",
  unavailable: "network",
  "permission-denied": "permission-denied",
};

function toAccountError(error: unknown): AccountError {
  if (error instanceof AccountError) return error;
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  return new AccountError(FIREBASE_CODES[code] ?? "unknown", error instanceof Error ? error.message : undefined);
}

async function guard<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    throw toAccountError(error);
  }
}

function accountOf(user: User): SignedInAccount {
  return { uid: user.uid, email: normalizeEmail(user.email ?? ""), displayName: user.displayName };
}

function resetLinkSettings(): { url: string; handleCodeInApp: boolean } | undefined {
  if (typeof window === "undefined") return undefined;
  return { url: `${window.location.origin}/reset-password`, handleCodeInApp: false };
}

export const firebaseBackend: AccountBackend = {
  kind: "firebase",
  supportsGoogle: true,

  signUp: (rawEmail, password, name) =>
    guard(async () => {
      const email = requireFordhamEmail(rawEmail);
      requireStrongPassword(password);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) await updateProfile(result.user, { displayName: name.trim() });
      return accountOf(result.user);
    }),

  signIn: (rawEmail, password) =>
    guard(async () => {
      // Existing accounts can always sign in; the @fordham.edu rule applies to new accounts.
      const result = await signInWithEmailAndPassword(auth, normalizeEmail(rawEmail), password);
      return accountOf(result.user);
    }),

  signInWithGoogle: () =>
    guard(async () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account", hd: "fordham.edu" });
      const result = await signInWithPopup(auth, provider);
      const isNew = getAdditionalUserInfo(result)?.isNewUser ?? false;
      if (isNew && !isFordhamEmail(result.user.email ?? "")) {
        // Never keep a new non-Fordham account around.
        await result.user.delete().catch(() => firebaseSignOut(auth));
        throw new AccountError("not-fordham");
      }
      return accountOf(result.user);
    }),

  currentUid: () => auth.currentUser?.uid ?? null,

  onSessionChange: (listener) => onAuthStateChanged(auth, (user) => listener(user?.uid ?? null)),

  signOut: () => guard(() => firebaseSignOut(auth)),

  requestPasswordReset: (rawEmail) =>
    guard(async () => {
      const email = normalizeEmail(rawEmail);
      try {
        await sendPasswordResetEmail(auth, email, resetLinkSettings());
      } catch (error) {
        const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
        if (code === "auth/user-not-found") return { kind: "email-sent" as const };
        // Domain not on the Firebase allow list: send the default Firebase reset link instead.
        if (code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
          await sendPasswordResetEmail(auth, email);
        } else {
          throw error;
        }
      }
      return { kind: "email-sent" as const };
    }),

  verifyResetCode: (code) => guard(() => verifyPasswordResetCode(auth, code)),

  confirmPasswordReset: (code, newPassword) =>
    guard(async () => {
      requireStrongPassword(newPassword);
      await firebaseConfirmReset(auth, code, newPassword);
    }),

  loadProfile: (uid) =>
    guard(async () => {
      const snapshot = await getDoc(doc(db, "students", uid));
      if (!snapshot.exists()) return null;
      const student = snapshot.data() as Student;
      return { ...student, id: uid, email: student.email ? normalizeEmail(student.email) : student.email };
    }),

  saveProfile: (student) =>
    guard(async () => {
      const clean: Student = { ...student, email: student.email ? normalizeEmail(student.email) : student.email };
      await setDoc(doc(db, "students", clean.id), clean, { merge: true });
      try {
        await setDoc(doc(db, "classmates", clean.id), classmateCardOf(clean));
      } catch {
        // The public card needs the "classmates" rule in firestore.rules to be published. Until it
        // is, the profile still saves and the student can use the app; they are just not listed.
      }
    }),

  subscribeClassmates: (listener, onError) =>
    onSnapshot(
      query(collection(db, "classmates"), limit(MAX_CLASSMATES)),
      (snapshot) => listener(dedupeById(snapshot.docs.map((d) => ({ ...(d.data() as Student), id: d.id })))),
      (error) => onError(toAccountError(error)),
    ),

  subscribeGroupMembers: (listener, onError) =>
    onSnapshot(
      query(collection(db, "groupMembers"), limit(MAX_MEMBERSHIPS)),
      (snapshot) =>
        listener(
          dedupeMembers(
            snapshot.docs
              .map((d) => d.data() as Partial<GroupMember>)
              .filter((m): m is GroupMember => typeof m.groupId === "string" && typeof m.uid === "string"),
          ),
        ),
      (error) => onError(toAccountError(error)),
    ),

  joinGroup: (groupId, uid) =>
    guard(() =>
      // Deterministic document id: joining twice overwrites the same record, never duplicates it.
      setDoc(doc(db, "groupMembers", groupMemberDocId(groupId, uid)), { groupId, uid, joinedAt: serverTimestamp() }),
    ),

  leaveGroup: (groupId, uid) => guard(() => deleteDoc(doc(db, "groupMembers", groupMemberDocId(groupId, uid)))),
};
