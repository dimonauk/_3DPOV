/**
 * lib/agents/crew/crew.ts — CrewAI-style multi-specialist runner.
 *
 * Given a `Task` and a roster of `Specialist`s, runs an orchestration
 * loop that:
 *
 *   1. PLANS — the orchestrator (e.g. Aura) reads the task and produces
 *      a short ordered plan naming which specialist owns each sub-step.
 *   2. DISPATCHES — each step is sent to the named specialist with the
 *      task context + prior trail. The specialist returns either an
 *      answer (free text) or a tool call (JSON `{"tool":..., "args":...}`).
 *   3. EXECUTES TOOLS — if the registry knows the tool, the runner
 *      invokes it and feeds the result back to the specialist as an
 *      additional turn.
 *   4. DELEGATES — if the specialist has `allowDelegation: true` and
 *      returns a `{"delegate": <slug>, "subtask": ...}` envelope, the
 *      runner enqueues a new sub-step targeting that slug.
 *   5. SYNTHESISES — once the plan is exhausted (or `maxIterations` is
 *      hit), the orchestrator composes the final output from the trail.
 *
 * Everything is lazy: no LLM call happens at module load. The crew
 * holds no shared state across runs; each `runCrew(...)` call is
 * self-contained.
 *
 * The runner is a pure framework — it imports no specific specialist
 * and no specific tools. Specialists and a `ToolRegistry` are passed
 * in. The cast loader, the tools layer, and the route handler are all
 * separate concerns that plug in around this module.
 */

import "server-only";

import { createLogger } from "lib/log";
import { callLLM, type LLMMessage } from "lib/agents/llm-client";

import type {
  CrewRun,
  CrewStep,
  RunCrewInput,
  Specialist,
  Task,
  ToolCall,
  ToolRegistry,
} from "./types";

const log = createLogger("agents.crew");

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const DEFAULT_MAX_ITERATIONS = 5;
/** Hard floor — even a single-specialist run needs at least one dispatch. */
const MIN_ITERATIONS = 1;

// ---------------------------------------------------------------------
// Sub-step plan emitted by the orchestrator
// ---------------------------------------------------------------------

/** Internal — the parsed shape the planner is asked to produce. */
type PlannedStep = {
  /** Specialist slug to dispatch to. */
  assignee: string;
  /** Free-text sub-task description. */
  subtask: string;
};

type PlanResult = {
  reasoning: string;
  steps: PlannedStep[];
};

// ---------------------------------------------------------------------
// Public class — thin wrapper around `runCrew` for callers that prefer it
// ---------------------------------------------------------------------

/**
 * Stateless convenience wrapper. Holds a roster + orchestrator and
 * exposes `.run(task)`. Equivalent to calling the standalone
 * `runCrew` function. Useful when a route handler wants to reuse the
 * same configuration across requests without re-passing it each time.
 *
 * Holds NO LLM state between runs. Each `.run(...)` is independent.
 */
export class Crew {
  private readonly specialists: ReadonlyArray<Specialist>;
  private readonly orchestrator: string;
  private readonly tools?: ToolRegistry;
  private readonly maxIterations: number;
  private readonly timeoutMs?: number;

  constructor(opts: {
    specialists: ReadonlyArray<Specialist>;
    orchestrator: string;
    tools?: ToolRegistry;
    maxIterations?: number;
    timeoutMs?: number;
  }) {
    if (opts.specialists.length === 0) {
      throw new Error("Crew: at least one specialist is required");
    }
    if (!opts.specialists.some((s) => s.slug === opts.orchestrator)) {
      throw new Error(
        `Crew: orchestrator "${opts.orchestrator}" is not in the specialist roster`,
      );
    }
    this.specialists = opts.specialists;
    this.orchestrator = opts.orchestrator;
    this.tools = opts.tools;
    this.maxIterations = opts.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    this.timeoutMs = opts.timeoutMs;
  }

  async run(task: Task): Promise<CrewRun> {
    return runCrew({
      task,
      specialists: this.specialists,
      orchestrator: this.orchestrator,
      tools: this.tools,
      maxIterations: this.maxIterations,
      timeoutMs: this.timeoutMs,
    });
  }
}

// ---------------------------------------------------------------------
// Public entry point — `runCrew`
// ---------------------------------------------------------------------

/**
 * Run a single crew task end-to-end. Returns the full trail plus the
 * orchestrator's synthesised final output.
 *
 * Behaviour:
 *   - When `task.assignTo` is set, the planning phase is skipped and
 *     the whole task is dispatched once to that specialist.
 *   - On any unrecoverable error (e.g. orchestrator not in roster),
 *     returns `{ ok: false, ...}` with a `stop` step in the trail. Does
 *     NOT throw — the caller is expected to treat `ok: false` as a
 *     graceful failure and surface it to the visitor.
 */
