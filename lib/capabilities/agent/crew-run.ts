/**
 * lib/capabilities/agent/crew-run.ts — Capability `agent.crew-run`:
 * orchestrated multi-agent runs over the crew schema.
 *
 * One-line role: take a crew definition (matching lib/agents/crew-schema.json) and execute it.
 * Full purpose in crew-run.PURPOSE.md.
 *
 * # Status: Phases 1 + 2 + 3 + 4-partial — sequential + parallel + hierarchical + graph w/ conditional routing
 *
 * Sequential, parallel, hierarchical, and graph process modes execute
 * real LLM dispatches via `agent.dialogue`'s `respond()`. Each task
 * becomes one turn for its agent. Bibles resolve via
 * `agent.cast-roster` (cast-aligned crews) or synthesise from the
 * agent's role/goal/backstory (ad-hoc crews).
 *
 * Hierarchical + graph share a topological DAG executor under the
 * hood — the difference is hierarchical adds a final synthesis pass
 * by the lead agent that wraps all worker outputs into one coherent
 * answer. Graph mode skips the synthesis (it's a pure execution graph).
 *
 * # Phase 3: conditional graph routing (graph mode only)
 *
 * In graph mode, `crew.edges[]` can carry `when` predicates that
 * gate downstream execution. After a task completes, each outgoing
 * edge's predicate is evaluated against the accumulated context_out.
 * Predicates that resolve false mark the `to_task` as skipped; the
 * task never runs. Skipping is transitive — tasks whose dependencies
 * are all skipped are themselves skipped.
 *
 * Predicate syntax is documented in `crew-predicate.ts`. Empty `when`
 * means unconditional.
 *
 * Swarm mode still returns `not_implemented_yet` — its dynamic
 * handoffs based on context_variable conditions require LLM-routed
 * decisions that aren't worth implementing until there's a real use
 * case calling for them.
 *
 * # Phase 4 partial: retries + human_in_the_loop
 *
 * `task.retries` honoured per task (default 1 = two total attempts).
 * `task.human_in_the_loop` causes a pause AFTER the wave containing
 * the HITL task completes; the caller round-trips `resume_state` via
 * `input.resume_from` to continue.
 */

import { z } from "zod";
import { respond, type AgentProvider, type RespondResult } from "./dialogue";
import { getMember } from "./cast-roster";
import type { CharacterBible } from "lib/cast/aura";
import { createLogger } from "lib/log";
import { evaluatePredicate, validatePredicate } from "./crew-predicate";
import { validateOutputAgainstSchema } from "./crew-output-schema";
import { respondWithTools } from "./crew-tools";

const log = createLogger("capability:agent.crew-run");

// ── Schema types — match crew-schema.json exactly ────────────────────

export type CrewProcessMode =
  | "sequential"
  | "parallel"
  | "hierarchical"
  | "graph"
  | "swarm";

export type CrewToolBinding =
  | { kind: "builtin"; name: string }
  | { kind: "mcp"; server: string; tool: string; default_payload?: Record<string, unknown> }
  | { kind: "subagent"; agent_id: string };

export type CrewAgentDefinition = {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  model?: string;
  /** Runtime override for the dialogue provider (not in JSON schema, runtime-only). */
  provider?: AgentProvider;
  tools?: CrewToolBinding[];
  max_iterations?: number;
  allow_delegation?: boolean;
  delegate_to?: string[];
  memory?: {
    enabled?: boolean;
    scope?: "session" | "persistent";
  };
  effort_budget?: {
    max_tool_calls?: number;
    max_context_tokens?: number;
  };
  output_format?: string;
  task_boundaries?: string;
  system_prompt_suffix?: string;
};

export type CrewTask = {
  id: string;
  description: string;
  assigned_agent: string;
  depends_on?: string[];
  expected_output: string;
  output_path?: string;
  output_schema?: Record<string, unknown>;
  async_execution?: boolean;
  human_in_the_loop?: boolean;
  retries?: number;
};

export type CrewHandoff = {
  from_agent: string;
  to_agent: string;
  condition?: string;
  context_passed?: string[];
  reason_template?: string;
};

export type CrewEdge = {
  from_task: string;
  to_task: string;
  when?: string;
  transform?: string;
};

export type CrewDefinition = {
  id: string;
  name: string;
  version: string;
  description?: string;
  tenant_id?: string;
  lineage?: {
    template_id?: string;
    locked_by?: string;
  };
  process: CrewProcessMode;
  /** Required for hierarchical mode; runtime ignores in sequential. */
  lead_agent?: string;
  shared_memory?: {
    backend?: "ephemeral" | "memory_shard" | "mind_palace_mcp" | "filesystem";
    namespace?: string;
    capacity_tokens?: number;
  };
  context_variables?: Record<string, unknown>;
  agents: CrewAgentDefinition[];
  tasks: CrewTask[];
  handoffs?: CrewHandoff[];
  edges?: CrewEdge[];
  guards?: {
    max_total_iterations?: number;
    max_wallclock_ms?: number;
    budget_usd?: number;
    require_human_approval_on?: string[];
  };
};

// ── Run-time inputs and outputs ──────────────────────────────────────

export type CrewRunInput = {
  crew: CrewDefinition;
  /** Initial user prompt or seed message. Passed as additional context to each task. */
  prompt?: string;
  /** Per-run effort cap across all agents. Defaults to sum of per-agent caps. */
  total_effort_budget?: number;
  /** Optional run id for telemetry / log attribution; defaults to crypto.randomUUID(). */
  run_id?: string;
  /**
   * Resume state from a prior `paused_for_approval` run. Pass back the
   * `resume_state` field of the previous CrewRunResult to continue
   * execution from where it paused. Only honoured in hierarchical and
   * graph modes (the DAG-based runtimes).
   */
  resume_from?: CrewResumeState;
};

