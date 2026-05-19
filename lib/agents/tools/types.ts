import "server-only";

/**
 * lib/agents/tools/types.ts — Shared shapes for the agent tools registry.
 *
 * The crew runner gives specialists a list of registered tools and their
 * descriptions, then watches for `{"tool": "name", "args": {...}}` blobs in
 * the model's output. When one arrives, the runner looks the tool up in the
 * registry and invokes `run(args, ctx)`. Every tool returns a `ToolResult`
 * tagged union — never throws — so the runner can surface the error back to
 * the specialist as another message instead of crashing the task.
 *
 * `ToolContext` carries the calling-specialist slug (used to namespace
 * memory reads/writes) and a `taskId` for log correlation across the
 * possibly-many tool calls inside one crew task.
 */

export type ToolResult =
  | { ok: true; output: unknown }
  | { ok: false; error: string };

export type ToolContext = {
  /** Slug of the specialist calling this tool — used for memory namespacing. */
  callingSpecialist: string;
  /** Crew-task id, for logging + audit correlation. */
  taskId: string;
};

export type Tool = {
  /** Dot-namespaced tool name, e.g. "web.search", "drop.read". */
  name: string;
  /** One-line description embedded in the specialist's system prompt. */
  description: string;
  /** Free-form JSON-schema-ish description of args, embedded in the prompt. */
  argsSchema: string;
  /**
   * The actual handler. MUST NOT throw — return `{ ok: false, error }`
   * instead. The runner forwards `output` (or `error`) back to the LLM as a
   * tool-result message.
   */
  run: (args: unknown, ctx: ToolContext) => Promise<ToolResult>;
};

export type ToolRegistry = ReadonlyMap<string, Tool>;
