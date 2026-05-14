/**
 * lib/integrations/google/admin-guard.ts — Shared bearer-token guard
 * for the /api/admin/import/* routes.
 *
 * One-line role: pull the Firebase ID token off the Authorization
 * header, verify it, and enforce the operator allow-list. Returns the
 * uid on success; throws a typed error on failure that callers can map
 * to a 401/403 JSON response.
 *
 * The allow-list mirrors `app/admin/layout.tsx` (Agent J). Move to env
 * `ADMIN_EMAILS` once there's a second operator.
 */

import "server-only";

import { verifyIdToken } from "lib/firebase/admin";

const ADMIN_EMAILS = new Set<string>(["dimonauk@gmail.com"]);

export class AdminGuardError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
    this.name = "AdminGuardError";
  }
}

function extractBearer(req: Request): string {
  const header = req.headers.get("authorization");
  if (!header) {
    throw new AdminGuardError(401, "Missing Authorization header.");
  }
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m || !m[1]) {
    throw new AdminGuardError(401, "Authorization header must be 'Bearer <idToken>'.");
  }
  return m[1].trim();
}

/** Verifies the bearer + allow-list; returns { uid, email }. */
export async function requireAdminUser(req: Request): Promise<{
  uid: string;
  email: string;
}> {
  let token: string;
  try {
    token = extractBearer(req);
  } catch (err) {
    if (err instanceof AdminGuardError) throw err;
    throw new AdminGuardError(401, "Invalid Authorization header.");
  }
  let decoded: { uid: string; email: string | undefined };
  try {
    decoded = await verifyIdToken(token);
  } catch {
    throw new AdminGuardError(401, "Could not verify Firebase ID token.");
  }
  const email = decoded.email?.toLowerCase() ?? "";
  if (!email || !ADMIN_EMAILS.has(email)) {
    throw new AdminGuardError(
      403,
      `Account ${decoded.email ?? "(no email)"} is not on the operator allow-list.`,
    );
  }
  return { uid: decoded.uid, email };
}

/** Map an AdminGuardError to a JSON-Response body. */
export function adminGuardErrorBody(err: AdminGuardError): {
  status: number;
  body: { error: string };
} {
  return { status: err.status, body: { error: err.message } };
}