/**
 * Snapshot of in-flight crew state needed to resume after a
 * human_in_the_loop pause. Round-trip via CrewRunResult.resume_state
 * → CrewRunInput.resume_from.
 */
export type CrewResumeState = {
  completed_task_ids: string[];
  context_out: Record<string, unknown>;
  waves: string[][];
  /** Carry the existing turns so resumed runs return the full trace. */
  prior_turns: CrewTurn[];
  /**
   * Tasks that were skipped before the pause due to `edge.when` predicates
   * resolving false (graph mode). Carried so resumed runs don't re-evaluate.
   */
  skipped_task_ids?: string[];
};

export type CrewTurn = {
  /** Run attribution for trace. */
  run_id: string;
  /** Which agent produced this turn. */
  agent_id: string;
  /** Which task this turn belongs to. For synthesis turns, this is `__synthesis__`. */
  task_id: string;
  /** The user-facing text. */
  text: string;
  /** Optional intent label from the dialogue capability. */
  intent: string | null;
  /** Optional mode label (Aura-specific; null for non-Aura agents). */
  mode: string | null;
  /** Wall-clock duration in ms. */
  duration_ms: number;
  /** Topological wave number — 0 for first wave, etc. -1 for synthesis. */
  wave?: number;
};

export type CrewRunResult =
  | {
      status: "ok";
      run_id: string;
      crew_id: string;
      turns: CrewTurn[];
      /** Final context variables after the run. Each task's output is keyed by task.id. Hierarchical adds `__synthesis__`. */
      context_out: Record<string, unknown>;
      total_duration_ms: number;
      /** For DAG-based modes (hierarchical, graph), the wave structure. */
      waves?: string[][];
      /**
       * Tasks that were declared but skipped due to `edge.when` predicates
       * resolving false (graph mode), or transitively due to a skipped
       * upstream. Empty array on hierarchical runs (no conditional edges).
       */
      skipped_task_ids?: string[];
    }
  | {
      status: "error";
      run_id: string;
      crew_id: string;
      error: string;
      partial_turns: CrewTurn[];
    }
  | {
      status: "paused_for_approval";
      run_id: string;
      crew_id: string;
      /** All turns completed so far, including the one that triggered the pause. */
      turns: CrewTurn[];
      /** The task that requested human review (task.human_in_the_loop === true). */
      paused_at_task: string;
      /** State to round-trip back into CrewRunInput.resume_from to continue. */
      resume_state: CrewResumeState;
      /** Wall-clock duration in ms up to the pause point. */
      partial_duration_ms: number;
    }
  | {
      status: "not_implemented_yet";
      run_id: string;
      crew_id: string;
      /** What would have happened if the runtime were built. */
      planned_steps: string[];
      /** Reference to the section in SYSTEM.md / crew-run.PURPOSE.md. */
      see: string;
    };

// ── Schema validation (light) ────────────────────────────────────────

const CrewAgentSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  goal: z.string().min(1),
  backstory: z.string().min(1),
  model: z.string().optional(),
  provider: z.enum(["gemini", "openai", "anthropic", "zai"]).optional(),
  tools: z.array(z.unknown()).optional(),
  max_iterations: z.number().int().positive().optional(),
  allow_delegation: z.boolean().optional(),
  delegate_to: z.array(z.string()).optional(),
  memory: z.unknown().optional(),
  effort_budget: z.unknown().optional(),
  output_format: z.string().optional(),
  task_boundaries: z.string().optional(),
  system_prompt_suffix: z.string().optional(),
});

const CrewTaskSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  assigned_agent: z.string().min(1),
  depends_on: z.array(z.string()).optional(),
  expected_output: z.string().min(1),
  output_path: z.string().optional(),
  output_schema: z.record(z.string(), z.unknown()).optional(),
  async_execution: z.boolean().optional(),
  human_in_the_loop: z.boolean().optional(),
  retries: z.number().int().min(0).optional(),
});

const CrewDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  tenant_id: z.string().optional(),
  lineage: z.unknown().optional(),
  process: z.enum(["sequential", "parallel", "hierarchical", "graph", "swarm"]),
  lead_agent: z.string().optional(),
  shared_memory: z.unknown().optional(),
  context_variables: z.record(z.string(), z.unknown()).optional(),
  agents: z.array(CrewAgentSchema).min(1),
  tasks: z.array(CrewTaskSchema).min(1),
  handoffs: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
  guards: z.unknown().optional(),
});

/**
 * Validate a crew definition against the (subset of the) schema this
 * capability understands. Returns the typed crew on success, or an error.
 */
