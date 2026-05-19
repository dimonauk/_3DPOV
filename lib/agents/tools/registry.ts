import "server-only";

/**
 * lib/agents/tools/registry.ts — the singleton tool registry.
 *
 * Build pattern: a frozen `Map<string, Tool>` constructed lazily on
 * first access. Lazy because the crew runner is only built behind a
 * route, so we shouldn't pay registry-construction cost during
 * non-agent requests.
 *
 * To add a tool, import it here and add it to TOOLS. The runner reads
 * the registry, hands the specialist the list of names + descriptions +
 * argsSchemas, and invokes `run(args, ctx)` on `{"tool": "name", ...}`.
 */

import { createLogger } from "lib/log";

import type { Tool, ToolRegistry } from "./types";
import { webSearchTool } from "./web-search";
import { webFetchTool } from "./web-fetch";
import { dropReadTool } from "./drop-read";
import { printCheckTool } from "./print-check";
import { memoryRecallTool, memoryRememberTool } from "./memory";

const log = createLogger("agents.tools.registry");

const TOOLS: ReadonlyArray<Tool> = [
  webSearchTool,
  webFetchTool,
  dropReadTool,
  printCheckTool,
  memoryRecallTool,
  memoryRememberTool,
];

let cached: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (cached) return cached;
  const m = new Map<string, Tool>();
  for (const t of TOOLS) {
    if (m.has(t.name)) {
      // Hard fail at construction time — two tools with the same name is
      // a bug in this file, not a runtime condition.
      throw new Error(`duplicate tool name: ${t.name}`);
    }
    m.set(t.name, t);
  }
  cached = m as ToolRegistry;
  log.info("registry built", {
    count: m.size,
    names: Array.from(m.keys()),
  });
  return cached;
}

/**
 * Convenience: get a tool by name. Returns undefined if not registered
 * — the runner uses this to surface "unknown tool" back to the LLM.
 */
export function getTool(name: string): Tool | undefined {
  return getToolRegistry().get(name);
}

/**
 * The list of (name, description, argsSchema) triples the crew runner
 * embeds into the specialist's system prompt so the LLM knows what's
 * available.
 */
export function listToolPromptEntries(): Array<{
  name: string;
  description: string;
  argsSchema: string;
}> {
  return Array.from(getToolRegistry().values()).map((t) => ({
    name: t.name,
    description: t.description,
    argsSchema: t.argsSchema,
  }));
}
