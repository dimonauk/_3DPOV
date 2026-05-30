/**
 * lib/capabilities/agent/crew-trace.ts — Per-run trace export for
 * `agent.crew-run` (Phase 4 partial).
 *
 * Takes a CrewRunResult plus the originating crew definition and emits
 * a stable, pinned JSON object suitable for:
 *   - writing to disk for debugging
 *   - feeding `agent.memory-vector` so crew runs become searchable
 *   - sending to external telemetry
 *
 * The format is versioned via `schema_version` — bump on breaking changes.
 *
 * # Format rationale
 *
 * - Flat fields where possible — easier to query in storage backends
 * - ISO-8601 timestamps for deserialiser compatibility
 * - Per-turn timing reconstructed from `duration_ms` running backwards
 *   from the `total_duration_ms` end. Approximate but enough for trace.
 * - `context_out` and `text` fields preserved verbatim — callers can
 *   trim if too large for their storage backend
 */

import type { CrewDefinition, CrewRunResult, CrewTurn } from "./crew-run";

export type CrewTraceTurn = {
  agent_id: string;
  task_id: string;
  text: string;
  intent: string | null;
  mode: string | null;
  duration_ms: number;
  wave: number | null;
  /** Approximate offset from run start in ms (reconstructed). */
  offset_ms: number;
};

export type CrewTrace = {
  schema_version: "1";
  run_id: string;
  crew_id: string;
  crew_name: string;
  crew_version: string;
  process: string;
  lead_agent: string | null;
  status: CrewRunResult["status"];
  /** ISO-8601 timestamp of trace generation. */
  generated_at: string;
  /** Wall-clock duration in ms. Present for ok + paused_for_approval. */
  total_duration_ms: number | null;
  agents_count: number;
  tasks_count: number;
  /** Ordered turns, with reconstructed offset_ms. */
  turns: CrewTraceTurn[];
  /** For DAG-based modes. */
  waves: string[][] | null;
  /** Phase 3 — tasks skipped via `edge.when` predicates. */
  skipped_task_ids: string[];
  /** Final accumulated context. Includes `__synthesis__` for hierarchical. */
  context_out: Record<string, unknown> | null;
  /** If status is "paused_for_approval", which task triggered the pause. */
  paused_at_task: string | null;
  /** If status is "error", the error message. */
  error: string | null;
};

/**
 * Build a pinned-format trace from a crew run result plus the originating
 * crew definition. Pure function — no IO.
 */
export function exportTrace(
  result: CrewRunResult,
  crew: CrewDefinition,
): CrewTrace {
  const turns = collectTurns(result);
  const totalDuration = totalDurationFor(result);
  const tracedTurns = reconstructOffsets(turns, totalDuration);

  return {
    schema_version: "1",
    run_id: result.run_id,
    crew_id: result.crew_id,
    crew_name: crew.name,
    crew_version: crew.version,
    process: crew.process,
    lead_agent: crew.lead_agent ?? null,
    status: result.status,
    generated_at: new Date().toISOString(),
    total_duration_ms: totalDuration,
    agents_count: crew.agents.length,
    tasks_count: crew.tasks.length,
    turns: tracedTurns,
    waves: wavesFor(result),
    skipped_task_ids: skippedFor(result),
    context_out: contextFor(result),
    paused_at_task: pausedAtFor(result),
    error: errorFor(result),
  };
}

/**
 * Serialise a trace to a JSON string with stable key ordering and
 * 2-space indentation. Use this when persisting traces to disk.
 */
export function serialiseTrace(trace: CrewTrace): string {
  // Stable key order matches the type declaration above.
  return JSON.stringify(trace, null, 2);
}

// ── Helpers — extract fields safely from the discriminated union ─────

function collectTurns(result: CrewRunResult): CrewTurn[] {
  if (result.status === "ok") return result.turns;
  if (result.status === "paused_for_approval") return result.turns;
  if (result.status === "error") return result.partial_turns;
  return [];
}

function totalDurationFor(result: CrewRunResult): number | null {
  if (result.status === "ok") return result.total_duration_ms;
  if (result.status === "paused_for_approval") return result.partial_duration_ms;
  return null;
}

function wavesFor(result: CrewRunResult): string[][] | null {
  if (result.status === "ok") return result.waves ?? null;
  if (result.status === "paused_for_approval") return result.resume_state.waves;
  return null;
}

function skippedFor(result: CrewRunResult): string[] {
  if (result.status === "ok") return result.skipped_task_ids ?? [];
  if (result.status === "paused_for_approval") return result.resume_state.skipped_task_ids ?? [];
  return [];
}

function contextFor(result: CrewRunResult): Record<string, unknown> | null {
  if (result.status === "ok") return result.context_out;
  if (result.status === "paused_for_approval") return result.resume_state.context_out;
  return null;
}

function pausedAtFor(result: CrewRunResult): string | null {
  if (result.status === "paused_for_approval") return result.paused_at_task;
  return null;
}

function errorFor(result: CrewRunResult): string | null {
  if (result.status === "error") return result.error;
  return null;
}

/**
 * Reconstruct per-turn offset_ms. Approximate — turns within a wave
 * ran in parallel, so we can't exactly recover their start times.
 * Heuristic: assign offset_ms by summing prior wave maxes + 0 for
 * within-wave parallel siblings. The synthesis turn (-1 wave) gets
 * placed at the end.
 */
function reconstructOffsets(turns: CrewTurn[], totalMs: number | null): CrewTraceTurn[] {
  if (turns.length === 0) return [];

  // Group by wave
  const byWave = new Map<number, CrewTurn[]>();
  for (const t of turns) {
    const w = t.wave ?? 0;
    const list = byWave.get(w) ?? [];
    list.push(t);
    byWave.set(w, list);
  }

  // Sort waves ascending, but put -1 (synthesis) at the end
  const waveNums = [...byWave.keys()].sort((a, b) => {
    if (a === -1) return 1;
    if (b === -1) return -1;
    return a - b;
  });

  const result: CrewTraceTurn[] = [];
  let cumulativeOffset = 0;
  for (const w of waveNums) {
    const waveT = byWave.get(w)!;
    const waveMax = waveT.reduce((m, t) => Math.max(m, t.duration_ms), 0);
    for (const t of waveT) {
      result.push({
        agent_id: t.agent_id,
        task_id: t.task_id,
        text: t.text,
        intent: t.intent,
        mode: t.mode,
        duration_ms: t.duration_ms,
        wave: t.wave === undefined ? null : t.wave,
        offset_ms: cumulativeOffset,
      });
    }
    cumulativeOffset += waveMax;
  }

  // Clamp final cumulative to totalMs if known
  if (totalMs !== null && cumulativeOffset > totalMs) {
    // Some drift is expected — don't bother rescaling
  }

  return result;
}
