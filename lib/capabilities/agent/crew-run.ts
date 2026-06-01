/**
 * lib/capabilities/agent/crew-run.ts — Capability `agent.crew-run`.
 *
 * Slim orchestrator. Execution logic lives in the sibling files:
 *   crew-run-types.ts    — all TypeScript types
 *   crew-run-schema.ts   — Zod validation + validateCrew()
 *   crew-run-bible.ts    — agent → CharacterBible resolution
 *   crew-run-dispatch.ts — per-task prompt construction + execution
 *   crew-run-dag.ts      — DAG construction, topological waves, executeDag
 *   crew-run-modes.ts    — sequential / parallel / hierarchical / graph / swarm
 */
import { createLogger } from "lib/log";
import { validateCrew } from "./crew-run-schema";
import { generateRunId, topologicalWaves } from "./crew-run-dag";
import { buildDeps } from "./crew-run-dag";
import { runSequential, runParallel, runHierarchical, runGraph, notImplementedYet } from "./crew-run-modes";
import type { CrewDefinition, CrewProcessMode, CrewRunInput, CrewRunResult } from "./crew-run-types";

const log = createLogger("capability:agent.crew-run");

// Re-export everything consumers need so their import paths don't change.
export type {
  CrewAgentDefinition, CrewDefinition, CrewEdge, CrewHandoff,
  CrewProcessMode, CrewResumeState, CrewRunInput, CrewRunResult,
  CrewTask, CrewToolBinding, CrewTurn,
} from "./crew-run-types";
export { validateCrew } from "./crew-run-schema";

// ── Entry point ───────────────────────────────────────────────────────

export async function runCrew(input: CrewRunInput): Promise<CrewRunResult> {
  const runId = input.run_id ?? generateRunId();
  const validation = validateCrew(input.crew);
  if (!validation.ok) return { status: "error", run_id: runId, crew_id: (input.crew as { id?: string }).id ?? "<unknown>", error: `Crew validation failed: ${validation.error}`, partial_turns: [] };

  const crew = validation.crew;
  log.info("starting crew run", { run_id: runId, crew_id: crew.id, process: crew.process, agents: crew.agents.length, tasks: crew.tasks.length });

  const t0 = Date.now();
  if (crew.process === "sequential")   return runSequential(crew, runId, input, t0);
  if (crew.process === "parallel")     return runParallel(crew, runId, input, t0);
  if (crew.process === "hierarchical") return runHierarchical(crew, runId, input, t0);
  if (crew.process === "graph")        return runGraph(crew, runId, input, t0);
  return notImplementedYet(crew, runId);
}

// ── Diagnostic helpers ────────────────────────────────────────────────

export function summariseCrew(crew: CrewDefinition) {
  const conditionalEdges = (crew.edges ?? []).filter((e) => e.when?.trim()).length;
  let builtin = 0, mcp = 0, subagent = 0;
  for (const a of crew.agents) for (const t of a.tools ?? []) {
    if (t.kind === "builtin") builtin++;
    else if (t.kind === "mcp") mcp++;
    else if (t.kind === "subagent") subagent++;
  }
  return {
    agents: crew.agents.length, tasks: crew.tasks.length, process: crew.process as CrewProcessMode,
    has_lead: !!crew.lead_agent, has_lineage: !!crew.lineage,
    has_handoffs: !!(crew.handoffs?.length), has_edges: !!(crew.edges?.length),
    conditional_edges: conditionalEdges, tools_total: builtin + mcp + subagent,
    tools_by_kind: { builtin, mcp, subagent },
    tasks_with_output_schema: crew.tasks.filter((t) => !!t.output_schema).length,
    tasks_with_output_path:   crew.tasks.filter((t) => !!t.output_path).length,
    tasks_with_hitl:          crew.tasks.filter((t) => t.human_in_the_loop).length,
  };
}

export function predictWaves(
  crew: CrewDefinition,
): { ok: true; waves: string[][] } | { ok: false; error: string } {
  try { return { ok: true, waves: topologicalWaves(crew) }; }
  catch (err) { return { ok: false, error: err instanceof Error ? err.message : String(err) }; }
}
