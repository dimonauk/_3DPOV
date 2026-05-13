import { NextResponse } from "next/server";

import { isZoneSlug, type ZoneSlug } from "lib/chrono-protocol/zones";

/**
 * Chrono-Protocol leaderboard.
 *
 * GET /api/chrono-protocol/leaderboard?zone=[slug]&limit=10
 *   Returns: { ok: true, zone, entries: LeaderboardEntry[] }
 *
 * v0.1: stub. Returns three fake entries from "anonymous" players so
 * the HUB and zone-briefing pages can render the column. The
 * Firestore-backed wave (Wave 8) queries
 * /chrono_protocol_scores/{zone}/runs ordered by score desc, joins
 * against /users for display names, and returns the top N.
 */

export const dynamic = "force-dynamic";

type LeaderboardEntry = {
  rank: number;
  displayName: string;
  uid: string | null;
  score: number;
  /** ISO 8601 timestamp. */
  at: string;
};

function adminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
}

function stubEntriesFor(zone: ZoneSlug): LeaderboardEntry[] {
  // Deterministic synthetic data; the runner UI can render a column
  // even before the real backend lands.
  const base = {
    "leake-st-arches": 4200,
    "royal-mile": 9800,
    "soho-grid": 18600,
  }[zone];
  return [
    {
      rank: 1,
      displayName: "anonymous-1",
      uid: null,
      score: base,
      at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      rank: 2,
      displayName: "anonymous-2",
      uid: null,
      score: Math.floor(base * 0.82),
      at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      rank: 3,
      displayName: "anonymous-3",
      uid: null,
      score: Math.floor(base * 0.67),
      at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    },
  ];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const zoneRaw = url.searchParams.get("zone");
  const limitRaw = url.searchParams.get("limit");

  if (!zoneRaw || !isZoneSlug(zoneRaw)) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid zone slug. Expected one of leake-st-arches | royal-mile | soho-grid.",
      },
      { status: 400 },
    );
  }
  const limit = limitRaw ? Math.max(1, Math.min(50, Number(limitRaw))) : 10;

  if (!adminConfigured()) {
    const entries = stubEntriesFor(zoneRaw).slice(0, limit);
    return NextResponse.json(
      {
        ok: true,
        zone: zoneRaw,
        entries,
        note: "Stub — firebase-admin not configured; returning synthetic entries.",
      },
      { status: 200 },
    );
  }

  // TODO — Wave 8 (persistence):
  //   const snap = await getFirestore()
  //     .collection(`chrono_protocol_scores/${zoneRaw}/runs`)
  //     .orderBy("score", "desc")
  //     .limit(limit)
  //     .get();
  //   const entries = await Promise.all(snap.docs.map(async (d, i) => {
  //     const data = d.data();
  //     const user = data.uid ? await loadDisplayName(data.uid) : null;
  //     return {
  //       rank: i + 1,
  //       displayName: user?.displayName ?? "anonymous",
  //       uid: data.uid ?? null,
  //       score: data.score,
  //       at: data.at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
  //     };
  //   }));
  //   return NextResponse.json({ ok: true, zone: zoneRaw, entries });
  return NextResponse.json(
    { ok: true, zone: zoneRaw, entries: stubEntriesFor(zoneRaw).slice(0, limit) },
    { status: 200 },
  );
}
