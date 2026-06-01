/**
 * crew-run-dag.ts — DAG construction, topological waves, executeDag.
 */
import { evaluatePredicate } from "./crew-predicate";
import { runOneTask } from "./crew-run-dispatch";
import { createLogger } from "lib/log";
import type { CrewDefinition, CrewEdge, CrewResumeState, CrewRunInput, CrewTurn } from "./crew-run-types";

const log = createLogger("capability:agent.crew-run");

export function buildDeps(crew: CrewDefinition): Map<string, Set<string>> {
  const deps = new Map<string, Set<string>>();
  for (const t of crew.tasks) deps.set(t.id, new Set(t.depends_on ?? []));
  if (crew.process === "graph" && crew.edges) {
    for (const e of crew.edges) {
      const s = deps.get(e.to_task);
      if (s) s.add(e.from_task);
    }
  }
  return deps;
}

export function topologicalWaves(crew: CrewDefinition): string[][] {
  const deps = buildDeps(crew);
  const allTasks = new Set(crew.tasks.map((t) => t.id));
  const done = new Set<string>();
  const waves: string[][] = [];
  const max = crew.tasks.length + 1;
  let i = 0;
  while (done.size < allTasks.size) {
    if (++i > max) throw new Error(`dependency cycle — unresolvable: ${[...allTasks].filter((t) => !done.has(t)).join(", ")}`);
    const ready = [...allTasks].filter((id) => {
      if (done.has(id)) return false;
      for (const d of deps.get(id) ?? new Set()) if (!done.has(d)) return false;
      return true;
    });
    if (ready.length === 0) throw new Error(`dependency cycle — stuck at: ${[...allTasks].filter((t) => !done.has(t)).join(", ")}`);
    waves.push(ready);
    for (const id of ready) done.add(id);
  }
  return waves;
}

type DagOk     = { ok: true;      turns: CrewTurn[]; waves: string[][]; context_out: Record<string, unknown>; skipped_task_ids: string[] };
type DagErr    = { ok: false;     turns: CrewTurn[]; waves: string[][]; error: string };
type DagPaused = { ok: "paused";  turns: CrewTurn[]; waves: string[][]; context_out: Record<string, unknown>; paused_at_task: string; completed_task_ids: string[]; skipped_task_ids: string[] };

export async function executeDag(
  crew: CrewDefinition,
  runId: string,
  input: CrewRunInput,
): Promise<DagOk | DagErr | DagPaused> {
  let waves: string[][];
  if (input.resume_from) {
    waves = input.resume_from.waves;
  } else {
    try { waves = topologicalWaves(crew); }
    catch (err) { return { ok: false, turns: [], waves: [], error: String(err) }; }
  }

  const turns: CrewTurn[] = input.resume_from ? [...input.resume_from.prior_turns] : [];
  const contextOut: Record<string, unknown> = input.resume_from
    ? { ...input.resume_from.context_out }
    : { ...(crew.context_variables ?? {}) };
  const completedIds  = new Set<string>(input.resume_from?.completed_task_ids ?? []);
  const skippedIds    = new Set<string>(input.resume_from?.skipped_task_ids   ?? []);

  const outgoingEdges = new Map<string, CrewEdge[]>();
  if (crew.process === "graph" && crew.edges) {
    for (const e of crew.edges) {
      const list = outgoingEdges.get(e.from_task) ?? [];
      list.push(e); outgoingEdges.set(e.from_task, list);
    }
  }
  const depsMap = buildDeps(crew);

  for (let w = 0; w < waves.length; w++) {
    const waveTaskIds = waves[w]!;
    const remainingIds: string[] = [];
    for (const id of waveTaskIds) {
      if (completedIds.has(id) || skippedIds.has(id)) continue;
      let depSkipped = false;
      for (const d of depsMap.get(id) ?? new Set()) {
        if (skippedIds.has(d)) { depSkipped = true; break; }
      }
      if (depSkipped) { skippedIds.add(id); log.info("task transitively skipped", { run_id: runId, task_id: id }); continue; }
      remainingIds.push(id);
    }
    if (remainingIds.length === 0) continue;

    const waveTasks = remainingIds.map((id) => crew.tasks.find((t) => t.id === id)!);
    const settled = await Promise.allSettled(waveTasks.map((t) => runOneTask(crew, t, runId, { ...contextOut }, input.prompt, w)));

    for (let j = 0; j < waveTasks.length; j++) {
      const task = waveTasks[j]!;
      const r    = settled[j]!;
      if (r.status === "rejected") {
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        log.error("task failed", { run_id: runId, task_id: task.id, error: msg });
        return { ok: false, turns, waves, error: msg };
      }
      turns.push(r.value);
      contextOut[task.id] = r.value.text;
      completedIds.add(task.id);

      // Graph: evaluate outgoing edge predicates to skip downstream tasks.
      if (crew.process === "graph") {
        for (const edge of outgoingEdges.get(task.id) ?? []) {
          if (edge.when == null) continue;
          let passes = false;
          try { passes = evaluatePredicate(edge.when, contextOut); } catch { passes = false; }
          if (!passes) {
            skippedIds.add(edge.to_task);
            log.info("edge predicate false — skipping", { run_id: runId, from: edge.from_task, to: edge.to_task, when: edge.when });
          }
        }
      }

      // HITL pause after the wave that contains the HITL task.
      if (task.human_in_the_loop) {
        log.info("pausing for human approval", { run_id: runId, task_id: task.id });
        return {
          ok: "paused", turns, waves, context_out: contextOut,
          paused_at_task: task.id,
          completed_task_ids: [...completedIds],
          skipped_task_ids:   [...skippedIds],
        };
      }
    }
  }
  return { ok: true, turns, waves, context_out: contextOut, skipped_task_ids: [...skippedIds] };
}

export function generateRunId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `crew-run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
