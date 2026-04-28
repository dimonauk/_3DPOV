import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
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
