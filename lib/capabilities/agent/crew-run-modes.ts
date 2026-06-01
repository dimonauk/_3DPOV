/**
 * crew-run-modes.ts — Sequential, parallel, hierarchical, graph, and
 * swarm (stub) execution modes. Imported by the crew-run orchestrator.
 */
import { respond } from "./dialogue";
import { resolveBible } from "./crew-run-bible";
import { runOneTask } from "./crew-run-dispatch";
import { executeDag, generateRunId } from "./crew-run-dag";
import { createLogger } from "lib/log";
import type { CrewDefinition, CrewRunInput, CrewRunResult, CrewTurn } from "./crew-run-types";

const log = createLogger("capability:agent.crew-run");

export async function runSequential(crew: CrewDefinition, runId: string, input: CrewRunInput, t0: number): Promise<CrewRunResult> {
  const turns: CrewTurn[] = [];
  const contextOut: Record<string, unknown> = { ...(crew.context_variables ?? {}) };
  for (const task of crew.tasks) {
    try {
      const turn = await runOneTask(crew, task, runId, contextOut, input.prompt);
      turns.push(turn); contextOut[task.id] = turn.text;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      log.error("sequential task failed", { run_id: runId, task_id: task.id, error });
      return { status: "error", run_id: runId, crew_id: crew.id, error, partial_turns: turns };
    }
  }
  return { status: "ok", run_id: runId, crew_id: crew.id, turns, context_out: contextOut, total_duration_ms: Date.now() - t0 };
}

export async function runParallel(crew: CrewDefinition, runId: string, input: CrewRunInput, t0: number): Promise<CrewRunResult> {
  const contextIn = { ...(crew.context_variables ?? {}) };
  const settled = await Promise.allSettled(crew.tasks.map((task) => runOneTask(crew, task, runId, contextIn, input.prompt)));
  const turns: CrewTurn[] = [];
  const errors: string[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") turns.push(r.value);
    else errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
  }
  if (errors.length > 0) return { status: "error", run_id: runId, crew_id: crew.id, error: `${errors.length} task(s) failed: ${errors.join("; ")}`, partial_turns: turns };
  const contextOut: Record<string, unknown> = { ...contextIn };
  for (let i = 0; i < crew.tasks.length; i++) contextOut[crew.tasks[i]!.id] = turns[i]!.text;
  return { status: "ok", run_id: runId, crew_id: crew.id, turns, context_out: contextOut, total_duration_ms: Date.now() - t0 };
}

export async function runHierarchical(crew: CrewDefinition, runId: string, input: CrewRunInput, t0: number): Promise<CrewRunResult> {
  const dagResult = await executeDag(crew, runId, input);
  if (dagResult.ok === false) return { status: "error", run_id: runId, crew_id: crew.id, error: dagResult.error, partial_turns: dagResult.turns };
  if (dagResult.ok === "paused") return {
    status: "paused_for_approval", run_id: runId, crew_id: crew.id, turns: dagResult.turns,
    paused_at_task: dagResult.paused_at_task,
    resume_state: { completed_task_ids: dagResult.completed_task_ids, context_out: dagResult.context_out, waves: dagResult.waves, prior_turns: dagResult.turns, skipped_task_ids: dagResult.skipped_task_ids },
    partial_duration_ms: Date.now() - t0,
  };

  // Synthesis pass by lead agent.
  const leadAgent = crew.agents.find((a) => a.id === crew.lead_agent);
  if (!leadAgent) return { status: "error", run_id: runId, crew_id: crew.id, error: `lead_agent "${crew.lead_agent}" not found`, partial_turns: dagResult.turns };
  const { bible } = resolveBible(leadAgent);
  const synthPrompt = buildSynthesisPrompt(crew, dagResult.turns, input.prompt, dagResult.skipped_task_ids);
  const t1 = Date.now();
  const synthResult = await respond({ speakerId: leadAgent.id, bible, userText: synthPrompt, provider: leadAgent.provider });
  const synthTurn: CrewTurn = { run_id: runId, agent_id: leadAgent.id, task_id: "__synthesis__", text: synthResult.text, intent: synthResult.intent, mode: synthResult.mode, duration_ms: Date.now() - t1, wave: -1 };
  return {
    status: "ok", run_id: runId, crew_id: crew.id, turns: [...dagResult.turns, synthTurn],
    context_out: { ...dagResult.context_out, __synthesis__: synthResult.text },
    total_duration_ms: Date.now() - t0, waves: dagResult.waves, skipped_task_ids: dagResult.skipped_task_ids,
  };
}

