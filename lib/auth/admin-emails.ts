/**
 * lib/auth/admin-emails.ts — Single source of truth for the operator
 * allow-list.
 *
 * One-line role: parse the `ADMIN_EMAILS` env var (comma-separated)
 * into a normalised Set, with a hardcoded fallback so the studio's
 * solo-operator default keeps working when the env var isn't set.
 *
 * # Why this exists
 *
 * The allow-list was duplicated in four places before this helper —
 * `app/admin/layout.tsx`, `app/api/admin/media/upload/route.ts`,
 * `app/api/admin/media/[id]/route.ts`, `app/api/viz/splat-generate/route.ts`,
 * and `lib/integrations/google/admin-guard.ts`. A second operator means
 * five edits with copy-paste drift risk. One env var, one helper, done.
 *
 * # Behaviour
 *
 *   - `ADMIN_EMAILS="alice@example.com,bob@example.com"` → both allowed
 *   - `ADMIN_EMAILS=""` (unset) → falls back to DEFAULT_ADMIN_EMAILS
 *   - Comparison is case-insensitive (Set holds lowercased)
 *   - Whitespace around each entry is trimmed
 *   - Empty entries (`,,`) are ignored
 *
 * # Caching
 *
 * The parsed Set is cached per-process. Env changes don't hot-reload —
 * restart the server to pick up a new ADMIN_EMAILS value. Tests can
 * call `resetAdminEmailsCache()` to clear between cases.
 */

/**
 * Hardcoded fallback. Mirrors the historic allow-list. When the studio
 * adds a second operator the right move is to set ADMIN_EMAILS, not
 * extend this constant — operator changes shouldn't require a code
 * deploy.
 */
const DEFAULT_ADMIN_EMAILS: readonly string[] = ["dimonauk@gmail.com"];

let cached: ReadonlySet<string> | null = null;

function parseEnv(): ReadonlySet<string> {
  // Server routes read ADMIN_EMAILS; the client-side admin layout
  // ("use client") can't see ADMIN_EMAILS because Next only inlines
  // NEXT_PUBLIC_* vars into the bundle. Accept both so the client UI
  // gate stays in sync with the server enforcement when operators set
  // either. The email list isn't a secret (Firestore Rules and the
  // server bearer-token gates are the real enforcement), so exposing
  // it via NEXT_PUBLIC_* is safe.
  const raw =
    process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (!raw || raw.trim().length === 0) {
    return new Set(DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()));
  }
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
  // If the env var was set but parsed to an empty list (e.g.
  // ADMIN_EMAILS=" , , "), fall back to the default rather than
  // locking everyone out.
  return new Set(
    emails.length > 0
      ? emails
      : DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()),
  );
}

/** Returns the active allow-list. Cached per process. */
export function getAdminEmails(): ReadonlySet<string> {
  if (!cached) cached = parseEnv();
  return cached;
}

/** True if the email (case-insensitive) is on the operator allow-list. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.toLowerCase());
}

/** Test hook: clear the cached allow-list. Production code should never
 *  call this — env changes require a server restart by design. */
export function resetAdminEmailsCache(): void {
  cached = null;
}
