/**
 * app/api/aura/holo-walk-banter/route.ts — Penny + Marcel commenting
 * on a HoloWalk location.
 *
 * Server-side wrapper around `agent.banter`. Takes a location
 * descriptor and returns an exchange between two cast members
 * grounded in what they're looking at — the spot, the time of year,
 * the heading at capture, the sculpture's intended placement.
 *
 * Cast pair defaults to Penny (operational) + Marcel (creative) per
 * the audit's reading; caller can override via `?cast=`.
 *
 * # Cost
 * Per-call Gemini fee. Open to all visitors. Rate-limit when /holo-walk
 * gets real traffic; for now the studio eats it.
 */

import { NextResponse } from "next/server";

import { bibles, type CastMemberId } from "lib/cast";
import { respondBanter } from "lib/capabilities/agent/banter";
import { getLocation } from "lib/holo-walk/locations";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const DEFAULT_CAST: CastMemberId[] = ["penny", "marcel"];

const KNOWN_CAST = new Set<CastMemberId>([
  "aura",
  "penny",
  "marcel",
  "betsy",
  "trixie",
  "baby",
  "scribe",
  "millie",
  "tim",
  "excavation-bot",
]);

function parseCast(raw: string | null): CastMemberId[] {
  if (!raw) return DEFAULT_CAST;
  const ids = raw
    .split(",")
    .map((s) => s.trim() as CastMemberId)
    .filter((id) => KNOWN_CAST.has(id));
  return ids.length > 0 ? ids : DEFAULT_CAST;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected application/json body" },
      { status: 400 },
    );
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "body must be a JSON object" },
      { status: 400 },
    );
  }
  const obj = body as Record<string, unknown>;
  const locationId =
    typeof obj["locationId"] === "string" ? obj["locationId"] : "";
  if (!locationId) {
    return NextResponse.json(
      { error: "locationId is required" },
      { status: 400 },
    );
  }
  const loc = getLocation(locationId);
  if (!loc) {
    return NextResponse.json(
      { error: `unknown location: ${locationId}` },
      { status: 404 },
    );
  }

  const cast =
    typeof obj["cast"] === "string"
      ? parseCast(obj["cast"])
      : Array.isArray(obj["cast"])
        ? parseCast(obj["cast"].join(","))
        : DEFAULT_CAST;

  // Squeeze location + scene state into the banter's free-text
  // `lastEvent` field. Banter's prompt construction treats this as
  // "what just happened" — we use it as "what you're looking at".
  const lastEvent = [
    `You're both standing at ${loc.name} in ${loc.city}.`,
    `The original photograph was taken on ${loc.captureDate}, facing ${loc.headingAtCapture}°.`,
    `The sculpture here is a ${loc.sculpture.kind}-type piece.`,
    loc.narrationScript
      ? `Aura's narration note for the spot: "${loc.narrationScript}".`
      : null,
    "Comment briefly. Light banter, two short turns each at most. Stay in voice.",
  ]
    .filter((s): s is string => Boolean(s))
    .join(" ");

  try {
    const result = await respondBanter(
      {
        activeSpeakers: cast,
        telemetry: {
          chronoMode: "amber",
          phase: "hub",
          tickMs: 30_000,
        },
        lastEvent,
      },
      bibles,
    );
    return NextResponse.json({
      turns: result.turns,
      tickMs: result.tickMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `banter failed: ${message}` },
      { status: 502 },
    );
  }
}
