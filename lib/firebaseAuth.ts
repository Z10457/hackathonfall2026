import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const isFordhamAccount =
    user.emailVerified &&
    user.email?.toLowerCase().endsWith("@fordham.edu");

  if (!isFordhamAccount) {
    await signOut(auth);
    throw new Error("Please use your Fordham Google account.");
  }

  return user;
}