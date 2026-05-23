/**
 * lib/agents/crew/plan.ts — Planning phase of the crew runner.
 *
 * The orchestrator LLM reads the task + the specialist roster and
 * produces a short ordered list of sub-steps, each naming the
 * specialist that owns it. Extracted from `crew.ts` to keep the
 * orchestrator under the 300-line cap.
 */

import "server-only";

import { createLogger } from "lib/log";
import { callLLM, type LLMMessage } from "lib/agents/llm-client";

import { extractJsonObject, isRecord, safeStringify } from "./helpers";
import type { Specialist, Task } from "./types";

const log = createLogger("agents.crew.plan");

/** Sub-step the planner emits — internal to the runner. */
export type PlannedStep = {
  /** Specialist slug to dispatch to. */
  assignee: string;
  /** Free-text sub-task description. */
  subtask: string;
};

export type PlanResult = {
  reasoning: string;
  steps: PlannedStep[];
};

export async function planTask(opts: {
  task: Task;
  orchestrator: Specialist;
  roster: Map<string, Specialist>;
  timeoutMs?: number;
  totalUsage: { inputTokens: number; outputTokens: number };
}): Promise<PlanResult> {
  const rosterLines = Array.from(opts.roster.values())
    .map((s) => `- ${s.slug} — ${s.role}. ${s.goal}`)
    .join("\n");

  const planningPrompt = [
    `You are the orchestrator for a crew of specialists. Plan how to accomplish the task below by listing the sub-steps in order, naming which specialist handles each.`,
    ``,
    `AVAILABLE SPECIALISTS:`,
    rosterLines,
    ``,
    `TASK ID: ${opts.task.id}`,
    `TASK: ${opts.task.description}`,
    opts.task.expectedOutput
      ? `EXPECTED OUTPUT: ${opts.task.expectedOutput}`
      : "",
    opts.task.context && Object.keys(opts.task.context).length > 0
      ? `CONTEXT:\n${safeStringify(opts.task.context)}`
      : "",
    ``,
    `Respond with a single JSON object, no prose, no markdown fence:`,
    `{"reasoning": "one sentence explaining the plan", "steps": [{"assignee": "<slug>", "subtask": "<one sentence>"}]}`,
    `Keep steps minimal — one specialist per sub-step. Use 1-4 steps total.`,
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  const messages: LLMMessage[] = [
    { role: "system", content: opts.orchestrator.systemPrompt },
    { role: "user", content: planningPrompt },
  ];

  const res = await callLLM({
    provider: opts.orchestrator.preferredModel.provider,
    model: opts.orchestrator.preferredModel.model,
    via: opts.orchestrator.preferredModel.via,
    messages,
    maxTokens: 512,
    temperature: 0.3,
    timeoutMs: opts.timeoutMs,
  });

  if (!res.ok) {
    log.warn("planning failed", {
      taskId: opts.task.id,
      error: res.error,
    });
    return {
      reasoning: `planner LLM call failed (${res.error}); falling back to orchestrator-self dispatch`,
      steps: [],
    };
  }

  opts.totalUsage.inputTokens += res.usage.inputTokens;
  opts.totalUsage.outputTokens += res.usage.outputTokens;

  const parsed = parsePlan(res.text, opts.roster);
  if (!parsed) {
    log.warn("planner returned unparseable JSON; falling back", {
      taskId: opts.task.id,
      raw: res.text.slice(0, 200),
    });
    return {
      reasoning: `planner output was not valid plan JSON; falling back to orchestrator-self dispatch`,
      steps: [],
    };
  }
  return parsed;
}

function parsePlan(
  raw: string,
  roster: Map<string, Specialist>,
): PlanResult | null {
  const obj = extractJsonObject(raw);
  if (!obj) return null;

  const reasoning =
    typeof obj.reasoning === "string" ? obj.reasoning : "(no reasoning given)";
  const rawSteps = Array.isArray(obj.steps) ? obj.steps : [];

  const steps: PlannedStep[] = [];
  for (const item of rawSteps) {
    if (!isRecord(item)) continue;
    const assignee = typeof item.assignee === "string" ? item.assignee : null;
    const subtask = typeof item.subtask === "string" ? item.subtask : null;
    if (!assignee || !subtask) continue;
    if (!roster.has(assignee)) continue; // silently drop unknown assignees
    steps.push({ assignee, subtask });
  }
  return { reasoning, steps };
}
