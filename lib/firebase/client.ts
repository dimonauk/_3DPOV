import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";
import {
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type UserCredential,
  getAuth,
} from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

import { createLogger } from "lib/log";

const log = createLogger("service:firebase");

/**
 * Firebase client-side initialisation. Lazy + tolerant: if the env
 * vars aren't set (e.g. local dev without .env.local) the exports
 * return null and consumers degrade gracefully rather than the build
 * exploding.
 *
 * # App Check
 * When NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY is set, App Check is
 * initialised with reCAPTCHA Enterprise once per session. This makes
 * Firestore + Auth refuse requests that didn't pass the reCAPTCHA
 * challenge (drive-by abuse with stolen keys becomes useless).
 *
 * Localhost development uses the debug-token bypass, but ONLY when
 * NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN is also set (to a token
 * registered in Firebase Console → App Check → Apps → Debug tokens).
 * Without that variable we skip App Check entirely in dev — otherwise
 * the SDK generates a fresh unregistered token on every page load,
 * tries to exchange it, and the exchange returns 403, drowning every
 * other console message in noise.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const recaptchaSiteKey = process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY;

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _appCheck: AppCheck | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

/**
 * Initialise Firebase App Check with reCAPTCHA Enterprise. Idempotent
 * (only runs once per session); silently skips when the site key isn't
 * configured, when running server-side, or when App Check has already
 * been initialised.
 *
 * Localhost development needs the debug-token bypass — set it before
 * the SDK auto-detects the deployment surface. Open the browser
 * console after a refresh and Firebase logs a one-time debug token
 * you paste into the Firebase Console → App Check → Apps tab to
 * whitelist your machine.
 */
function initAppCheck(app: FirebaseApp): void {
  if (_appCheck) return;
  if (!recaptchaSiteKey) return;
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
    // Without a registered debug token, the SDK would mint a fresh token,
    // try to exchange it, and 403 on every page load. Skip init entirely.
    if (!debugToken) return;
    // The debug-token flag must be set before initializeAppCheck.
    // See https://firebase.google.com/docs/app-check/web/debug-provider
    (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string }).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  try {
    _appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    // Safe to swallow: App Check init failure should never block the
    // auth/firestore code paths. Surfaces in dev console for debugging.
    log.warn("App Check init failed; continuing without it", {
      err: err instanceof Error ? err.message : String(err),
    });
  }
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
  initAppCheck(_app);
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