export async function runCrew(input: RunCrewInput): Promise<CrewRun> {
  const maxIterations = Math.max(
    input.maxIterations ?? DEFAULT_MAX_ITERATIONS,
    MIN_ITERATIONS,
  );

  const trail: CrewStep[] = [];
  const totalUsage = { inputTokens: 0, outputTokens: 0 };

  // ---- Roster validation -------------------------------------------------
  if (input.specialists.length === 0) {
    trail.push({ kind: "stop", reason: "no specialists provided" });
    return finalise({
      taskId: input.task.id,
      trail,
      output: "",
      ok: false,
      iterations: 0,
      totalUsage,
    });
  }

  const roster = new Map<string, Specialist>();
  for (const s of input.specialists) roster.set(s.slug, s);

  const orchestrator = roster.get(input.orchestrator);
  if (!orchestrator) {
    trail.push({
      kind: "stop",
      reason: `orchestrator "${input.orchestrator}" is not in the specialist roster`,
    });
    return finalise({
      taskId: input.task.id,
      trail,
      output: "",
      ok: false,
      iterations: 0,
      totalUsage,
    });
  }

  log.info("run:start", {
    taskId: input.task.id,
    orchestrator: input.orchestrator,
    rosterSize: input.specialists.length,
    maxIterations,
    pinnedAssignee: input.task.assignTo,
  });

  // ---- Planning -----------------------------------------------------------
  let planned: PlannedStep[];

  if (input.task.assignTo) {
    // Skip the planning LLM call when the caller has pre-pinned.
    const pinned = input.task.assignTo;
    if (!roster.has(pinned)) {
      trail.push({
        kind: "stop",
        reason: `task.assignTo="${pinned}" is not in the specialist roster`,
      });
      return finalise({
        taskId: input.task.id,
        trail,
        output: "",
        ok: false,
        iterations: 0,
        totalUsage,
      });
    }
    planned = [{ assignee: pinned, subtask: input.task.description }];
    trail.push({
      kind: "plan",
      by: orchestrator.slug,
      reasoning: `task pre-pinned to ${pinned}; skipping LLM planning`,
    });
  } else {
    const planResult = await planTask({
      task: input.task,
      orchestrator,
      roster,
      timeoutMs: input.timeoutMs,
      totalUsage,
    });
    planned = planResult.steps;
    trail.push({
      kind: "plan",
      by: orchestrator.slug,
      reasoning: planResult.reasoning,
    });

    if (planned.length === 0) {
      // The planner returned nothing useful — fall back to dispatching the
      // whole task to the orchestrator itself.
      planned = [{ assignee: orchestrator.slug, subtask: input.task.description }];
      log.warn("planner returned no steps; defaulting to orchestrator-self", {
        taskId: input.task.id,
      });
    }
  }

  // ---- Dispatch loop ------------------------------------------------------
  const stepQueue: PlannedStep[] = [...planned];
  let iterations = 0;
  // Tracks the most recent specialist answer for any one slug; the
  // synthesis step uses this to assemble the final output.
  const lastAnswerBySlug = new Map<string, string>();

  while (stepQueue.length > 0 && iterations < maxIterations) {
    const step = stepQueue.shift();
    if (!step) break;
    iterations += 1;

    const specialist = roster.get(step.assignee);
    if (!specialist) {
      trail.push({
        kind: "stop",
        reason: `unknown specialist "${step.assignee}" — skipping`,
      });
      continue;
    }

    const dispatched = await dispatchStep({
      specialist,
      subtask: step.subtask,
      task: input.task,
      priorTrail: trail,
      tools: input.tools,
      timeoutMs: input.timeoutMs,
      totalUsage,
    });

    // Merge whatever the dispatch produced into the master trail.
    for (const s of dispatched.steps) trail.push(s);

    if (dispatched.answer) {
      lastAnswerBySlug.set(specialist.slug, dispatched.answer);
    }

    // Honour any delegation request — only if the specialist is allowed to.
    if (
      dispatched.delegateTo &&
      dispatched.delegateSubtask &&
      specialist.allowDelegation
    ) {
      if (roster.has(dispatched.delegateTo)) {
        stepQueue.push({
          assignee: dispatched.delegateTo,
          subtask: dispatched.delegateSubtask,
        });
      } else {
        trail.push({
          kind: "stop",
          reason: `delegation target "${dispatched.delegateTo}" not in roster`,
        });
      }
    }
  }

  if (iterations >= maxIterations && stepQueue.length > 0) {
    trail.push({
      kind: "stop",
      reason: `maxIterations (${maxIterations}) reached with ${stepQueue.length} step(s) remaining`,
    });
  }

  // ---- Synthesis ----------------------------------------------------------
  // The orchestrator composes the final output from everything the crew
  // produced. If only one specialist spoke and they ARE the orchestrator,
  // we skip the LLM round and use their answer directly.
  let output = "";
  const orchestratorOwnAnswer = lastAnswerBySlug.get(orchestrator.slug);
  const otherAnswers = Array.from(lastAnswerBySlug.entries()).filter(
    ([slug]) => slug !== orchestrator.slug,
  );

  if (otherAnswers.length === 0 && orchestratorOwnAnswer) {
    // Orchestrator handled it solo — nothing to synthesise.
    output = orchestratorOwnAnswer;
  } else if (lastAnswerBySlug.size > 0) {
    output = await synthesise({
      task: input.task,
      orchestrator,
      trail,
      timeoutMs: input.timeoutMs,
      totalUsage,
    });
    if (output) {
      trail.push({ kind: "answer", by: orchestrator.slug, text: output });
    }
  }

  const ok = output.trim().length > 0;
  log.info("run:end", {
    taskId: input.task.id,
    iterations,
    trailLen: trail.length,
    outputLen: output.length,
    ok,
    inputTokens: totalUsage.inputTokens,
    outputTokens: totalUsage.outputTokens,
  });

  return finalise({
    taskId: input.task.id,
    trail,
    output,
    ok,
    iterations,
    totalUsage,
  });
}

