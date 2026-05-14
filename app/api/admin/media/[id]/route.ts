/**
 * app/api/admin/media/[id]/route.ts — PATCH (retire toggle) + DELETE.
 *
 * Both verify the operator's ID token + email allow-list before
 * mutating. PATCH body: `{ retired: boolean }`. DELETE: no body.
 */

import { NextResponse } from "next/server";
import { verifyIdToken } from "lib/firebase/admin";
import {
  mediaDelete,
  mediaSetRetired,
} from "lib/capabilities/media/library";
import { MediaLibraryError } from "lib/capabilities/media/library-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN_EMAILS = new Set<string>(["dimonauk@gmail.com"]);

function extractBearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m && m[1] ? m[1].trim() : null;
}

async function authorise(
  req: Request,
): Promise<{ ok: true; uid: string } | { ok: false; response: NextResponse }> {
  const token = extractBearer(req);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing Authorization: Bearer <idToken>" },
        { status: 401 },
      ),
    };
  }
  try {
    const decoded = await verifyIdToken(token);
    if (!decoded.email || !ADMIN_EMAILS.has(decoded.email.toLowerCase())) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Not authorised for operator routes" },
          { status: 403 },
        ),
      };
    }
    return { ok: true, uid: decoded.uid };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Token verification failed";
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 401 }),
    };
  }
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof MediaLibraryError) {
    const status =
      err.code === "not-configured"
        ? 503
        : err.code === "not-authenticated"
          ? 401
          : err.code === "not-found"
            ? 404
            : 500;
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status },
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await authorise(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: { retired?: unknown };
  try {
    body = (await req.json()) as { retired?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Expected JSON body { retired: boolean }" },
      { status: 400 },
    );
  }

  if (typeof body.retired !== "boolean") {
    return NextResponse.json(
      { error: "Body must be { retired: boolean }" },
      { status: 400 },
    );
  }

  try {
    await mediaSetRetired(id, body.retired);
    return NextResponse.json({ ok: true, id, retired: body.retired });
  } catch (err) {
    console.error(`[/api/admin/media/${id}] PATCH failed:`, err);
    return errorResponse(err);
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await authorise(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await mediaDelete(id);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error(`[/api/admin/media/${id}] DELETE failed:`, err);
    return errorResponse(err);
  }
}
