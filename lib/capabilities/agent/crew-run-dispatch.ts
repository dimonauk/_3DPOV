/**
 * crew-run-dispatch.ts — Per-task prompt construction and execution.
 */
import { respond, type AgentProvider } from "./dialogue";
import { respondWithTools } from "./crew-tools";
import { validateOutputAgainstSchema } from "./crew-output-schema";
import { resolveBible } from "./crew-run-bible";
import { createLogger } from "lib/log";
import type { CrewAgentDefinition, CrewDefinition, CrewTask, CrewTurn } from "./crew-run-types";

const log = createLogger("capability:agent.crew-run");

export function buildContextSuffix(
  agent: CrewAgentDefinition,
  task: CrewTask,
  contextIn: Record<string, unknown>,
  globalPrompt?: string,
): string {
  const parts: string[] = [];
  if (globalPrompt)          parts.push(`Crew brief: ${globalPrompt}`);
  if (agent.system_prompt_suffix) parts.push(agent.system_prompt_suffix);
  if (task.expected_output)  parts.push(`Expected output: ${task.expected_output}`);
  if (agent.task_boundaries) parts.push(`Task boundaries: ${agent.task_boundaries}`);
  if (Object.keys(contextIn).length > 0) {
    parts.push(
      `Context from prior tasks:\n${Object.entries(contextIn)
        .map(([k, v]) => `  ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join("\n")}`,
    );
  }
  return parts.join("\n\n");
}

export async function runOneTask(
  crew: CrewDefinition,
  task: CrewTask,
  runId: string,
  contextIn: Record<string, unknown>,
  globalPrompt: string | undefined,
  wave?: number,
): Promise<CrewTurn> {
  const agent = crew.agents.find((a) => a.id === task.assigned_agent);
  if (!agent) throw new Error(`task ${task.id} references unknown agent ${task.assigned_agent}`);

  const { bible, from } = resolveBible(agent);
  const contextSuffix = buildContextSuffix(agent, task, contextIn, globalPrompt);
  log.info("running task", { run_id: runId, task_id: task.id, agent_id: agent.id, bible_source: from, wave });

  const t0 = Date.now();
  const retriesAllowed = task.retries ?? 1;
  const useTools = !!(agent.tools && agent.tools.length > 0);
  let turnText: string | null = null;
  let turnIntent: string | null = null;
  let turnMode: string | null = null;
  let lastErr: string | null = null;

  for (let attempt = 0; attempt <= retriesAllowed; attempt++) {
    try {
      if (useTools) {
        const r = await respondWithTools({ crew, agent, bible, userText: task.description, contextSuffix, runId });
        turnText = r.text;
      } else {
        const r = await respond({ speakerId: agent.id, bible, userText: task.description, provider: agent.provider as AgentProvider | undefined, contextSuffix });
        turnText = r.text; turnIntent = r.intent; turnMode = r.mode;
      }
      if (task.output_schema) {
        const v = validateOutputAgainstSchema(turnText, task.output_schema);
        if (!v.ok) throw new Error(`task ${task.id} output_schema failed: ${v.error}`);
      }
      if (attempt > 0) log.info("task succeeded on retry", { run_id: runId, task_id: task.id, attempt });
      break;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      turnText = null;
      if (attempt < retriesAllowed)
        log.warn("task failed, retrying", { run_id: runId, task_id: task.id, attempt: attempt + 1, error: lastErr });
    }
  }
  if (turnText === null)
    throw new Error(`task ${task.id} failed after ${retriesAllowed + 1} attempt(s): ${lastErr ?? "unknown"}`);

  if (task.output_path) {
    await writeOutputPath(task, runId, turnText).catch((err) =>
      log.warn("output_path write failed", { run_id: runId, task_id: task.id, error: String(err) }),
    );
  }
  return { run_id: runId, agent_id: agent.id, task_id: task.id, text: turnText, intent: turnIntent, mode: turnMode, duration_ms: Date.now() - t0, wave };
}

async function writeOutputPath(task: CrewTask, runId: string, text: string): Promise<void> {
  if (!task.output_path) return;
  const isNode = typeof process !== "undefined" && typeof (process as { versions?: { node?: string } }).versions?.node === "string";
  if (!isNode) { log.info("output_path skipped — not Node", { run_id: runId, task_id: task.id }); return; }
  const { mkdir, writeFile } = await import("fs/promises");
  const { dirname } = await import("path");
  await mkdir(dirname(task.output_path), { recursive: true });
  await writeFile(task.output_path, text, "utf8");
  log.info("output_path written", { run_id: runId, task_id: task.id, path: task.output_path });
}
