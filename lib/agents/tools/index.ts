import "server-only";

/**
 * lib/agents/tools/index.ts — public surface for the crew runner.
 *
 * The runner imports `getToolRegistry`, `getTool`, and
 * `listToolPromptEntries` from this file; everything else is internal.
 * The individual tool exports are re-exported in case a route wants to
 * call a single tool directly (e.g. for a smoke test).
 */

export type { Tool, ToolRegistry, ToolResult, ToolContext } from "./types";

export {
  getToolRegistry,
  getTool,
  listToolPromptEntries,
} from "./registry";

export { webSearchTool } from "./web-search";
export { webFetchTool } from "./web-fetch";
export { dropReadTool } from "./drop-read";
export { printCheckTool } from "./print-check";
export { memoryRecallTool, memoryRememberTool } from "./memory";

// Wave 2 — harness-equivalent surface.
export { fileReadTool } from "./file-read";
export { fileWriteTool } from "./file-write";
export { globFindTool } from "./glob";
export { grepSearchTool } from "./grep";
export { codeExecTool } from "./code-exec";
export { agentDispatchTool } from "./agent-dispatch";
export { codexQueryTool } from "./codex-query";
export { capabilityListTool } from "./capability-list";
export { researchRecallTool } from "./research-recall";
export { researchRecordTool } from "./research-record";
