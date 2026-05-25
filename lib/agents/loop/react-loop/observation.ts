/**
 * lib/agents/loop/react-loop/observation.ts
 *
 * Render a ToolResult into the `Observation: …` text we feed back to
 * the model. Truncates long outputs at OBSERVATION_TRUNCATE_AT so the
 * context window doesn't balloon.
 */

import type { ToolResult } from "lib/agents/tools/types";

import { OBSERVATION_TRUNCATE_AT } from "./types";

function truncate(s: string): string {
  if (s.length <= OBSERVATION_TRUNCATE_AT) return s;
  return `${s.slice(0, OBSERVATION_TRUNCATE_AT)}\n…[truncated, ${
    s.length - OBSERVATION_TRUNCATE_AT
  } chars elided]`;
}

export function stringifyObservation(result: ToolResult): string {
  if (!result.ok) return `ERROR: ${result.error}`;
  if (typeof result.output === "string") return truncate(result.output);
  try {
    return truncate(JSON.stringify(result.output, null, 2));
  } catch {
    return truncate(String(result.output));
  }
}
