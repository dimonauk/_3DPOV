/**
 * components/aura/aura-launcher/types.ts — Types + storage-key
 * constants shared across the launcher's helper modules.
 *
 * Extracted from aura-launcher.tsx per ARCHITECTURE.md Rule 1.
 */

import type {
  AuraCardSummary,
  AuraClientAction,
} from "lib/aura/parse-ui-stream";

export type ToolCallRecord = {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: "pending" | "complete" | "error";
  summary?: string;
  action?: AuraClientAction;
  cards?: AuraCardSummary[];
  card?: AuraCardSummary;
};

export type Turn = {
  role: "user" | "model";
  text: string;
  /** Agent-mode tool calls fired during this turn. Not persisted. */
  toolCalls?: ToolCallRecord[];
};

export const STORAGE_KEY = "holoflow:aura-chat:v1";
export const OPEN_KEY = "holoflow:aura-chat:open";
export const AGENT_KEY = "holoflow:aura-chat:agent";
export const MAX_HISTORY = 30;
