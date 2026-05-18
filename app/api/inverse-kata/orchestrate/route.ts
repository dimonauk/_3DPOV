/**
 * app/api/inverse-kata/orchestrate/route.ts — Inverse-kata phase B.
 *
 * Takes the Phase A heuristic match + the source trail, asks an LLM
 * (via the Vercel AI Gateway) to refine the kata sequence with the
 * full kata library + Laban canon as context. The LLM can: confirm
 * Phase A's reading, suggest a better sequence, flag uncertain
 * segments, or propose transitions Phase A's segmentation missed.
 *
 * # Why LLM here
 *
 * Phase A is heuristic feature-matching — fast, deterministic, brittle
 * on edge cases. Phase B reasons about the trail in plain language,
 * uses the kata-notes context (what each move actually means), and
 * suggests transitions phase A's pure-geometry view can't see.
 *
 * Both phases ship together so the user can compare and judge — the
 * heuristic gives a baseline, the LLM gives an opinion.
 *
 * # Auth posture
 *
 * Open route. Uses gateway credentials (AI_GATEWAY_API_KEY) or direct
 * provider env keys. Visitor BYO key forwarded if header present.
 * Rate-limited per IP (8/hr — LLM calls are expensive).
 */

import { NextResponse } from "next/server";

import { gatewayChat, GatewayUnavailableError } from "lib/llm/gateway";
import { createLogger } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";
import { kataMoves, labanCorners } from "lib/assets/flow-arts";
import type {
  InverseKataResult,
  SegmentMatch,
  Vec2,
} from "lib/capabilities/inverse-kata/match";

const log = createLogger("api:inverse-kata-orchestrate");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------- Rate limit ----------

const HOURLY_CAP = 8;
const HOUR_MS = 60 * 60 * 1000;

// Shared limiter — in-memory by default; auto-upgrades to Upstash Redis
// when UPSTASH_REDIS_REST_URL + _TOKEN are set. LLM calls here are
// expensive (Claude Sonnet), hence the tight 8/hour cap.
const limiter = createFixedWindowLimiter({
  scope: "api.inverse-kata.orchestrate",
  limit: HOURLY_CAP,
  windowMs: HOUR_MS,
});

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

// ---------- Prompt construction ----------

function buildKataLibrarySection(): string {
  const lines = kataMoves.map(
    (m) =>
      `  - ${m.slug} ("${m.name}", ${m.labanEffort}, ~${m.durationMs}ms): ${m.notes}`,
  );
  return lines.join("\n");
}

function buildLabanSection(): string {
  const lines = labanCorners.map(
    (c) =>
      `  - ${c.name} (${c.space}/${c.weight}/${c.time}/${c.flow}): ${c.notes}`,
  );
  return lines.join("\n");
}

function summariseTrail(points: Vec2[]): string {
  if (points.length === 0) return "empty trail";
  // Bounding box + path-length rough description
  let minX = points[0]![0];
  let maxX = minX;
  let minY = points[0]![1];
  let maxY = minY;
  let pathLen = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
    if (i > 0) {
      const prev = points[i - 1]!;
      pathLen += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    }
  }
  return `${points.length} samples; bbox ${Math.round(maxX - minX)}×${Math.round(
    maxY - minY,
  )}; path length ${Math.round(pathLen)} units`;
}

function describePhaseA(result: InverseKataResult): string {
  if (result.segments.length === 0) {
    return "Phase A returned no segments.";
  }
  const lines = result.segments.map((s, i) => {
    const lc = Math.round(s.labanConfidence * 100);
    const kc = Math.round(s.kataConfidence * 100);
    return `  ${i + 1}. ${s.kata.name} (${s.labanEffort}, ~${Math.round(s.segment.durationMs)}ms) — Laban ${lc}% / Kata ${kc}%`;
  });
  return [
    `Phase A heuristic match found ${result.segments.length} segments, total ${(result.totalDurationMs / 1000).toFixed(1)}s, mean confidence ${Math.round(result.meanConfidence * 100)}%:`,
    ...lines,
  ].join("\n");
}

const SYSTEM_PROMPT = `You are an expert flow-arts choreographer reading a poi-performer's trail. You speak in plain English with technical precision.

Your job: given a hand-sketched trail (the path one poi would draw in space) plus a heuristic Phase-A match, return a refined kata sequence that the performer could physically execute to draw that trail.

KATA LIBRARY (canonical names; use these exact slugs):
{KATA_LIBRARY}

LABAN BASIC EFFORTS (the eight effort corners):
{LABAN_CANON}

Your reply MUST be a single JSON object, no markdown fences, with this shape:

{
  "sequence": [
    {
      "kataSlug": "<slug from the library>",
      "labanEffort": "<one of PRESS/GLIDE/PUNCH/SLASH/FLOAT/WRING/FLICK/DAB>",
      "durationMs": <integer milliseconds>,
      "confidence": <0.0..1.0>,
      "rationale": "<one sentence: why this kata fits this part of the trail>"
    }
  ],
  "agreementWithPhaseA": "<one of: confirms / refines / disagrees>",
  "overallReasoning": "<2-3 sentences on the whole sequence, transitions, what the performer should pay attention to>",
  "uncertainSegments": [<segment indices where confidence < 0.5, or empty array>]
}

Rules:
- Use ONLY slugs from the KATA LIBRARY above. If nothing fits, choose the closest.
- The Laban effort must match the kata's labanEffort.
- Confidence reflects how sure you are the performer would actually use that kata to draw that part of the trail.
- Be honest about uncertain segments — flagging them is more useful than guessing.
- The total durationMs across the sequence should roughly match the trail's implied total.`;

