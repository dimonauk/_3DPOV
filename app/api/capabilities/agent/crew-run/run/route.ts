/**
 * app/api/capabilities/agent/crew-run/run/route.ts — Execute a reference
 * crew via the agent.crew-run capability.
 *
 * POST /api/capabilities/agent/crew-run/run
 *
 * Body:
 *   {
 *     crew_id: "sequential-example" | "convergence-crew" | "graph-example",
 *     prompt?: string,           // optional crew brief; passed as `prompt` to runCrew
 *     resume_from?: CrewResumeState  // round-trip from a prior paused_for_approval result
 *   }
 *
 * Response (200):
 *   {
 *     result: CrewRunResult,      // discriminated by status
 *     trace: CrewTrace             // pinned-format trace
 *   }
 *
 * Failure modes:
 *   - 503 → AI_GATEWAY_API_KEY not configured
 *   - 400 → malformed body or unknown crew_id
 *   - 429 → rate limited (3 runs per hour per IP)
 *   - 502 → crew run threw (typically gateway / upstream LLM error)
 *
 * Cost: a hierarchical crew runs all worker tasks + a synthesis pass.
 * Convergence-crew (10 agents, 9 tasks + synthesis) = ~10 LLM calls.
 * That's 5-30s depending on provider, $0.01-0.05 worst case at
 * gemini-3.1-flash-lite pricing.
 *
 * Rate limit: 3/hour/IP. Crew runs are expensive — much tighter cap
 * than the regular Aura agent endpoint (20/hour). Internal debug
 * surface, not production traffic.
 */

import { NextResponse, type NextRequest } from "next/server";
import { withRouteLogging, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";
import {
  runCrew,
  type CrewDefinition,
  type CrewResumeState,
} from "lib/capabilities/agent/crew-run";
import { exportTrace } from "lib/capabilities/agent/crew-trace";
import sequentialExample from "lib/agents/sequential-example.json";
import convergenceCrew from "lib/agents/convergence-crew.example.json";
import graphExample from "lib/agents/graph-example.json";

export const maxDuration = 300; // hierarchical crews can run ~1-3 min

const CREWS: Record<string, CrewDefinition> = {
  "sequential-example": sequentialExample as unknown as CrewDefinition,
  "convergence-crew": convergenceCrew as unknown as CrewDefinition,
  "graph-example": graphExample as unknown as CrewDefinition,
};

// 3/hour/IP. Crew runs are expensive (10+ LLM calls per hierarchical crew).
// Internal debug surface, not production traffic — keep the bucket tight.
const HOURLY_CAP = 3;
const limiter = createFixedWindowLimiter({
  scope: "api.capabilities.agent.crew-run",
  limit: HOURLY_CAP,
  windowMs: 60 * 60 * 1000,
});

export const POST = withRouteLogging(
  "capabilities.agent.crew-run",
  async (req: NextRequest, _ctx, log) => {
    if (!process.env.AI_GATEWAY_API_KEY) {
      log.warn("ai_gateway_not_configured");
      return NextResponse.json(
        {
          error: "ai_gateway_not_configured",
          message:
            "agent.crew-run needs AI_GATEWAY_API_KEY in the Vercel env. Add it and redeploy.",
        },
        { status: 503 },
      );
    }

    let body: {
      crew_id?: string;
      prompt?: string;
      resume_from?: CrewResumeState;
    };
    try {
      body = await req.json();
    } catch (err) {
      log.warn("body:invalid", { err: errToObject(err) });
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const crewId = typeof body.crew_id === "string" ? body.crew_id : null;
    if (!crewId || !(crewId in CREWS)) {
      return NextResponse.json(
        {
          error: "invalid_crew_id",
          message: `crew_id must be one of: ${Object.keys(CREWS).join(", ")}`,
        },
        { status: 400 },
      );
    }

    const crew = CREWS[crewId]!;
    const prompt =
      typeof body.prompt === "string" ? body.prompt.slice(0, 2000) : undefined;
    const resumeFrom =
      body.resume_from && typeof body.resume_from === "object"
        ? body.resume_from
        : undefined;

    // Rate-limit by IP.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const limitKey = `ip:${ip}`;
    const slot = await limiter.consume(limitKey);
    if (!slot.ok) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((slot.resetAt - Date.now()) / 1000),
      );
      log.warn("rate_limited", {
        ip,
        retryAfterSec,
        backend: limiter.backend,
      });
      return NextResponse.json(
        {
          error: "rate_limited",
          message: `Crew runs are capped at ${HOURLY_CAP} per hour per visitor. Try again shortly.`,
          retryAfterSec,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
      );
    }

    log.info("crew run starting", {
      crew_id: crewId,
      has_prompt: !!prompt,
      resuming: !!resumeFrom,
    });

    try {
      const input = {
        crew,
        ...(prompt !== undefined ? { prompt } : {}),
        ...(resumeFrom !== undefined ? { resume_from: resumeFrom } : {}),
      };
      const result = await runCrew(input);
      const trace = exportTrace(result, crew);
      log.info("crew run done", {
        crew_id: crewId,
        status: result.status,
        turn_count: trace.turns.length,
        duration_ms: trace.total_duration_ms,
      });
      return NextResponse.json({ result, trace });
    } catch (err) {
      log.error("crew run threw", { err: errToObject(err) });
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: "crew_run_threw", message },
        { status: 502 },
      );
    }
  },
);
