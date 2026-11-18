import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAszBVdVFIoMnUHKNBN5iGy6BaE99e6WfQ",
  authDomain: "ramhub.firebaseapp.com",
  projectId: "ramhub",
  storageBucket: "ramhub.firebasestorage.app",
  messagingSenderId: "408899492853",
  appId: "1:408899492853:web:97f9d62b98e6e1b9441ebc",
  measurementId: "G-L5TYRQKX78"
};

const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);