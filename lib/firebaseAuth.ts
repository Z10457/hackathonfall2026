import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, setDoc } from "firebase/firestore";
import { initialsOf } from "./constants";
import { auth, db } from "./firebase";
import type { Student } from "./types";

/** Google sign-in with any Google account. */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function createAccountWithEmail(email: string, password: string, name: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) await updateProfile(result.user, { displayName: name.trim() });
  return result.user;
}

/** The saved profile for this account, or null if they have not finished onboarding. */
export async function loadProfile(uid: string): Promise<Student | null> {
  const snapshot = await getDoc(doc(db, "students", uid));
  if (!snapshot.exists()) return null;
  const student = snapshot.data() as Student;
  return { ...student, id: uid };
}

export async function saveProfile(student: Student): Promise<void> {
  await setDoc(doc(db, "students", student.id), student, { merge: true });
  await publishClassmateCard(student);
}

/**
 * The public, privacy-safe version of a profile that other signed-in students can read for
 * classmate matching. Name and town are only included when the student opted in.
 */
export function classmateCardOf(student: Student): Student {
  return {
    id: student.id,
    name: student.shareProfile ? student.name : initialsOf(student.name),
    campus: student.campus,
    homeRegion: student.homeRegion,
    homeArea: student.shareProfile ? student.homeArea : "",
    arrivalTime: student.arrivalTime,
    courses: student.courses,
    shareProfile: student.shareProfile,
  };
}

export async function publishClassmateCard(student: Student): Promise<void> {
  await setDoc(doc(db, "classmates", student.id), classmateCardOf(student));
}

const MAX_CLASSMATES = 500;

/** Every published classmate card (other real Ram Hub students). */
export async function loadClassmateCards(): Promise<Student[]> {
  const snapshot = await getDocs(query(collection(db, "classmates"), limit(MAX_CLASSMATES)));
  return snapshot.docs.map((d) => ({ ...(d.data() as Student), id: d.id }));
}

/** Demo and pre-Firebase profiles live only in this browser and are never synced. */
export function isLocalOnlyStudent(student: Student): boolean {
  return student.id.startsWith("demo-") || student.id.startsWith("stu-");
}

/** Turns Firebase error codes into sentences a student can act on. */
export function authErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address does not look right.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect. New here? Choose Create account.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Choose Sign in instead.";
    case "auth/weak-password":
    case "auth/password-does-not-meet-requirements":
      return "Use a password with at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The Google window was closed before sign-in finished.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google window. Allow pop-ups for this site and try again.";
    case "auth/unauthorized-domain":
      return "This web address is not allowed to sign in yet. Add it under Authentication > Settings > Authorized domains in Firebase.";
    case "auth/operation-not-allowed":
      return "This sign-in method is turned off. Enable it under Authentication > Sign-in method in Firebase.";
    case "auth/network-request-failed":
    case "unavailable":
      return "Could not reach the server. Check your connection and try again.";
    case "permission-denied":
      return "Your profile could not be read or saved. Check the Firestore security rules.";
    default:
      return error instanceof Error ? error.message : "Something went wrong. Please try again.";
  }
}
