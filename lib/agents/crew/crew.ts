/**
 * lib/agents/crew/crew.ts — CrewAI-style multi-specialist runner.
 *
 * Five-phase orchestration: PLAN (`./plan.ts`) → DISPATCH
 * (`./dispatch.ts`) → tool calls (`./tools.ts`) → delegation
 * → SYNTHESISE (`./synthesise.ts`). Lazy: no LLM at module load,
 * no shared state across runs.
 *
 * Pure framework — specialists + tools are injected. The cast loader,
 * the tools layer, and the route handler all plug in around this
 * module.
 */

import "server-only";

import { createLogger } from "lib/log";

import { dispatchStep } from "./dispatch";
import { planTask, type PlannedStep } from "./plan";
import { synthesise } from "./synthesise";
import type {
  CrewRun,
  CrewStep,
  RunCrewInput,
  Specialist,
  Task,
  ToolRegistry,
} from "./types";

const log = createLogger("agents.crew");

const DEFAULT_MAX_ITERATIONS = 5;
/** Hard floor — even a single-specialist run needs at least one dispatch. */
const MIN_ITERATIONS = 1;

/**
 * Stateless convenience wrapper around `runCrew`. Holds a roster +
 * orchestrator + tools and exposes `.run(task)` so a route handler
 * can reuse the same configuration across requests.
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

/**
 * Run a single crew task end-to-end. When `task.assignTo` is set the
 * planning phase is skipped. Never throws — unrecoverable errors land
 * as `{ ok: false }` with a `stop` step in the trail so the caller
 * can surface them gracefully.
 */
export async function runCrew(input: RunCrewInput): Promise<CrewRun> {
  const maxIterations = Math.max(
    input.maxIterations ?? DEFAULT_MAX_ITERATIONS,
    MIN_ITERATIONS,
  );

  const trail: CrewStep[] = [];
  const totalUsage = { inputTokens: 0, outputTokens: 0 };
  const fail = (reason: string): CrewRun => {
    trail.push({ kind: "stop", reason });
    return { taskId: input.task.id, trail, output: "", ok: false, iterations: 0, totalUsage };
  };

  if (input.specialists.length === 0) return fail("no specialists provided");

  const roster = new Map<string, Specialist>();
  for (const s of input.specialists) roster.set(s.slug, s);

  const orchestrator = roster.get(input.orchestrator);
  if (!orchestrator) {
    return fail(
      `orchestrator "${input.orchestrator}" is not in the specialist roster`,
    );
  }

  log.info("run:start", {
    taskId: input.task.id,
    orchestrator: input.orchestrator,
    rosterSize: input.specialists.length,
    maxIterations,
    pinnedAssignee: input.task.assignTo,
  });

  let planned: PlannedStep[];

  if (input.task.assignTo) {
    const pinned = input.task.assignTo;
    if (!roster.has(pinned)) {
      return fail(`task.assignTo="${pinned}" is not in the specialist roster`);
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

  // If only one specialist spoke and they ARE the orchestrator, we skip
  // the LLM round and use their answer directly.
  let output = "";
  const orchestratorOwnAnswer = lastAnswerBySlug.get(orchestrator.slug);
  const otherAnswers = Array.from(lastAnswerBySlug.entries()).filter(
    ([slug]) => slug !== orchestrator.slug,
  );

  if (otherAnswers.length === 0 && orchestratorOwnAnswer) {
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

  return {
    taskId: input.task.id,
    trail,
    output,
    ok,
    iterations,
    totalUsage,
  };
}