export async function runGraph(crew: CrewDefinition, runId: string, input: CrewRunInput, t0: number): Promise<CrewRunResult> {
  const dagResult = await executeDag(crew, runId, input);
  if (dagResult.ok === false) return { status: "error", run_id: runId, crew_id: crew.id, error: dagResult.error, partial_turns: dagResult.turns };
  if (dagResult.ok === "paused") return {
    status: "paused_for_approval", run_id: runId, crew_id: crew.id, turns: dagResult.turns,
    paused_at_task: dagResult.paused_at_task,
    resume_state: { completed_task_ids: dagResult.completed_task_ids, context_out: dagResult.context_out, waves: dagResult.waves, prior_turns: dagResult.turns, skipped_task_ids: dagResult.skipped_task_ids },
    partial_duration_ms: Date.now() - t0,
  };
  return { status: "ok", run_id: runId, crew_id: crew.id, turns: dagResult.turns, context_out: dagResult.context_out, total_duration_ms: Date.now() - t0, waves: dagResult.waves, skipped_task_ids: dagResult.skipped_task_ids };
}

export function notImplementedYet(crew: CrewDefinition, runId: string): CrewRunResult {
  return {
    status: "not_implemented_yet", run_id: runId, crew_id: crew.id,
    planned_steps: [
      `[validate] crew "${crew.id}" schema-validated`,
      `[resolve] agents (${crew.agents.length}): ${crew.agents.map((a) => a.id).join(", ")}`,
      `[resolve] tasks (${crew.tasks.length}): ${crew.tasks.map((t) => t.id).join(", ")}`,
      `[mode] process="${crew.process}"`,
      `[exec] swarm would do dynamic handoffs based on context_variables + crew.handoffs`,
      `[aggregate] would collect CrewTurn[] into CrewRunResult`,
    ],
    see: "lib/capabilities/agent/crew-run.PURPOSE.md § Build phases",
  };
}

function buildSynthesisPrompt(crew: CrewDefinition, workerTurns: CrewTurn[], globalPrompt: string | undefined, skippedTaskIds: string[]): string {
  const parts: string[] = [
    `You are the lead orchestrator for the "${crew.name}" crew.`,
    `${workerTurns.length} worker agent(s) have completed their tasks. Read their outputs and synthesise a single coherent answer.`,
  ];
  if (globalPrompt) parts.push(`The crew brief was:\n  ${globalPrompt}`);
  parts.push(`The crew's purpose: ${crew.description ?? crew.name}`, `Worker outputs:`);
  for (const turn of workerTurns) {
    const task = crew.tasks.find((t) => t.id === turn.task_id);
    parts.push(`---`, `Agent: ${turn.agent_id}`, `Task ${turn.task_id}: ${task ? task.description.slice(0, 200) : turn.task_id}`, `Output: ${turn.text}`);
  }
  if (skippedTaskIds.length > 0) {
    parts.push(`---`, `Note — the following tasks were SKIPPED due to conditional routing:`);
    for (const id of skippedTaskIds) {
      const task = crew.tasks.find((t) => t.id === id);
      parts.push(`  • ${id}: ${task ? task.description.slice(0, 120) : id}`);
    }
    parts.push(`Factor these absences into the synthesis where they matter.`);
  }
  parts.push(`---`, `Synthesise the above into a single answer. Do not just repeat the worker outputs — integrate them. Honour the voice of the lead agent (you).`);
  return parts.join("\n\n");
}