export function validateCrew(crew: unknown): { ok: true; crew: CrewDefinition } | { ok: false; error: string } {
  const result = CrewDefinitionSchema.safeParse(crew);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }

  const c = result.data as CrewDefinition;
  const agentIds = new Set(c.agents.map((a) => a.id));
  for (const t of c.tasks) {
    if (!agentIds.has(t.assigned_agent) && t.assigned_agent !== "auto") {
      return { ok: false, error: `task ${t.id} references unknown agent ${t.assigned_agent}` };
    }
  }
  const taskIds = new Set(c.tasks.map((t) => t.id));
  for (const t of c.tasks) {
    for (const d of t.depends_on ?? []) {
      if (!taskIds.has(d)) {
        return { ok: false, error: `task ${t.id} depends on unknown task ${d}` };
      }
    }
  }
  if (c.process === "hierarchical" && !c.lead_agent) {
    return { ok: false, error: `process=hierarchical requires lead_agent to be set` };
  }
  // Hierarchical mode: lead_agent must exist in agents
  if (c.process === "hierarchical" && c.lead_agent && !agentIds.has(c.lead_agent)) {
    return { ok: false, error: `hierarchical crew lead_agent "${c.lead_agent}" is not in agents[]` };
  }
  // Graph mode: validate edges reference real tasks AND that any edge.when
  // predicates parse cleanly (catch design-time predicate errors before runtime).
  if (c.process === "graph" && c.edges) {
    for (const e of c.edges) {
      if (!taskIds.has(e.from_task)) {
        return { ok: false, error: `edge from_task "${e.from_task}" is not in tasks[]` };
      }
      if (!taskIds.has(e.to_task)) {
        return { ok: false, error: `edge to_task "${e.to_task}" is not in tasks[]` };
      }
      if (e.when !== undefined && e.when !== null) {
        const predicateError = validatePredicate(e.when);
        if (predicateError !== null) {
          return {
            ok: false,
            error: `edge ${e.from_task} → ${e.to_task} has invalid when predicate: ${predicateError}`,
          };
        }
      }
    }
  }

  // Phase 4 partial — validate tool bindings at design time. Three kinds:
  //   - builtin: shape check (name is a non-empty string)
  //   - mcp:     shape check (server + tool are non-empty strings)
  //   - subagent: agent_id must exist in this crew's agents[] OR cast-roster
  // Runtime tool execution is NOT yet implemented — see PURPOSE.md
  // § "Tool resolution" for the gap. Validation here is preparatory.
  for (const agent of c.agents) {
    if (!agent.tools) continue;
    for (const tool of agent.tools as unknown[]) {
      if (typeof tool !== "object" || tool === null) {
        return { ok: false, error: `agent ${agent.id} has malformed tool binding (not an object)` };
      }
      const t = tool as { kind?: string };
      if (t.kind === "builtin") {
        const b = tool as { kind: "builtin"; name?: unknown };
        if (typeof b.name !== "string" || b.name.length === 0) {
          return { ok: false, error: `agent ${agent.id} builtin tool missing or empty 'name'` };
        }
      } else if (t.kind === "mcp") {
        const m = tool as { kind: "mcp"; server?: unknown; tool?: unknown };
        if (typeof m.server !== "string" || m.server.length === 0) {
          return { ok: false, error: `agent ${agent.id} mcp tool missing or empty 'server'` };
        }
        if (typeof m.tool !== "string" || m.tool.length === 0) {
          return { ok: false, error: `agent ${agent.id} mcp tool missing or empty 'tool'` };
        }
      } else if (t.kind === "subagent") {
        const s = tool as { kind: "subagent"; agent_id?: unknown };
        if (typeof s.agent_id !== "string" || s.agent_id.length === 0) {
          return { ok: false, error: `agent ${agent.id} subagent tool missing or empty 'agent_id'` };
        }
        // Subagent must reference a crew agent (cast-roster lookup is runtime-only).
        if (!agentIds.has(s.agent_id)) {
          return {
            ok: false,
            error: `agent ${agent.id} subagent tool references unknown agent_id "${s.agent_id}" (must be in this crew's agents[])`,
          };
        }
      } else {
        return { ok: false, error: `agent ${agent.id} tool has unknown kind "${t.kind ?? "<missing>"}"` };
      }
    }
  }

  return { ok: true, crew: c };
}

// ── Agent → bible resolution ─────────────────────────────────────────

/**
 * Synthesise a CharacterBible-shaped object from a crew agent's
 * role/goal/backstory. Used for ad-hoc agents that aren't in the cast.
 */
function synthesiseBible(agent: CrewAgentDefinition): CharacterBible {
  const taskBoundariesArr = agent.task_boundaries
    ? agent.task_boundaries.split(/[.\n]/).map((s) => s.trim()).filter(Boolean)
    : [];
  const draws = taskBoundariesArr.length > 0
    ? taskBoundariesArr
    : ["the task at hand", "their stated goal", "their backstory"];

  return {
    name: agent.id,
    role: agent.role,
    voice: agent.backstory,
    posture: agent.goal,
    draws,
    refusals: [
      "ignoring the task description",
      "refusing the assigned work without good reason",
    ],
    catchphrases: [],
    forbidden: [],
    defaultMode: "azure",
    // Cast-UI fields stubbed:
    pronouns: "they/them",
    aspects: [],
    relationships: [],
    bio: agent.backstory,
    age: null,
    gender: null,
    location: null,
    avatarStyle: "minimal",
    color: { primary: "#888888", secondary: "#cccccc" },
    sigil: "",
    house: null,
  } as unknown as CharacterBible;
}

/**
 * Resolve a crew agent definition to the bible used for `respond()`.
 * Cast members win — if `agent.id` matches a cast member, use that
 * bible. Otherwise synthesise from role/goal/backstory.
 */
function resolveBible(agent: CrewAgentDefinition): { bible: CharacterBible; from: "cast" | "synthesised" } {
  try {
    const member = getMember(agent.id as never);
    return { bible: member.bible, from: "cast" };
  } catch {
    return { bible: synthesiseBible(agent), from: "synthesised" };
  }
}

// ── Per-task dispatch ────────────────────────────────────────────────

/**
 * Build the contextSuffix for a single task — combines the agent's
 * system_prompt_suffix, task_boundaries, expected_output hint, and any
 * inbound context variables into a single string.
 */
