import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { type Firestore, getFirestore, initializeFirestore } from "firebase/firestore";

// Firebase web config is public by design: it identifies the project, it does not grant access.
// Access to data is controlled by the rules in firestore.rules.
const firebaseConfig = {
  apiKey: "AIzaSyAszBVdVFIoMnUHKNBN5iGy6BaE99e6WfQ",
  authDomain: "ramhub.firebaseapp.com",
  projectId: "ramhub",
  storageBucket: "ramhub.firebasestorage.app",
  messagingSenderId: "408899492853",
  appId: "1:408899492853:web:97f9d62b98e6e1b9441ebc",
  measurementId: "G-L5TYRQKX78",
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Optional Student fields can be undefined, which Firestore rejects unless told to skip them.
export const db: Firestore = isFirstInit
  ? initializeFirestore(app, { ignoreUndefinedProperties: true })
  : getFirestore(app);
