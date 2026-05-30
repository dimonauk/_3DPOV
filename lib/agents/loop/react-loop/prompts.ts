/**
 * lib/agents/loop/react-loop/prompts.ts
 *
 * Assemble the system + opening-user messages for a ReAct loop. Pure
 * string builders — no LLM, no IO. The `renderToolCatalogue` helper
 * also filters the registry down to the specialist's allow-list and
 * returns the live tool Map so the loop can resolve names without
 * re-walking.
 */

import "server-only";

import type { Specialist } from "lib/agents/crew/types";
import type { Tool, ToolRegistry } from "lib/agents/tools/types";

/**
 * Render the tool catalogue the specialist will see + the live Map.
 * Only tools listed in `specialist.tools` are exposed — anything else
 * in the registry stays hidden so a specialist can't accidentally
 * invoke a capability it wasn't given.
 */
export function renderToolCatalogue(
  specialist: Specialist,
  tools: ToolRegistry,
): { catalogue: string; allowed: Map<string, Tool> } {
  const allowed = new Map<string, Tool>();
  for (const name of specialist.tools) {
    const tool = tools.get(name);
    if (tool) allowed.set(name, tool);
  }
  if (allowed.size === 0) {
    return {
      catalogue: "(no tools available — produce a Final Answer directly)",
      allowed,
    };
  }
  const lines: string[] = [];
  for (const tool of allowed.values()) {
    lines.push(`- ${tool.name}: ${tool.description}`);
    lines.push(`  args: ${tool.argsSchema.replace(/\s+/g, " ").trim()}`);
  }
  return { catalogue: lines.join("\n"), allowed };
}

/**
 * The ReAct format spec — appended to every specialist's system
 * prompt. Kept verbose on purpose: smaller models drift off-format
 * fast otherwise.
 */
export function reactFormatSpec(): string {
  return [
    "You operate in a ReAct (Reason + Act) loop. Each of your turns must follow exactly one of these two shapes:",
    "",
    "  Shape A — call a tool:",
    "    Thought: <one sentence on what you're about to do and why>",
    "    Action: <one tool name, copied verbatim from the tool list>",
    "    Args: <single-line JSON object matching that tool's args schema>",
    "",
    "  Shape B — finish:",
    "    Thought: <one sentence summarising the answer you reached>",
    "    Final Answer: <your full answer to the task, free form, may span multiple lines>",
    "",
    "Rules:",
    "  - Never emit both an Action and a Final Answer in the same turn.",
    "  - If a tool returns an error in an Observation, do NOT immediately retry the same call with the same args.",
    "  - Prefer fewer tool calls. If you can answer from what you already have, do.",
    "  - The Args line must be ONE line of valid JSON. No comments, no trailing commas.",
  ].join("\n");
}

/** Stitch the specialist's system prompt + tool catalogue + format spec. */
export function buildSystemPrompt(
  specialist: Specialist,
  catalogue: string,
): string {
  return [
    specialist.systemPrompt.trim(),
    "",
    "AVAILABLE TOOLS",
    catalogue,
    "",
    "OUTPUT FORMAT",
    reactFormatSpec(),
  ].join("\n");
}

/** Stitch the user task + optional context into the opening user message. */
export function buildOpeningUserMessage(
  task: string,
  context?: Record<string, unknown>,
): string {
  const parts: string[] = [`TASK\n${task.trim()}`];
  if (context && Object.keys(context).length > 0) {
    let contextJson: string;
    try {
      contextJson = JSON.stringify(context, null, 2);
    } catch {
      contextJson = String(context);
    }
    parts.push(`CONTEXT\n${contextJson}`);
  }
  parts.push("Begin.");
  return parts.join("\n\n");
}
