/**
 * lib/firebase/admin.ts — Server-side Firebase Admin SDK initialisation.
 *
 * One-line role: the credential plumbing that lets server code write to
 * Firestore + verify Auth tokens, separate from the public Firebase
 * client config (which lives in `./client.ts`).
 *
 * # Configuration
 * Reads `FIREBASE_ADMIN_SERVICE_ACCOUNT` as a JSON-encoded service-
 * account key from Vercel env (one variable, not split across three).
 * Project ID is inferred from the service account; no extra env needed.
 *
 * # Posture
 * Lazy + tolerant: when the env var isn't set, the helpers return
 * `null` rather than throwing, so a local dev without admin creds can
 * still build and render public pages. Server code that genuinely
 * needs admin (e.g. `/admin/upload`) calls `requireFirebaseAdmin()`
 * which throws with a helpful error.
 */

import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage, type Storage } from "firebase-admin/storage";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;
let _adminStorage: Storage | null = null;

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
}

/**
 * Escape unescaped control characters that appear INSIDE JSON string
 * literals. Vercel's env-var UI accepts literal multiline pastes, so
 * a service-account JSON pasted as-is from a downloaded keyfile has
 * real CR/LF inside the private_key value — which is invalid JSON.
 *
 * Walks the string char-by-char tracking string boundaries and
 * backslash escapes; escapes only the characters that need it. Safe
 * even on already-valid JSON.
 */
function fixMultilineJson(raw: string): string {
  let result = "";
  let inString = false;
  let escapeNext = false;
  for (const ch of raw) {
    if (escapeNext) {
      result += ch;
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      result += ch;
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      result += ch;
      inString = !inString;
      continue;
    }
    if (inString) {
      if (ch === "\n") {
        result += "\\n";
        continue;
      }
      if (ch === "\r") {
        result += "\\r";
        continue;
      }
      if (ch === "\t") {
        result += "\\t";
        continue;
      }
    }
    result += ch;
  }
  return result;
}

function loadCredential(): { projectId: string; clientEmail: string; privateKey: string } | null {
  let raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (!raw) return null;
  // UTF-8 BOM strip — Vercel's UI sometimes prepends one when pasting
  // a downloaded JSON keyfile from Notepad/VSCode-encoded-with-BOM.
  // JSON.parse rejects it with "Unexpected token '﻿'".
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  raw = raw.trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Fallback: handle literal newlines pasted inside private_key.
    try {
      parsed = JSON.parse(fixMultilineJson(raw)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  const projectId = typeof parsed["project_id"] === "string" ? parsed["project_id"] : "";
  const clientEmail = typeof parsed["client_email"] === "string" ? parsed["client_email"] : "";
  // Vercel multiline env: \n may be literal in the stored string.
  const privateKeyRaw = typeof parsed["private_key"] === "string" ? parsed["private_key"] : "";
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export function getFirebaseAdminApp(): App | null {
  if (_adminApp) return _adminApp;
  const creds = loadCredential();
  if (!creds) return null;
  _adminApp = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: creds.projectId,
          clientEmail: creds.clientEmail,
          privateKey: creds.privateKey,
        }),
        projectId: creds.projectId,
      });
  return _adminApp;
}

export function getFirebaseAdminAuth(): Auth | null {
  if (_adminAuth) return _adminAuth;
  const app = getFirebaseAdminApp();
  if (!app) return null;
  _adminAuth = getAuth(app);
  return _adminAuth;
}

export function getFirebaseAdminDb(): Firestore | null {
  if (_adminDb) return _adminDb;
  const app = getFirebaseAdminApp();
  if (!app) return null;
  _adminDb = getFirestore(app);
  return _adminDb;
}

export function getFirebaseAdminStorage(): Storage | null {
  if (_adminStorage) return _adminStorage;
  const app = getFirebaseAdminApp();
  if (!app) return null;
  _adminStorage = getStorage(app);
  return _adminStorage;
}

/** Throws when admin creds aren't configured; useful in API routes that
 *  cannot proceed without them. */
export function requireFirebaseAdminDb(): Firestore {
  const db = getFirebaseAdminDb();
  if (!db) {
    throw new Error(
      "firebase-admin: FIREBASE_ADMIN_SERVICE_ACCOUNT env not set. " +
        "Set the JSON service-account key in Vercel project env (Production + Preview + Development).",
    );
  }
  return db;
}

export function requireFirebaseAdminAuth(): Auth {
  const auth = getFirebaseAdminAuth();
  if (!auth) {
    throw new Error(
      "firebase-admin: FIREBASE_ADMIN_SERVICE_ACCOUNT env not set. " +
        "Set the JSON service-account key in Vercel project env (Production + Preview + Development).",
    );
  }
  return auth;
}

/**
 * Verify a Firebase ID token. Returns the decoded claims (uid + email).
 * Throws when the token is invalid or admin isn't configured.
 *
 * In API routes, call this with the `Authorization: Bearer <idToken>`
 * header value (stripped of the `Bearer ` prefix).
 */
export async function verifyIdToken(idToken: string): Promise<{
  uid: string;
  email: string | undefined;
}> {
  const auth = requireFirebaseAdminAuth();
  const decoded = await auth.verifyIdToken(idToken);
  return { uid: decoded.uid, email: decoded.email };
}
