/**
 * POST /api/admin/people-finder — Batch-run Maigret for usernames.
 *
 * Body: `{ usernames: string[] }`.
 * Response: `{ runs: MaigretRun[] }`.
 *
 * Admin-gated by Firebase auth. Runs Maigret server-side (against the
 * local Python venv at D:/Tools/osint/.venv) for each username,
 * returns the parsed hits per platform.
 *
 * The operator pastes a list of names / handles, gets back the
 * verified platform hits, and approves which ones land in the
 * rolodex sources file or the private rolodex.
 */

import { NextResponse, type NextRequest } from "next/server";

import { isAdminEmail } from "lib/auth/admin-emails";
import { verifyIdToken } from "lib/firebase/admin";
import { runMaigret, type MaigretRun } from "lib/admin/maigret";
import { errToObject, withRouteLogging } from "lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_BATCH = 20;

async function assertAdmin(req: NextRequest, log: { warn: (msg: string, ctx?: object) => void }): Promise<void> {
  const auth = req.headers.get("authorization") ?? "";
  const idToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!idToken) {
    log.warn("auth:missing");
    throw new Error("unauthenticated");
  }
  const claims = await verifyIdToken(idToken);
  if (!isAdminEmail(claims.email)) {
    log.warn("auth:not_admin", { email: claims.email });
    throw new Error("not_admin");
  }
}

export const POST = withRouteLogging(
  "admin.people-finder",
  async (req: NextRequest, _ctx, log) => {
    try {
      await assertAdmin(req, log);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    let body: { usernames?: unknown };
    try {
      body = (await req.json()) as { usernames?: unknown };
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const usernames = Array.isArray(body.usernames)
      ? body.usernames
          .map((u) => (typeof u === "string" ? u.trim().replace(/^@/, "") : ""))
          .filter((u) => u.length > 0)
      : [];

    if (usernames.length === 0) {
      return NextResponse.json(
        { error: "usernames required" },
        { status: 400 },
      );
    }
    if (usernames.length > MAX_BATCH) {
      return NextResponse.json(
        { error: `max ${MAX_BATCH} usernames per batch` },
        { status: 400 },
      );
    }

    const runs: MaigretRun[] = [];
    for (const username of usernames) {
      try {
        const run = await runMaigret(username);
        runs.push(run);
      } catch (err) {
        runs.push({
          username,
          hits: [],
          errors: [err instanceof Error ? err.message : String(err)],
        });
        log.warn("maigret:failed", { username, err: errToObject(err) });
      }
    }

    return NextResponse.json({ ok: true, runs });
  },
);
