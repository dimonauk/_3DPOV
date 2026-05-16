/**
 * lib/firebase/admin.ts — Server-side Firebase Admin SDK initialisation.
 *
 * One-line role: the credential plumbing that lets server code write to
 * Firestore + verify Auth tokens, separate from the public Firebase
 * client config (which lives in `./client.ts`).
 *
 * # Two configuration paths
 *
 * 1. **JSON service-account key (legacy).** Set
 *    `FIREBASE_ADMIN_SERVICE_ACCOUNT` to the JSON-encoded
 *    service-account key in Vercel env. Project ID is read from the
 *    JSON. Long-lived secret in env; rotate periodically.
 *
 * 2. **Application Default Credentials / Workload Identity Federation.**
 *    Set `GOOGLE_APPLICATION_CREDENTIALS` (Vercel's Google Cloud
 *    integration writes a WIF config file at deploy + sets this env
 *    automatically). No long-lived secret in Vercel env; each function
 *    invocation exchanges a short-lived Vercel OIDC token for a
 *    GCP credential via Workload Identity Federation. Add
 *    `FIREBASE_ADMIN_PROJECT_ID` for the project id (ADC creds don't
 *    always carry one).
 *
 * Path 1 takes precedence when both are set — useful for incident
 * recovery when you want a known-good service-account JSON to override
 * a misconfigured WIF pool.
 *
 * # Posture
 * Lazy + tolerant: when neither path is configured, the helpers return
 * `null` rather than throwing, so a local dev without admin creds can
 * still build and render public pages. Server code that genuinely
 * needs admin (e.g. `/admin/upload`) calls `requireFirebaseAdmin()`
 * which throws with a helpful error.
 */

import "server-only";

import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

export function isFirebaseAdminConfigured(): boolean {
  return (
    Boolean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) ||
    Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}

function loadCredential(): { projectId: string; clientEmail: string; privateKey: string } | null {
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (!raw) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  const projectId = typeof parsed["project_id"] === "string" ? parsed["project_id"] : "";
  const clientEmail = typeof parsed["client_email"] === "string" ? parsed["client_email"] : "";
  // Vercel multiline env: \n may be literal in the stored string.
  const privateKeyRaw = typeof parsed["private_key"] === "string" ? parsed["private_key"] : "";
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

/**
 * Look up the project id from any of the conventional env vars when
 * we don't have it in the JSON credential. Order:
 *
 *   1. FIREBASE_ADMIN_PROJECT_ID — explicit; the canonical knob.
 *   2. GOOGLE_CLOUD_PROJECT — gcloud-style.
 *   3. GCP_PROJECT — older convention.
 *   4. GCLOUD_PROJECT — older convention.
 *
 * Returns null when nothing's set, which causes Firebase Admin's
 * initialise call to fail with its own helpful error.
 */
function adcProjectId(): string | null {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCP_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    null
  );
}

export function getFirebaseAdminApp(): App | null {
  if (_adminApp) return _adminApp;

  // Path 1: JSON service-account key. Takes precedence so an operator
  // can override a broken WIF setup by pasting a key into env.
  const creds = loadCredential();
  if (creds) {
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

  // Path 2: Application Default Credentials (Workload Identity
  // Federation via Vercel's Google Cloud integration, gcloud auth on
  // local dev, GCE metadata server in other Google environments).
  // The presence of GOOGLE_APPLICATION_CREDENTIALS is the trigger.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const projectId = adcProjectId();
    _adminApp = getApps().length
      ? getApp()
      : initializeApp({
          credential: applicationDefault(),
          ...(projectId ? { projectId } : {}),
        });
    return _adminApp;
  }

  return null;
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

/** Throws when admin creds aren't configured; useful in API routes that
 *  cannot proceed without them. */
export function requireFirebaseAdminDb(): Firestore {
  const db = getFirebaseAdminDb();
  if (!db) {
    throw new Error(
      "firebase-admin: no credential path configured. Either set " +
        "FIREBASE_ADMIN_SERVICE_ACCOUNT (JSON service-account key) or " +
        "GOOGLE_APPLICATION_CREDENTIALS + FIREBASE_ADMIN_PROJECT_ID " +
        "(Workload Identity Federation via Vercel's Google Cloud " +
        "integration) in the Vercel project env.",
    );
  }
  return db;
}

export function requireFirebaseAdminAuth(): Auth {
  const auth = getFirebaseAdminAuth();
  if (!auth) {
    throw new Error(
      "firebase-admin: no credential path configured. Either set " +
        "FIREBASE_ADMIN_SERVICE_ACCOUNT (JSON service-account key) or " +
        "GOOGLE_APPLICATION_CREDENTIALS + FIREBASE_ADMIN_PROJECT_ID " +
        "(Workload Identity Federation via Vercel's Google Cloud " +
        "integration) in the Vercel project env.",
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
