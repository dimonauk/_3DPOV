/**
 * GET /api/discord/invite-url — read-only endpoint returning the
 * configured guild invite URL.
 *
 * Why a route instead of hard-coding the URL in the bundle: the studio
 * may rotate the invite URL (e.g. if the current invite gets shared on
 * a botted Reddit thread) without needing a redeploy. The env var is
 * the single source of truth.
 */

import { NextResponse } from "next/server";

import { studioInviteUrl } from "lib/discord/role-map";

export const dynamic = "force-dynamic";

export function GET(): Response {
  const url = studioInviteUrl();
  if (!url) {
    return NextResponse.json({}, { status: 200 });
  }
  return NextResponse.json({ url });
}
