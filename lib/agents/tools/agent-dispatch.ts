import "server-only";

/**
 * lib/agents/tools/agent-dispatch.ts — `agent.dispatch` tool.
 *
 * Lets one specialist hand a sub-task to another specialist via the
 * crew runner. The dispatched specialist runs as a single-member crew
 * with itself as orchestrator; the result is the synthesised output.
 *
 * # Cycle prevention
 *
 * A naïve implementation could loop Aura → Marcel → Aura → Marcel
 * forever. We track the calling chain through the `ToolContext` (via a
 * non-standard `_callChain` field the tool maintains) and refuse two
 * cases:
 *
 *   1. Self-dispatch: `specialist === ctx.callingSpecialist`.
 *   2. Re-entry: the target slug has already appeared in `_callChain`.
 *
 * Both are surfaced as `circular_dispatch` so the calling specialist
 * can pick another path.
 *
 * # Specialist lookup
 *
 * `lib/agents/specialists/` exports individual specialist records
 * (`aura`, `marcel`, `coco`, `scribe`) but doesn't currently have a
 * `getSpecialist` index. We dynamic-import each known slug; missing
 * specialists surface as `unknown_specialist`. As new specialists are
 * added, extend `KNOWN_SPECIALIST_SLUGS` here — keeping the list
 * explicit avoids accidentally exposing a not-yet-cast-bibled draft.
 *
 * # Budget
 *
 *  - 60-second outer wall-clock for the entire sub-run.
 *  - Default `maxIterations: 3` for the inner crew (smaller than the
 *    main crew default of 5 because we're already nested).
 */

import { createLogger } from "lib/log";
import { runCrew } from "lib/agents/crew";
import type { Specialist, CrewRun } from "lib/agents/crew/types";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.agent-dispatch");

const DISPATCH_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_ITERATIONS = 3;
const HARD_MAX_ITERATIONS = 5;

/**
 * Explicit specialist registry. Add new specialists as their cast
 * bibles land in `data/agents/<slug>.json` and `lib/agents/specialists/
 * <slug>.ts`.
 *
 * Each entry returns a Promise of the specialist record. We use a
 * static switch — not a templated `import(\`...${slug}\`)` — because
 * webpack/Next refuse to bundle templated dynamic imports without an
 * explicit `webpackInclude` magic comment. The static form is simpler
 * and keeps each specialist module tree-shake-able for chains that
 * never reach it.
 */
const SPECIALIST_LOADERS: Record<string, () => Promise<unknown>> = {
  aura: () => import("lib/agents/specialists/aura"),
  marcel: () => import("lib/agents/specialists/marcel"),
  coco: () => import("lib/agents/specialists/coco"),
  scribe: () => import("lib/agents/specialists/scribe"),
};

type DispatchArgs = {
  specialist: string;
  task: string;
  context?: unknown;
  maxIterations?: number;
};

/**
 * Extended context shape this tool reads from + writes to. The base
 * `ToolContext` doesn't model `_callChain`; we treat it as an optional
 * extension on the same object the runner threads through.
 */
type ContextWithChain = ToolContext & { _callChain?: string[] };

function parseArgs(raw: unknown): DispatchArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.specialist !== "string" || r.specialist.trim().length === 0) {
    return "args.specialist must be a non-empty string slug";
  }
  if (typeof r.task !== "string" || r.task.trim().length === 0) {
    return "args.task must be a non-empty string";
  }
  const maxIterations =
    typeof r.maxIterations === "number" &&
    Number.isFinite(r.maxIterations) &&
    r.maxIterations > 0
      ? Math.min(Math.floor(r.maxIterations), HARD_MAX_ITERATIONS)
      : undefined;
  const result: DispatchArgs = {
    specialist: r.specialist.trim(),
    task: r.task.trim(),
  };
  if ("context" in r) result.context = r.context;
  if (maxIterations !== undefined) result.maxIterations = maxIterations;
  return result;
}

async function loadSpecialist(slug: string): Promise<Specialist | null> {
  const loader = SPECIALIST_LOADERS[slug];
  if (!loader) return null;
  try {
    const mod = (await loader()) as Record<string, unknown>;
    const value = mod[slug];
    if (value && typeof value === "object" && "slug" in value) {
      return value as Specialist;
    }
    return null;
  } catch (err) {
    log.warn("specialist module load failed", {
      slug,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

async function run(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }

  const chainCtx = ctx as ContextWithChain;
  const callChain = chainCtx._callChain ?? [ctx.callingSpecialist];

  // ── Cycle prevention ────────────────────────────────────────────────
  if (parsed.specialist === ctx.callingSpecialist) {
    return { ok: false, error: "circular_dispatch: self_dispatch_refused" };
  }
  if (callChain.includes(parsed.specialist)) {
    log.warn("agent.dispatch refused — already in call chain", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      target: parsed.specialist,
      chain: callChain,
    });
    return {
      ok: false,
      error: `circular_dispatch: ${parsed.specialist} is already in the call chain`,
    };
  }

  // ── Specialist lookup ───────────────────────────────────────────────
  const specialist = await loadSpecialist(parsed.specialist);
  if (!specialist) {
    return {
      ok: false,
      error: `unknown_specialist: ${parsed.specialist}`,
    };
  }

  // Build a task scoped to this dispatch.
  const subTaskId = `${ctx.taskId}::${parsed.specialist}`;
  const subContext: Record<string, unknown> = {
    dispatchedBy: ctx.callingSpecialist,
    callChain: [...callChain, parsed.specialist],
  };
  if (parsed.context !== undefined) subContext.context = parsed.context;

  const maxIterations = parsed.maxIterations ?? DEFAULT_MAX_ITERATIONS;

  try {
    const runPromise = runCrew({
      task: {
        id: subTaskId,
        description: parsed.task,
        context: subContext,
        assignTo: specialist.slug,
      },
      specialists: [specialist],
      orchestrator: specialist.slug,
      maxIterations,
      // Tools registry intentionally omitted at this layer — the
      // sub-crew runs without our broader tool set to avoid runaway
      // recursion. If the dispatched specialist needs tools the caller
      // should plumb a scoped registry through the route layer.
    });

    const guard = new Promise<CrewRun>((_, reject) =>
      setTimeout(
        () => reject(new Error(`dispatch_timeout_${DISPATCH_TIMEOUT_MS}ms`)),
        DISPATCH_TIMEOUT_MS,
      ),
    );

    const runResult = await Promise.race([runPromise, guard]);

    log.info("agent.dispatch ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      target: parsed.specialist,
      iterations: runResult.iterations,
      ok: runResult.ok,
    });

    return {
      ok: true,
      output: runResult,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("agent.dispatch failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      target: parsed.specialist,
      err: msg,
    });
    return { ok: false, error: `agent_dispatch_failed: ${msg}` };
  }
}

export const agentDispatchTool: Tool = {
  name: "agent.dispatch",
  description:
    "Hand a sub-task to another specialist by slug. The named specialist runs as a single-member crew with itself as orchestrator and returns its CrewRun. Refuses self-dispatch and any target already in the call chain.",
  argsSchema: `{
    "specialist": "string (required) — target specialist slug, e.g. 'marcel', 'coco', 'scribe'",
    "task": "string (required) — plain-English sub-task description",
    "context": "any (optional) — structured context the sub-specialist should see",
    "maxIterations": "number (optional, default 3, max 5) — sub-crew dispatch ceiling"
  }`,
  run,
};
