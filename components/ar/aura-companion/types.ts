/**
 * components/ar/aura-companion/types.ts — Types + small constants for
 * the AuraCompanion chat surface.
 *
 * Extracted from AuraCompanion.tsx per ARCHITECTURE.md Rule 1. Pure
 * data types — the orchestrator, tool chip, and chat hook all share
 * these shapes.
 */

import type { Card } from "lib/ar/types";
import type {
  AuraClientAction,
  AuraCardSummary,
} from "lib/aura/parse-ui-stream";

// Mirrors Firestore rules + lib/cards/firestore-server.ts. Tool-call
// chips render slugs returned by the LLM through find_related_cards —
// we validate before navigating so a crafted tool output can't push
// the visitor at an arbitrary path.
export const CARD_SLUG_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

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

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  /** True while the assistant message is still streaming */
  streaming?: boolean;
  /** Tool calls fired during this assistant turn. Renders inline. */
  toolCalls?: ToolCallRecord[];
};

export type AuraCompanionProps = {
  card: Card;
  vrmUrl: string;
};
