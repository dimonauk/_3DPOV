import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type UserCredential,
  getAuth,
} from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

/**
 * Firebase client-side initialisation. Lazy + tolerant: if the env
 * vars aren't set (e.g. local dev without .env.local) the exports
 * return null and consumers degrade gracefully rather than the build
 * exploding.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (_app) return _app;
  _app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: config.apiKey!,
        authDomain: config.authDomain!,
        projectId: config.projectId!,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId!,
      });
  return _app;
}

export function getFirebaseAuth(): Auth | null {
  if (_auth) return _auth;
  const app = getFirebaseApp();
  if (!app) return null;
  _auth = getAuth(app);
  return _auth;
}

export function getFirebaseDb(): Firestore | null {
  if (_db) return _db;
  const app = getFirebaseApp();
  if (!app) return null;
  _db = getFirestore(app);
  return _db;
}

/**
 * Build a fresh GoogleAuthProvider on each call. The provider object is
 * not reusable across sign-in calls — Firebase mutates internal state on
 * it during the popup flow. Configure the scopes / prompt behaviour here
 * if the studio ever wants to nudge Google's chooser.
 */
export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // Force the chooser every time so users with multiple Google accounts
  // can pick the right one. They will thank you.
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

/**
 * Pop a Google sign-in window. Returns the resolved UserCredential, or
 * null if Firebase isn't configured (e.g. local dev without .env.local).
 * Throws on actual auth errors so the caller can surface them.
 */
export async function signInWithGoogle(): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return signInWithPopup(auth, getGoogleProvider());
}
