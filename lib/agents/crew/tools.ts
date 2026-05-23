/**
 * lib/agents/crew/tools.ts — Tool invocation for the crew runner.
 *
 * Resolves a specialist's tool-call request against the registry,
 * validates authorisation, and returns a `tool` trail step (either
 * success with a result, or failure with an error). Extracted from
 * `crew.ts` to keep the orchestrator under the 300-line cap.
 */

import "server-only";

import type { CrewStep, Specialist, ToolCall, ToolRegistry } from "./types";

export async function runTool(opts: {
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
