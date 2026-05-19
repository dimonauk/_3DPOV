/**
 * lib/agents/crew/types.ts — Crew core type definitions.
 *
 * The shapes that the orchestration runner consumes and emits. Mirrors
 * the CrewAI Agent/Task/Crew vocabulary (role / goal / backstory /
 * tools / allow_delegation) so it reads familiarly, then carries a
 * couple of extras the Holoflow runner needs:
 *
 *   - `preferredModel` per specialist — pre-resolved by the caller via
 *     `lib/agents/model-router.ts`. Saves the runner from re-routing
 *     every step.
 *   - `systemPrompt` is pre-built. The runner does NOT synthesise the
 *     prompt from role/goal/backstory; that's the caller's job (a
 *     specialist factory consults the cast bible and `lib/agents/
 *     system-prompt.ts`). This keeps the crew module pure framework.
 *
 * No runtime values, no I/O — just types. Safe to import anywhere.
 */

import "server-only";

import type { LLMProvider, LLMVia } from "lib/agents/llm-client";

// ---------------------------------------------------------------------
// Specialist — a single agent ("Aura", "Marcel", "Coco", …)
// ---------------------------------------------------------------------

/**
 * One participant in a crew. Combines voice (role/goal/backstory),
 * routing (preferredModel), and capability (tools + delegation flag).
 *
 * `systemPrompt` is the pre-built per-specialist prompt — typically
 * assembled by a specialist loader from `data/agents/<slug>.json` plus
 * the cast bible. The runner concatenates it with task context, never
 * synthesises it itself.
 */
export type Specialist = {
  /** Stable identifier — e.g. "aura", "marcel". Lowercase, kebab-case. */
  slug: string;
  /** Human-readable name shown in the trail. */
  displayName: string;
  /** Short role label, CrewAI-style — e.g. "The Architect". */
  role: string;
  /** One-sentence north star — what this specialist exists to do. */
  goal: string;
  /** 2-3 sentences. Informs voice; the runner passes this through to the model. */
  backstory: string;
  /** Pre-routed model choice. Caller uses `lib/agents/model-router.ts` to derive this. */
  preferredModel: {
    provider: LLMProvider;
    model: string;
    via: LLMVia;
  };
  /** Tool names the specialist is allowed to invoke. Resolved by `ToolRegistry`. */
  tools: ReadonlyArray<string>;
  /** Whether this specialist may hand off subtasks to another. */
  allowDelegation: boolean;
  /** Pre-built system prompt. The runner uses this verbatim as the system message. */
  systemPrompt: string;
};

// ---------------------------------------------------------------------
// Task — the work the crew is being asked to do
// ---------------------------------------------------------------------

export type Task = {
  /** Stable id for tracing — caller-supplied. */
  id: string;
  /** Plain-English description of what the crew should accomplish. */
  description: string;
  /** Optional structured context — refs, topic, prior outputs, etc. */
  context?: Record<string, unknown>;
  /** Optional shape contract — "markdown article, 600-800 words". */
  expectedOutput?: string;
  /** Optional pin: if set, skip planning and route the whole task to this slug. */
  assignTo?: string;
};

// ---------------------------------------------------------------------
// Tool call — runner ↔ ToolRegistry interface
// ---------------------------------------------------------------------

/**
 * The JSON shape a specialist emits when it wants a tool invoked.
 * Anything that doesn't parse to this is treated as plain answer text.
 */
export type ToolCall = {
  tool: string;
  args: unknown;
};

/**
 * Minimal tool-registry shape. The parallel tools agent will define
 * the canonical one at `lib/agents/tools/types.ts`; until then we
 * inline this here so the crew module type-checks in isolation.
 *
 * TODO: import from lib/agents/tools/types when it lands.
 */
export type ToolHandler = (args: unknown) => Promise<unknown>;

export type ToolRegistry = {
  /** Returns `true` if the named tool is registered. */
  has: (name: string) => boolean;
  /** Returns the handler or `undefined` if unregistered. */
  get: (name: string) => ToolHandler | undefined;
  /** List of all registered tool names (for diagnostics). */
  list: () => ReadonlyArray<string>;
};

// ---------------------------------------------------------------------
// Trail — the step-by-step record of what the crew did
// ---------------------------------------------------------------------

export type CrewStep =
  | {
      kind: "plan";
      by: string;
      reasoning: string;
      /** Optional one-step lookahead the planner predicted. */
      nextStep?: CrewStep;
    }
  | {
      kind: "delegate";
      by: string;
      to: string;
      subtask: string;
    }
  | {
      kind: "tool";
      by: string;
      tool: string;
      args: unknown;
      result?: unknown;
      error?: string;
    }
  | {
      kind: "answer";
      by: string;
      text: string;
    }
  | {
      kind: "stop";
      reason: string;
    };

// ---------------------------------------------------------------------
// Run result
// ---------------------------------------------------------------------

export type CrewRun = {
  taskId: string;
  trail: CrewStep[];
  /** The synthesised final output — orchestrator's answer, or the last answer if synthesis was skipped. */
  output: string;
  /** Whether the run produced an answer (vs. erroring out / hitting maxIterations with nothing). */
  ok: boolean;
  /** Number of dispatch iterations consumed. */
  iterations: number;
  /** Aggregate token usage across every LLM call this run made. */
  totalUsage: { inputTokens: number; outputTokens: number };
};

// ---------------------------------------------------------------------
// Runner input
// ---------------------------------------------------------------------

export type RunCrewInput = {
  task: Task;
  specialists: ReadonlyArray<Specialist>;
  /** Slug of the planning + synthesising specialist. Must appear in `specialists`. */
  orchestrator: string;
  /** Hard cap on dispatch loop iterations. Defaults to 5. */
  maxIterations?: number;
  /** Optional tool registry. When omitted, tool calls in trail are marked errored. */
  tools?: ToolRegistry;
  /** Per-LLM-call timeout in ms. Forwarded to `callLLM`. */
  timeoutMs?: number;
};
