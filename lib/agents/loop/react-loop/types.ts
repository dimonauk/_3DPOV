/**
 * lib/agents/loop/react-loop/types.ts — Public types + constants.
 */

import type { ToolResult } from "lib/agents/tools/types";
import type { Specialist } from "lib/agents/crew/types";
import type { ToolRegistry } from "lib/agents/tools/types";

/**
 * A single recorded step in the ReAct trail. The trail is append-only
 * and order-preserving — replay it top-to-bottom and you can rebuild
 * exactly what the specialist saw and did.
 */
export type ReactStep =
  | { kind: "thought"; text: string }
  | { kind: "action"; tool: string; args: unknown; result: ToolResult }
  | { kind: "answer"; text: string };

export type ReactLoopResult = {
  /** True iff the loop reached a `Final Answer:` within `maxIterations`. */
  ok: boolean;
  /** The final answer text (or the last `thought` if `ok` is false). */
  output: string;
  /** Append-only record of everything that happened, in order. */
  trail: ReactStep[];
  /** Number of LLM-call iterations consumed (including the one that produced the answer). */
  iterations: number;
  /** Aggregate token usage across every LLM call this loop made. */
  usage: { inputTokens: number; outputTokens: number };
  /** Set when `ok` is false. Stable, machine-readable enough to grep. */
  error?: string;
};

export type RunReactLoopInput = {
  specialist: Specialist;
  task: string;
  /** Optional structured extras — drop ids, prior outputs, refs. */
  context?: Record<string, unknown>;
  /** Map of tools available; filtered by `specialist.tools` on entry. */
  tools: ToolRegistry;
  /** Hard ceiling on LLM-call iterations. Default 8. */
  maxIterations?: number;
  /** Optional crew-task id, forwarded to tool contexts for log correlation. */
  callingTaskId?: string;
  /** Per-LLM-call timeout in ms. Forwarded to `callLLM`. */
  timeoutMs?: number;
};

export const DEFAULT_MAX_ITERATIONS = 8;
export const DEFAULT_LOOP_ID_PREFIX = "react";

/** Soft cap on observation text fed back into the model. Long tool
 *  outputs balloon context and rarely add signal past this. */
export const OBSERVATION_TRUNCATE_AT = 4000;