// ---------- Body parsing ----------

type Body = {
  points: Vec2[];
  timing?: number[];
  phaseAResult?: InverseKataResult;
};

function parseBody(raw: unknown): Body | { error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { error: "body must be a JSON object" };
  }
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o["points"]) || o["points"].length < 2) {
    return { error: "points must be an array of at least 2 [x,y] pairs" };
  }
  const points: Vec2[] = [];
  for (let i = 0; i < o["points"].length; i++) {
    const p = o["points"][i];
    if (!Array.isArray(p) || p.length !== 2) {
      return { error: `points[${i}] must be a [x,y] pair` };
    }
    const x = p[0];
    const y = p[1];
    if (typeof x !== "number" || typeof y !== "number") {
      return { error: `points[${i}] must be two numbers` };
    }
    points.push([x, y]);
  }
  const out: Body = { points };
  if (Array.isArray(o["timing"])) {
    out.timing = (o["timing"] as unknown[]).filter(
      (n): n is number => typeof n === "number",
    );
  }
  if (typeof o["phaseAResult"] === "object" && o["phaseAResult"] !== null) {
    out.phaseAResult = o["phaseAResult"] as InverseKataResult;
  }
  return out;
}

// ---------- Output shape ----------

type OrchestratedSegment = {
  kataSlug: string;
  labanEffort: string;
  durationMs: number;
  confidence: number;
  rationale: string;
};

type OrchestratorResponse = {
  sequence: OrchestratedSegment[];
  agreementWithPhaseA: "confirms" | "refines" | "disagrees";
  overallReasoning: string;
  uncertainSegments: number[];
};

// ---------- Handler ----------

export async function POST(req: Request) {
  const ip = clientIp(req);
  const slot = await limiter.consume(`ip:${ip}`);
  if (!slot.ok) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((slot.resetAt - Date.now()) / 1000),
    );
    return NextResponse.json(
      {
        error: `Rate-limited — LLM calls are expensive (${HOURLY_CAP}/hr/visitor). Try the Phase A matcher meanwhile.`,
        code: "rate_limited",
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected application/json body" },
      { status: 400 },
    );
  }
  const parsed = parseBody(raw);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const userPrompt = [
    `Trail summary: ${summariseTrail(parsed.points)}`,
    "",
    parsed.phaseAResult
      ? describePhaseA(parsed.phaseAResult)
      : "(no Phase A result supplied)",
    "",
    "Refine into a kata sequence that the performer would actually execute. Be concise; flag uncertainty honestly.",
  ].join("\n");

  const systemPrompt = SYSTEM_PROMPT.replace(
    "{KATA_LIBRARY}",
    buildKataLibrarySection(),
  ).replace("{LABAN_CANON}", buildLabanSection());

  const visitorKey = req.headers.get("X-Visitor-Anthropic-Key");

  try {
    const chatResult = await gatewayChat({
      model: "anthropic/claude-sonnet-4-7",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      maxTokens: 1500,
      visitorKey: visitorKey ?? undefined,
    });

    const parsedResponse = tryParseJson(chatResult.text);
    if (!parsedResponse) {
      log.warn("LLM returned non-JSON", {
        firstChars: chatResult.text.slice(0, 120),
      });
      return NextResponse.json(
        {
          error:
            "The LLM didn't return a valid JSON sequence. Try again — sometimes Claude's first reply is conversational.",
          code: "non_json_reply",
          rawText: chatResult.text.slice(0, 500),
        },
        { status: 502 },
      );
    }

    log.info("orchestrated", {
      segmentCount: parsedResponse.sequence?.length ?? 0,
      agreement: parsedResponse.agreementWithPhaseA,
      usingVisitorKey: chatResult.usingVisitorKey,
      usingGateway: chatResult.usingGateway,
    });

    return NextResponse.json({ result: parsedResponse });
  } catch (err) {
    if (err instanceof GatewayUnavailableError) {
      return NextResponse.json(
        {
          error: `LLM not reachable: ${err.message}`,
          code: err.code,
        },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error("orchestrate failed", { err: message });
    return NextResponse.json(
      { error: message, code: "internal_error" },
      { status: 500 },
    );
  }
}

function tryParseJson(text: string): OrchestratorResponse | null {
  // Try the whole thing first.
  try {
    return JSON.parse(text) as OrchestratorResponse;
  } catch {
    // Fall through.
  }
  // Try to extract a JSON object — sometimes the model wraps in
  // markdown despite the prompt.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]!) as OrchestratorResponse;
    } catch {
      // Fall through.
    }
  }
  // Last try: find the first { and the matching closing }.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1)) as OrchestratorResponse;
    } catch {
      // Give up.
    }
  }
  return null;
}
