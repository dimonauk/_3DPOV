/**
 * app/api/splat-pro/scout/route.ts — Scout for the website.
 *
 * Two paths:
 *   1. If the bench is reachable, hand `source_path` to the desktop
 *      sidecar — gets the full OpenCV-driven report.
 *   2. Otherwise, run the metadata-only heuristic, and optionally
 *      enrich the prose with a Gemini call (BYOK via lib/capabilities/
 *      agent/dialogue — already wired for Aura).
 *
 * Body:
 *   { filename, size_bytes, mime?, camera_hint?, source_path? }
 *
 * `source_path` is only meaningful when the bench can see the file
 * (e.g. an uploaded blob on the user's own machine reachable through
 * Tailscale). Browser-only callers just send the metadata.
 */

import { NextResponse } from "next/server";

import { benchInfo, bench } from "lib/capabilities/viz/scout/bench-client";
import { scoutFromMetadata } from "lib/capabilities/viz/scout/scout-web";
import type { ScoutReport } from "lib/capabilities/viz/scout/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  filename?: string;
  size_bytes?: number;
  mime?: string;
  camera_hint?: string;
  source_path?: string;
  enrich?: boolean;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  // 1. Bench path (full analysis).
  if (body.source_path) {
    const info = await benchInfo();
    if (info.reachable) {
      try {
        const rep = await bench.scout(body.source_path, body.camera_hint);
        return NextResponse.json(rep);
      } catch (err) {
        // fall through to metadata path
        console.warn("[splat-pro/scout] bench unreachable:", err);
      }
    }
  }

  // 2. Metadata path.
  if (!body.filename || typeof body.size_bytes !== "number") {
    return NextResponse.json(
      { error: "filename and size_bytes required when source_path is absent" },
      { status: 400 },
    );
  }
  let report = scoutFromMetadata({
    filename: body.filename,
    size_bytes: body.size_bytes,
    mime: body.mime,
    camera_hint: body.camera_hint,
  });

  if (body.enrich) {
    report = await tryLlmEnrich(report);
  }

  return NextResponse.json(report);
}

export async function GET() {
  const info = await benchInfo();
  return NextResponse.json(info);
}

async function tryLlmEnrich(report: ScoutReport): Promise<ScoutReport> {
  try {
    // Reuse the existing Aura dialogue capability — already routes to
    // Gemini via the user's BYOK key.
    const { respond } = await import("lib/capabilities/agent/dialogue");
    const { aura } = await import("lib/cast/aura");
    const prompt =
      "You are an expert Gaussian Splatting capture reviewer. Given this " +
      "machine-generated report, rewrite the summary in one tight paragraph " +
      "and add ONE concrete, actionable suggestion the heuristic missed. " +
      "Return JSON: {summary: string, extra_issue: {severity,where,what,action} | null}.\n\n" +
      "REPORT:\n" +
      JSON.stringify(report, null, 2);

    const reply = await respond({
      speakerId: "aura.splat-pro-scout",
      bible: aura,
      userText: prompt,
    });
    const text = reply.text ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return report;
    const parsed = JSON.parse(m[0]) as {
      summary?: string;
      extra_issue?: ScoutReport["issues"][number];
    };
    return {
      ...report,
      summary: parsed.summary ?? report.summary,
      issues: parsed.extra_issue ? [...report.issues, parsed.extra_issue] : report.issues,
    };
  } catch (err) {
    console.warn("[splat-pro/scout] LLM enrich failed:", err);
    return report;
  }
}
