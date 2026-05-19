/**
 * /api/admin/watchers/install-ack — Mark an install suggestion as
 * handled. Operator-only.
 *
 * The operator's actual install happens locally with `pnpm add <pkg>`
 * — this route just hides the suggestion from the queue once the
 * operator has acted on it. Vercel's runtime filesystem is read-only
 * so we can't shell out to pnpm here.
 */
import { NextResponse, type NextRequest } from "next/server";

import { isAdminEmail } from "lib/auth/admin-emails";
import { verifyIdToken } from "lib/firebase/admin";
import { ackSuggestion } from "lib/watchers/install-queue";

export const dynamic = "force-dynamic";

async function isOperator(req: NextRequest): Promise<boolean> {
  const header = req.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return false;
  const token = header.slice(7).trim();
  if (!token) return false;
  try {
    const decoded = await verifyIdToken(token);
    return isAdminEmail(decoded?.email ?? null);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isOperator(req))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  let body: { id?: string };
  try {
    body = (await req.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }
  await ackSuggestion(body.id);
  return NextResponse.json({ ok: true });
}