function buildContextSuffix(
  agent: CrewAgentDefinition,
  task: CrewTask,
  contextIn: Record<string, unknown>,
  globalPrompt?: string,
): string {
  const parts: string[] = [];
  if (globalPrompt) parts.push(`Crew brief: ${globalPrompt}`);
  if (agent.system_prompt_suffix) parts.push(agent.system_prompt_suffix);
  if (task.expected_output) parts.push(`Expected output: ${task.expected_output}`);
  if (agent.task_boundaries) {
    parts.push(`Task boundaries: ${agent.task_boundaries}`);
  }
  if (Object.keys(contextIn).length > 0) {
    parts.push(
      `Context from prior tasks:\n${Object.entries(contextIn)
        .map(([k, v]) => `  ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join("\n")}`,
    );
  }
  return parts.join("\n\n");
}

/**
 * Execute one task, returning the resulting CrewTurn.
 */
async function runOneTask(
  crew: CrewDefinition,
  task: CrewTask,
  runId: string,
  contextIn: Record<string, unknown>,
  globalPrompt: string | undefined,
  wave?: number,
): Promise<CrewTurn> {
  const agent = crew.agents.find((a) => a.id === task.assigned_agent);
  if (!agent) {
    throw new Error(`task ${task.id} references unknown agent ${task.assigned_agent}`);
  }

  const { bible, from } = resolveBible(agent);
  const contextSuffix = buildContextSuffix(agent, task, contextIn, globalPrompt);

  log.info("running task", {
    run_id: runId,
    task_id: task.id,
    agent_id: agent.id,
    bible_source: from,
    wave,
  });

  const t0 = Date.now();
  // Honour task.retries (schema default: 1 = two total attempts).
  // retries: 0 means single attempt, retries: 3 means four attempts.
  const retriesAllowed = task.retries ?? 1;
  // Tool-using agents (agent.tools[] non-empty) take the ReAct path via
  // respondWithTools; everyone else uses the plain respond() dispatch.
  // This is gated so tool-less crews keep the verified behaviour exactly.
  const useTools = !!(agent.tools && agent.tools.length > 0);
  let turnText: string | null = null;
  let turnIntent: string | null = null;
  let turnMode: string | null = null;
  let lastErr: string | null = null;
  for (let attempt = 0; attempt <= retriesAllowed; attempt++) {
    try {
      if (useTools) {
        const r = await respondWithTools({
          crew,
          agent,
          bible,
          userText: task.description,
          contextSuffix,
          runId,
        });
        turnText = r.text;
        // intent/mode aren't produced by the tool path — leave null.
      } else {
        const r = await respond({
          speakerId: agent.id,
          bible,
          userText: task.description,
          provider: agent.provider,
          contextSuffix,
        });
        turnText = r.text;
        turnIntent = r.intent;
        turnMode = r.mode;
      }
      // Phase 4 partial — output_schema validation. If present, parse
      // and check; failures throw so the retry loop catches them.
      if (task.output_schema) {
        const validation = validateOutputAgainstSchema(turnText, task.output_schema);
        if (!validation.ok) {
          throw new Error(`task ${task.id} output_schema validation failed: ${validation.error}`);
        }
      }
      if (attempt > 0) {
        log.info("task succeeded on retry", { run_id: runId, task_id: task.id, attempt });
      }
      break;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      turnText = null;
      if (attempt < retriesAllowed) {
        log.warn("task failed, retrying", {
          run_id: runId,
          task_id: task.id,
          attempt: attempt + 1,
          of: retriesAllowed + 1,
          error: lastErr,
        });
      }
    }
  }
  if (turnText === null) {
    throw new Error(
      `task ${task.id} (agent ${agent.id}) failed after ${retriesAllowed + 1} attempt(s): ${lastErr ?? "unknown error"}`,
    );
  }
  // Phase 4 partial — output_path persistence. Best-effort: write the
  // task's text to the declared path if we're running in Node and the
  // path is set. Failures log a warning but don't fail the task.
  if (task.output_path) {
    await writeOutputPath(task, runId, turnText).catch((err) => {
      log.warn("output_path write failed", {
        run_id: runId,
        task_id: task.id,
        output_path: task.output_path,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }
  const duration_ms = Date.now() - t0;

  return {
    run_id: runId,
    agent_id: agent.id,
    task_id: task.id,
    text: turnText,
    intent: turnIntent,
    mode: turnMode,
    duration_ms,
    wave,
  };
}

// ── DAG construction ─────────────────────────────────────────────────

/**
 * Build the dependency edges for hierarchical or graph mode. Each task
 * contributes its `depends_on` entries; graph mode also pulls from
 * `crew.edges`. Returns a map from task.id to the set of task ids it
 * depends on.
 */
function buildDeps(crew: CrewDefinition): Map<string, Set<string>> {
  const deps = new Map<string, Set<string>>();
  for (const t of crew.tasks) {
    const set = new Set<string>(t.depends_on ?? []);
    deps.set(t.id, set);
  }
  // Graph mode adds explicit edges. Tasks linked by edges treat the
  // from_task as a dependency of the to_task (in addition to depends_on).
  if (crew.process === "graph" && crew.edges) {
    for (const e of crew.edges) {
      const set = deps.get(e.to_task);
      if (set) set.add(e.from_task);
    }
  }
  return deps;
}

/**
 * Compute topological waves: array of arrays where waves[i] are the
 * task ids whose dependencies are all in waves[0..i-1]. Throws if the
 * dependency graph has a cycle.
 */
function topologicalWaves(crew: CrewDefinition): string[][] {
  const deps = buildDeps(crew);
  const allTasks = new Set(crew.tasks.map((t) => t.id));
  const done = new Set<string>();
  const waves: string[][] = [];
  let iteration = 0;
  const maxIterations = crew.tasks.length + 1; // safety bound

  while (done.size < allTasks.size) {
    iteration++;
    if (iteration > maxIterations) {
      const remaining = [...allTasks].filter((t) => !done.has(t));
      throw new Error(
        `dependency cycle detected — unresolvable tasks: ${remaining.join(", ")}`,
      );
    }
    const ready = [...allTasks].filter((id) => {
      if (done.has(id)) return false;
      const taskDeps = deps.get(id) ?? new Set();
      for (const d of taskDeps) {
        if (!done.has(d)) return false;
      }
      return true;
    });
    if (ready.length === 0) {
      const remaining = [...allTasks].filter((t) => !done.has(t));
      throw new Error(
        `dependency cycle detected — no ready tasks among: ${remaining.join(", ")}`,
      );
    }
    waves.push(ready);
    for (const id of ready) done.add(id);
  }
  return waves;
}

// ── The capability entry point ───────────────────────────────────────

export async function runCrew(input: CrewRunInput): Promise<CrewRunResult> {
  const runId = input.run_id ?? generateRunId();
  const validation = validateCrew(input.crew);
  if (!validation.ok) {
    return {
      status: "error",
      run_id: runId,
      crew_id: (input.crew as { id?: string }).id ?? "<unknown>",
      error: `Crew validation failed: ${validation.error}`,
      partial_turns: [],
    };
  }

  const crew = validation.crew;
  log.info("starting crew run", {
    run_id: runId,
    crew_id: crew.id,
    process: crew.process,
    agents: crew.agents.length,
    tasks: crew.tasks.length,
  });

  const t0 = Date.now();

  if (crew.process === "sequential") return runSequential(crew, runId, input, t0);
  if (crew.process === "parallel") return runParallel(crew, runId, input, t0);
  if (crew.process === "hierarchical") return runHierarchical(crew, runId, input, t0);
  if (crew.process === "graph") return runGraph(crew, runId, input, t0);

  // Only swarm remains stubbed.
  return notImplementedYet(crew, runId);
}

/**
 * Sequential execution: each task awaits the previous. Each task's
 * output becomes a context variable keyed by task.id, available to
 * subsequent tasks via their contextIn.
 */
async function runSequential(
  crew: CrewDefinition,
  runId: string,
  input: CrewRunInput,
  t0: number,
): Promise<CrewRunResult> {
  const turns: CrewTurn[] = [];
  const contextOut: Record<string, unknown> = { ...(crew.context_variables ?? {}) };

  for (const task of crew.tasks) {
    try {
      const turn = await runOneTask(crew, task, runId, contextOut, input.prompt);
      turns.push(turn);
      contextOut[task.id] = turn.text;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error("sequential task failed", { run_id: runId, task_id: task.id, error: message });
      return {
        status: "error",
        run_id: runId,
        crew_id: crew.id,
        error: message,
        partial_turns: turns,
      };
    }
  }

  return {
    status: "ok",
    run_id: runId,
    crew_id: crew.id,
    turns,
    context_out: contextOut,
    total_duration_ms: Date.now() - t0,
  };
}

/**
 * Parallel execution: Promise.allSettled all tasks against the initial
 * context. Tasks cannot see each other's outputs in-flight; they only
 * see the crew's `context_variables`. A single failed task short-
 * circuits with partial_turns of whatever resolved.
 */
async function runParallel(
  crew: CrewDefinition,
  runId: string,
  input: CrewRunInput,
  t0: number,
): Promise<CrewRunResult> {
  const contextIn = { ...(crew.context_variables ?? {}) };

  const settled = await Promise.allSettled(
    crew.tasks.map((task) => runOneTask(crew, task, runId, contextIn, input.prompt)),
  );

  const turns: CrewTurn[] = [];
  const errors: string[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") {
      turns.push(r.value);
    } else {
      const message = r.reason instanceof Error ? r.reason.message : String(r.reason);
      errors.push(message);
    }
  }

  if (errors.length > 0) {
    return {
      status: "error",
      run_id: runId,
      crew_id: crew.id,
      error: `${errors.length} task(s) failed: ${errors.join("; ")}`,
      partial_turns: turns,
    };
  }

  const contextOut: Record<string, unknown> = { ...contextIn };
  for (let i = 0; i < crew.tasks.length; i++) {
    const task = crew.tasks[i]!;
    const turn = turns[i]!;
    contextOut[task.id] = turn.text;
  }

  return {
    status: "ok",
    run_id: runId,
    crew_id: crew.id,
    turns,
    context_out: contextOut,
    total_duration_ms: Date.now() - t0,
  };
}

/**
 * Run the topological DAG: each wave is a set of tasks whose dependencies
 * are all complete. Waves run sequentially; tasks WITHIN a wave run in
 * parallel via Promise.allSettled. Used by both hierarchical and graph.
 *
 * Graph mode additionally evaluates `edge.when` predicates after each
 * task completes: edges resolving to false mark the target task as
 * skipped. Skipping is transitive — tasks whose deps are all skipped
 * are also skipped. Skipped tasks don't fire HITL pauses and don't
 * contribute to the synthesis pass in hierarchical mode (n/a since
 * hierarchical doesn't use `edges`).
 *
 * Returns the turns array (in completion order across waves), the
 * waves structure (for trace), the context_out record, and the set of
 * skipped task ids.
 */
async function executeDag(
  crew: CrewDefinition,
  runId: string,
  input: CrewRunInput,
): Promise<
  | { ok: true; turns: CrewTurn[]; waves: string[][]; context_out: Record<string, unknown>; skipped_task_ids: string[] }
  | { ok: false; turns: CrewTurn[]; waves: string[][]; error: string }
  | { ok: "paused"; turns: CrewTurn[]; waves: string[][]; context_out: Record<string, unknown>; paused_at_task: string; completed_task_ids: string[]; skipped_task_ids: string[] }
> {
  let waves: string[][];
  // If resuming, use the saved waves; otherwise compute fresh.
  if (input.resume_from) {
    waves = input.resume_from.waves;
  } else {
    try {
      waves = topologicalWaves(crew);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, turns: [], waves: [], error: message };
    }
  }

  // Bootstrap from resume_from if present.
  const turns: CrewTurn[] = input.resume_from
    ? [...input.resume_from.prior_turns]
    : [];
  const contextOut: Record<string, unknown> = input.resume_from
    ? { ...input.resume_from.context_out }
    : { ...(crew.context_variables ?? {}) };
  const completedIds = new Set<string>(
    input.resume_from?.completed_task_ids ?? [],
  );
  const skippedIds = new Set<string>(
    input.resume_from?.skipped_task_ids ?? [],
  );

  // Build outgoing-edge map for graph mode (faster than scanning crew.edges each task).
  const outgoingEdges = new Map<string, CrewEdge[]>();
  if (crew.process === "graph" && crew.edges) {
    for (const e of crew.edges) {
      const list = outgoingEdges.get(e.from_task) ?? [];
      list.push(e);
      outgoingEdges.set(e.from_task, list);
    }
  }

  // Deps map for transitive-skip logic. Populated lazily.
  const depsMap = buildDeps(crew);

  for (let w = 0; w < waves.length; w++) {
    const waveTaskIds = waves[w]!;

    // Skip already-completed (resume) and already-skipped tasks.
    // Also propagate skips transitively: if any of a task's deps is in
    // skippedIds, skip the task too.
    const remainingIds: string[] = [];
    for (const id of waveTaskIds) {
      if (completedIds.has(id) || skippedIds.has(id)) continue;
      const taskDeps = depsMap.get(id) ?? new Set();
      let depSkipped = false;
      for (const d of taskDeps) {
        if (skippedIds.has(d)) {
          depSkipped = true;
          break;
        }
      }
      if (depSkipped) {
        skippedIds.add(id);
        log.info("task transitively skipped (upstream dep skipped)", {
          run_id: runId,
          task_id: id,
          wave: w,
        });
        continue;
      }
      remainingIds.push(id);
    }

    if (remainingIds.length === 0) {
      log.info("wave has no runnable tasks (all completed or skipped)", {
        run_id: runId,
        wave: w,
      });
      continue;
    }

    const waveTasks = remainingIds.map((id) => {
      const task = crew.tasks.find((t) => t.id === id);
      if (!task) throw new Error(`internal: wave references missing task ${id}`);
      return task;
    });

    log.info("running wave", {
      run_id: runId,
      wave: w,
      task_ids: remainingIds,
      resumed: !!input.resume_from && w === 0,
    });

    const settled = await Promise.allSettled(
      waveTasks.map((task) => runOneTask(crew, task, runId, contextOut, input.prompt, w)),
    );

    const errors: string[] = [];
    const waveCompletedTasks: CrewTask[] = [];
    for (let i = 0; i < settled.length; i++) {
      const r = settled[i]!;
      const task = waveTasks[i]!;
      if (r.status === "fulfilled") {
        turns.push(r.value);
        contextOut[r.value.task_id] = r.value.text;
        completedIds.add(r.value.task_id);
        waveCompletedTasks.push(task);
      } else {
        const message = r.reason instanceof Error ? r.reason.message : String(r.reason);
        errors.push(message);
      }
    }

    if (errors.length > 0) {
      return {
        ok: false,
        turns,
        waves,
        error: `wave ${w}: ${errors.length} task(s) failed: ${errors.join("; ")}`,
      };
    }

    // Phase 3 — evaluate outgoing `edge.when` predicates for each
    // just-completed task (graph mode only). Edges resolving false add
    // their `to_task` to skippedIds.
    if (crew.process === "graph") {
      for (const task of waveCompletedTasks) {
        const outgoing = outgoingEdges.get(task.id) ?? [];
        for (const edge of outgoing) {
          if (edge.when === undefined || edge.when === null || edge.when.trim() === "") {
            // Unconditional edge — always traversed.
            continue;
          }
          let passes: boolean;
          try {
            passes = evaluatePredicate(edge.when, contextOut);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
              ok: false,
              turns,
              waves,
              error: `edge ${edge.from_task} → ${edge.to_task} predicate eval failed: ${message}`,
            };
          }
          if (!passes) {
            skippedIds.add(edge.to_task);
            log.info("edge predicate false — task skipped", {
              run_id: runId,
              from_task: edge.from_task,
              to_task: edge.to_task,
              when: edge.when,
            });
          }
        }
      }
    }

    // Phase 4-partial — check if any just-completed tasks declared
    // human_in_the_loop. Pause AFTER the wave so parallel siblings
    // complete. Skipped tasks don't count for HITL — they never ran.
    const hitlTask = waveCompletedTasks.find((t) => t.human_in_the_loop === true);
    if (hitlTask) {
      log.info("pausing for human approval", {
        run_id: runId,
        wave: w,
        paused_at_task: hitlTask.id,
      });
      return {
        ok: "paused",
        turns,
        waves,
        context_out: contextOut,
        paused_at_task: hitlTask.id,
        completed_task_ids: [...completedIds],
        skipped_task_ids: [...skippedIds],
      };
    }
  }

  return {
    ok: true,
    turns,
    waves,
    context_out: contextOut,
    skipped_task_ids: [...skippedIds],
  };
}

/**
 * Hierarchical execution: topological DAG over the declared tasks,
 * then a final synthesis turn by the lead_agent that wraps all worker
 * outputs into one coherent answer to the crew brief.
 *
 * The lead is NOT doing runtime decomposition — the tasks are already
 * declared. The lead's job is final synthesis. This matches CrewAI's
 * manager-led pattern but uses the declared task graph rather than
 * LLM-routed dispatch (deterministic, no JSON-parse failures).
 */
async function runHierarchical(
  crew: CrewDefinition,
  runId: string,
  input: CrewRunInput,
  t0: number,
): Promise<CrewRunResult> {
  if (!crew.lead_agent) {
    return {
      status: "error",
      run_id: runId,
      crew_id: crew.id,
      error: "hierarchical mode requires lead_agent (caught at validate, defensive check here)",
      partial_turns: [],
    };
  }

  const dagResult = await executeDag(crew, runId, input);
  if (dagResult.ok === false) {
    return {
      status: "error",
      run_id: runId,
      crew_id: crew.id,
      error: dagResult.error,
      partial_turns: dagResult.turns,
    };
  }
  if (dagResult.ok === "paused") {
    // Bubble the pause up; the lead's synthesis runs only after all DAG
    // tasks complete (including post-resume).
    return {
      status: "paused_for_approval",
      run_id: runId,
      crew_id: crew.id,
      turns: dagResult.turns,
      paused_at_task: dagResult.paused_at_task,
      resume_state: {
        completed_task_ids: dagResult.completed_task_ids,
        context_out: dagResult.context_out,
        waves: dagResult.waves,
        prior_turns: dagResult.turns,
        skipped_task_ids: dagResult.skipped_task_ids,
      },
      partial_duration_ms: Date.now() - t0,
    };
  }

  // Final synthesis pass by the lead agent.
  const leadAgent = crew.agents.find((a) => a.id === crew.lead_agent);
  if (!leadAgent) {
    return {
      status: "error",
      run_id: runId,
      crew_id: crew.id,
      error: `lead_agent "${crew.lead_agent}" not found in agents[] (caught at validate)`,
      partial_turns: dagResult.turns,
    };
  }

  const synthesisDescription = buildSynthesisPrompt(
    crew,
    dagResult.turns,
    input.prompt,
    dagResult.skipped_task_ids,
  );
  const synthesisTask: CrewTask = {
    id: "__synthesis__",
    description: synthesisDescription,
    assigned_agent: leadAgent.id,
    expected_output: "A single coherent answer to the crew brief, drawing on all worker outputs.",
  };

  let synthesisTurn: CrewTurn;
  try {
    synthesisTurn = await runOneTask(crew, synthesisTask, runId, dagResult.context_out, input.prompt, -1);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: "error",
      run_id: runId,
      crew_id: crew.id,
      error: `synthesis pass failed: ${message}`,
      partial_turns: dagResult.turns,
    };
  }

  const allTurns = [...dagResult.turns, synthesisTurn];
  const finalContext = { ...dagResult.context_out, __synthesis__: synthesisTurn.text };

  return {
    status: "ok",
    run_id: runId,
    crew_id: crew.id,
    turns: allTurns,
    context_out: finalContext,
    total_duration_ms: Date.now() - t0,
    waves: dagResult.waves,
    skipped_task_ids: dagResult.skipped_task_ids,
  };
}

/**
 * Graph execution: topological DAG over the declared tasks + explicit
 * crew.edges (with conditional `edge.when` routing). No synthesis pass;
 * the graph IS the result.
 */
async function runGraph(
  crew: CrewDefinition,
  runId: string,
  input: CrewRunInput,
  t0: number,
): Promise<CrewRunResult> {
  const dagResult = await executeDag(crew, runId, input);
  if (dagResult.ok === false) {
    return {
      status: "error",
      run_id: runId,
      crew_id: crew.id,
      error: dagResult.error,
      partial_turns: dagResult.turns,
    };
  }
  if (dagResult.ok === "paused") {
    return {
      status: "paused_for_approval",
      run_id: runId,
      crew_id: crew.id,
      turns: dagResult.turns,
      paused_at_task: dagResult.paused_at_task,
      resume_state: {
        completed_task_ids: dagResult.completed_task_ids,
        context_out: dagResult.context_out,
        waves: dagResult.waves,
        prior_turns: dagResult.turns,
        skipped_task_ids: dagResult.skipped_task_ids,
      },
      partial_duration_ms: Date.now() - t0,
    };
  }

  return {
    status: "ok",
    run_id: runId,
    crew_id: crew.id,
    turns: dagResult.turns,
    context_out: dagResult.context_out,
    total_duration_ms: Date.now() - t0,
    waves: dagResult.waves,
    skipped_task_ids: dagResult.skipped_task_ids,
  };
}

/**
 * Build the synthesis prompt for the lead agent. Includes the crew
 * brief (if any), all worker turns with their agent + task labels, any
 * skipped tasks (so the lead knows what wasn't done), and an
 * instruction to synthesise.
 */
function buildSynthesisPrompt(
  crew: CrewDefinition,
  workerTurns: CrewTurn[],
  globalPrompt: string | undefined,
  skippedTaskIds: string[],
): string {
  const parts: string[] = [];
  parts.push(`You are the lead orchestrator for the "${crew.name}" crew.`);
  parts.push(
    `${workerTurns.length} worker agent(s) have completed their tasks. Read their outputs and synthesise a single coherent answer.`,
  );
  if (globalPrompt) {
    parts.push(`The crew brief was:\n  ${globalPrompt}`);
  }
  parts.push(`The crew's purpose: ${crew.description ?? crew.name}`);
  parts.push(`Worker outputs:`);
  for (const turn of workerTurns) {
    const task = crew.tasks.find((t) => t.id === turn.task_id);
    const taskDesc = task ? task.description.slice(0, 200) : turn.task_id;
    parts.push(`---`);
    parts.push(`Agent: ${turn.agent_id}`);
    parts.push(`Task ${turn.task_id}: ${taskDesc}`);
    parts.push(`Output: ${turn.text}`);
  }
  if (skippedTaskIds.length > 0) {
    parts.push(`---`);
    parts.push(`Note — the following tasks were SKIPPED due to conditional routing:`);
    for (const id of skippedTaskIds) {
      const task = crew.tasks.find((t) => t.id === id);
      const desc = task ? task.description.slice(0, 120) : id;
      parts.push(`  • ${id}: ${desc}`);
    }
    parts.push(`Factor these absences into the synthesis where they matter.`);
  }
  parts.push(`---`);
  parts.push(
    `Synthesise the above into a single answer. Do not just repeat the worker outputs — integrate them. Honour the voice of the lead agent (you).`,
  );
  return parts.join("\n\n");
}

/**
 * Swarm mode still returns a structured stub.
 */
function notImplementedYet(crew: CrewDefinition, runId: string): CrewRunResult {
  const plannedSteps: string[] = [];
  plannedSteps.push(`[validate] crew "${crew.id}" schema-validated against subset of crew-schema.json`);
  plannedSteps.push(`[resolve] agents (${crew.agents.length}): ${crew.agents.map((a) => a.id).join(", ")}`);
  plannedSteps.push(`[resolve] tasks (${crew.tasks.length}): ${crew.tasks.map((t) => t.id).join(", ")}`);
  plannedSteps.push(`[mode] process="${crew.process}"`);
  plannedSteps.push(
    `[exec] swarm would do dynamic handoffs based on context_variables + crew.handoffs; first agent runs, decides next via condition evaluation`,
  );
  plannedSteps.push(`[aggregate] would collect CrewTurn[] into CrewRunResult`);

  return {
    status: "not_implemented_yet",
    run_id: runId,
    crew_id: crew.id,
    planned_steps: plannedSteps,
    see: "lib/capabilities/agent/crew-run.PURPOSE.md § Build phases, and docs/SYSTEM.md § Layer 5: Crew schema",
  };
}

// ── Diagnostic helpers ───────────────────────────────────────────────

/**
 * Quick summary of a crew without running it.
 */
export function summariseCrew(crew: CrewDefinition): {
  agents: number;
  tasks: number;
  process: CrewProcessMode;
  has_lead: boolean;
  has_lineage: boolean;
  has_handoffs: boolean;
  has_edges: boolean;
  conditional_edges: number;
  tools_total: number;
  tools_by_kind: { builtin: number; mcp: number; subagent: number };
  tasks_with_output_schema: number;
  tasks_with_output_path: number;
  tasks_with_hitl: number;
} {
  const conditionalEdges =
    (crew.edges ?? []).filter((e) => e.when !== undefined && e.when !== null && e.when.trim() !== "").length;
  let builtin = 0, mcp = 0, subagent = 0;
  for (const a of crew.agents) {
    for (const t of a.tools ?? []) {
      if (t.kind === "builtin") builtin++;
      else if (t.kind === "mcp") mcp++;
      else if (t.kind === "subagent") subagent++;
    }
  }
  const tasksWithOutputSchema = crew.tasks.filter((t) => !!t.output_schema).length;
  const tasksWithOutputPath = crew.tasks.filter((t) => !!t.output_path).length;
  const tasksWithHitl = crew.tasks.filter((t) => t.human_in_the_loop === true).length;
  return {
    agents: crew.agents.length,
    tasks: crew.tasks.length,
    process: crew.process,
    has_lead: !!crew.lead_agent,
    has_lineage: !!crew.lineage,
    has_handoffs: !!(crew.handoffs && crew.handoffs.length > 0),
    has_edges: !!(crew.edges && crew.edges.length > 0),
    conditional_edges: conditionalEdges,
    tools_total: builtin + mcp + subagent,
    tools_by_kind: { builtin, mcp, subagent },
    tasks_with_output_schema: tasksWithOutputSchema,
    tasks_with_output_path: tasksWithOutputPath,
    tasks_with_hitl: tasksWithHitl,
  };
}

/**
 * Predict the topological waves for a crew without running it. Useful
 * for UI surfaces that want to show the planned execution graph before
 * committing to the LLM dispatches. NOTE: conditional `edge.when`
 * predicates can only be evaluated at runtime against accumulated
 * context, so the predicted waves represent the WORST-CASE execution
 * (every conditional edge taken).
 */
export function predictWaves(crew: CrewDefinition): { ok: true; waves: string[][] } | { ok: false; error: string } {
  try {
    const waves = topologicalWaves(crew);
    return { ok: true, waves };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Internal helpers ─────────────────────────────────────────────────

function generateRunId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `crew-run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Write a task's output to `task.output_path` if running in Node.
 * Best-effort: silent skip in non-Node environments (browser, edge).
 * Creates parent directories as needed.
 */
async function writeOutputPath(task: CrewTask, runId: string, text: string): Promise<void> {
  if (!task.output_path) return;
  // Detect Node runtime. Vercel edge runtime defines process but not process.versions.node.
  const isNode =
    typeof process !== "undefined" &&
    typeof (process as { versions?: { node?: string } }).versions?.node === "string";
  if (!isNode) {
    log.info("output_path skipped — not running in Node", { run_id: runId, task_id: task.id });
    return;
  }
  // Dynamic import so bundlers can tree-shake the fs imports out of browser bundles.
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  await fs.mkdir(path.dirname(task.output_path), { recursive: true });
  await fs.writeFile(task.output_path, text, "utf8");
  log.info("output_path written", {
    run_id: runId,
    task_id: task.id,
    output_path: task.output_path,
    bytes: text.length,
  });
}