// ---------------------------------------------------------------------
// Planning — orchestrator decomposes the task into per-specialist steps
// ---------------------------------------------------------------------

async function planTask(opts: {
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

// ---------------------------------------------------------------------
// Dispatch — invoke one specialist for one sub-step
// ---------------------------------------------------------------------

type DispatchOutcome = {
  /** Trail steps to merge into the master log. */
  steps: CrewStep[];
  /** The specialist's final answer text, if any. */
  answer?: string;
  /** If the specialist requested delegation. */
  delegateTo?: string;
  delegateSubtask?: string;
};

async function dispatchStep(opts: {
  specialist: Specialist;
  subtask: string;
  task: Task;
  priorTrail: ReadonlyArray<CrewStep>;
  tools?: ToolRegistry;
  timeoutMs?: number;
  totalUsage: { inputTokens: number; outputTokens: number };
}): Promise<DispatchOutcome> {
  const out: DispatchOutcome = { steps: [] };

  // Build the user-side prompt for this dispatch.
  const userPrompt = buildSpecialistUserPrompt({
    specialist: opts.specialist,
    subtask: opts.subtask,
    task: opts.task,
    priorTrail: opts.priorTrail,
    toolNames: opts.specialist.tools,
    allowDelegation: opts.specialist.allowDelegation,
  });

  const messages: LLMMessage[] = [
    { role: "system", content: opts.specialist.systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const res = await callLLM({
    provider: opts.specialist.preferredModel.provider,
    model: opts.specialist.preferredModel.model,
    via: opts.specialist.preferredModel.via,
    messages,
    maxTokens: 1024,
    temperature: 0.7,
    timeoutMs: opts.timeoutMs,
  });

  if (!res.ok) {
    out.steps.push({
      kind: "stop",
      reason: `${opts.specialist.slug} LLM call failed: ${res.error}`,
    });
    return out;
  }

  opts.totalUsage.inputTokens += res.usage.inputTokens;
  opts.totalUsage.outputTokens += res.usage.outputTokens;

  const parsed = parseSpecialistResponse(res.text);

  // Tool call?
  if (parsed.kind === "tool") {
    const toolStep = await runTool({
      specialist: opts.specialist,
      call: parsed.call,
      tools: opts.tools,
    });
    out.steps.push(toolStep);

    // Feed the tool result back to the specialist for an answer turn.
    const followupMessages: LLMMessage[] = [
      ...messages,
      { role: "assistant", content: res.text },
      {
        role: "user",
        content:
          `Tool "${parsed.call.tool}" returned:\n${safeStringify(
            toolStep.kind === "tool" ? toolStep.result ?? toolStep.error ?? null : null,
          )}\n\nIncorporate this and produce your final answer for the sub-task. Plain text only — no further tool calls.`,
      },
    ];

    const followup = await callLLM({
      provider: opts.specialist.preferredModel.provider,
      model: opts.specialist.preferredModel.model,
      via: opts.specialist.preferredModel.via,
      messages: followupMessages,
      maxTokens: 1024,
      temperature: 0.7,
      timeoutMs: opts.timeoutMs,
    });

    if (followup.ok) {
      opts.totalUsage.inputTokens += followup.usage.inputTokens;
      opts.totalUsage.outputTokens += followup.usage.outputTokens;
      const followupText = followup.text.trim();
      if (followupText) {
        out.steps.push({
          kind: "answer",
          by: opts.specialist.slug,
          text: followupText,
        });
        out.answer = followupText;
      }
    } else {
      out.steps.push({
        kind: "stop",
        reason: `${opts.specialist.slug} follow-up after tool call failed: ${followup.error}`,
      });
    }
    return out;
  }

  // Delegation?
  if (parsed.kind === "delegate") {
    if (!opts.specialist.allowDelegation) {
      out.steps.push({
        kind: "stop",
        reason: `${opts.specialist.slug} attempted to delegate but allowDelegation is false`,
      });
      return out;
    }
    out.steps.push({
      kind: "delegate",
      by: opts.specialist.slug,
      to: parsed.to,
      subtask: parsed.subtask,
    });
    out.delegateTo = parsed.to;
    out.delegateSubtask = parsed.subtask;
    return out;
  }

  // Plain answer.
  const text = parsed.text.trim();
  if (text) {
    out.steps.push({ kind: "answer", by: opts.specialist.slug, text });
    out.answer = text;
  }
  return out;
}

// ---------------------------------------------------------------------
// Specialist user-prompt assembler
// ---------------------------------------------------------------------

function buildSpecialistUserPrompt(opts: {
  specialist: Specialist;
  subtask: string;
  task: Task;
  priorTrail: ReadonlyArray<CrewStep>;
  toolNames: ReadonlyArray<string>;
  allowDelegation: boolean;
}): string {
  const lines: string[] = [];
  lines.push(`You are ${opts.specialist.displayName} — ${opts.specialist.role}.`);
  lines.push(`Your goal: ${opts.specialist.goal}`);
  lines.push(`Your backstory: ${opts.specialist.backstory}`);
  lines.push("");
  lines.push(`OVERALL TASK: ${opts.task.description}`);
  if (opts.task.expectedOutput) {
    lines.push(`EXPECTED OUTPUT SHAPE: ${opts.task.expectedOutput}`);
  }
  if (opts.task.context && Object.keys(opts.task.context).length > 0) {
    lines.push(`CONTEXT:\n${safeStringify(opts.task.context)}`);
  }
  lines.push("");
  lines.push(`YOUR SUB-TASK: ${opts.subtask}`);
  lines.push("");

  const priorAnswers = opts.priorTrail.filter(
    (s): s is Extract<CrewStep, { kind: "answer" }> => s.kind === "answer",
  );
  if (priorAnswers.length > 0) {
    lines.push(`PRIOR ANSWERS FROM OTHER SPECIALISTS:`);
    for (const a of priorAnswers) {
      lines.push(`- [${a.by}] ${a.text}`);
    }
    lines.push("");
  }

  if (opts.toolNames.length > 0) {
    lines.push(`AVAILABLE TOOLS: ${opts.toolNames.join(", ")}`);
    lines.push(
      `To call a tool, respond with EXACTLY this JSON shape and nothing else:`,
    );
    lines.push(`{"tool": "<name>", "args": { ... }}`);
    lines.push("");
  }

  if (opts.allowDelegation) {
    lines.push(
      `You may delegate to another specialist. To delegate, respond with EXACTLY this JSON shape:`,
    );
    lines.push(`{"delegate": "<slug>", "subtask": "<one sentence>"}`);
    lines.push("");
  }

  lines.push(
    `Otherwise: respond with the answer to your sub-task as plain text. No JSON wrapper, no markdown code fences.`,
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------
// Specialist-response parser
// ---------------------------------------------------------------------

type ParsedResponse =
  | { kind: "tool"; call: ToolCall }
  | { kind: "delegate"; to: string; subtask: string }
  | { kind: "text"; text: string };

function parseSpecialistResponse(raw: string): ParsedResponse {
  const obj = extractJsonObject(raw);
  if (obj) {
    if (typeof obj.tool === "string") {
      return {
        kind: "tool",
        call: { tool: obj.tool, args: obj.args ?? {} },
      };
    }
    if (typeof obj.delegate === "string" && typeof obj.subtask === "string") {
      return {
        kind: "delegate",
        to: obj.delegate,
        subtask: obj.subtask,
      };
    }
  }
  return { kind: "text", text: raw };
}

// ---------------------------------------------------------------------
// Tool invocation
// ---------------------------------------------------------------------

async function runTool(opts: {
  specialist: Specialist;
  call: ToolCall;
  tools?: ToolRegistry;
}): Promise<CrewStep> {
  // Specialist must be authorised to use the tool.
  if (!opts.specialist.tools.includes(opts.call.tool)) {
    return {
      kind: "tool",
      by: opts.specialist.slug,
      tool: opts.call.tool,
      args: opts.call.args,
      error: `specialist "${opts.specialist.slug}" is not authorised to call tool "${opts.call.tool}"`,
    };
  }

  if (!opts.tools) {
    return {
      kind: "tool",
      by: opts.specialist.slug,
      tool: opts.call.tool,
      args: opts.call.args,
      error: "no tool registry provided to runCrew",
    };
  }

  const handler = opts.tools.get(opts.call.tool);
  if (!handler) {
    return {
      kind: "tool",
      by: opts.specialist.slug,
      tool: opts.call.tool,
      args: opts.call.args,
      error: `tool "${opts.call.tool}" is not registered`,
    };
  }

  try {
    const result = await handler(opts.call.args);
    return {
      kind: "tool",
      by: opts.specialist.slug,
      tool: opts.call.tool,
      args: opts.call.args,
      result,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      kind: "tool",
      by: opts.specialist.slug,
      tool: opts.call.tool,
      args: opts.call.args,
      error: message,
    };
  }
}

// ---------------------------------------------------------------------
// Synthesis — orchestrator composes final output from the trail
// ---------------------------------------------------------------------

async function synthesise(opts: {
  task: Task;
  orchestrator: Specialist;
  trail: ReadonlyArray<CrewStep>;
  timeoutMs?: number;
  totalUsage: { inputTokens: number; outputTokens: number };
}): Promise<string> {
  const answers = opts.trail.filter(
    (s): s is Extract<CrewStep, { kind: "answer" }> => s.kind === "answer",
  );

  if (answers.length === 0) return "";

  const contributions = answers
    .map((a) => `[${a.by}]\n${a.text}`)
    .join("\n\n");

  const synthesisPrompt = [
    `You are synthesising the final output for the task below. Your crewmates have contributed; weave their work into one coherent answer in your voice as the orchestrator.`,
    ``,
    `TASK: ${opts.task.description}`,
    opts.task.expectedOutput
      ? `EXPECTED OUTPUT: ${opts.task.expectedOutput}`
      : "",
    ``,
    `CONTRIBUTIONS:`,
    contributions,
    ``,
    `Return ONLY the final output. No preamble, no meta-commentary, no JSON.`,
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  const messages: LLMMessage[] = [
    { role: "system", content: opts.orchestrator.systemPrompt },
    { role: "user", content: synthesisPrompt },
  ];

  const res = await callLLM({
    provider: opts.orchestrator.preferredModel.provider,
    model: opts.orchestrator.preferredModel.model,
    via: opts.orchestrator.preferredModel.via,
    messages,
    maxTokens: 2048,
    temperature: 0.7,
    timeoutMs: opts.timeoutMs,
  });

  if (!res.ok) {
    log.warn("synthesis failed; falling back to concatenated contributions", {
      taskId: opts.task.id,
      error: res.error,
    });
    return contributions;
  }
  opts.totalUsage.inputTokens += res.usage.inputTokens;
  opts.totalUsage.outputTokens += res.usage.outputTokens;
  return res.text.trim();
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Try to pull a JSON object out of free-form LLM text. Handles:
 *  - Raw JSON
 *  - JSON inside a ```json … ``` fence
 *  - JSON inside an unlabelled ``` fence
 *  - First balanced `{ … }` substring as a last resort
 *
 * Returns `null` if nothing parses.
 */
function extractJsonObject(raw: string): Record<string, unknown> | null {
  const text = raw.trim();
  if (!text) return null;

  // 1. Direct parse.
  const direct = tryParseRecord(text);
  if (direct) return direct;

  // 2. Fenced block.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    const fenced = tryParseRecord(fenceMatch[1].trim());
    if (fenced) return fenced;
  }

  // 3. First balanced { … } substring.
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const slice = text.slice(start, i + 1);
        const parsed = tryParseRecord(slice);
        if (parsed) return parsed;
        break;
      }
    }
  }
  return null;
}

function tryParseRecord(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function finalise(run: CrewRun): CrewRun {
  return run;
}
