/**
 * lib/state/agent.ts — Zustand slice: active dialogue turn state + pending intents.
 *
 * One-line role: shared state-bus for the live conversation loop — who's speaking now, what's in the queue.
 * Full purpose in agent.PURPOSE.md.
 */

import { create } from "zustand";
import type { CastMemberId } from "./cast";

export type TurnState =
  | "idle"
  | "user-speaking" // STT is open, transcript building
  | "user-finished" // STT closed, ready for dialogue capability
  | "agent-thinking" // LLM call in flight
  | "agent-speaking" // TTS playing
  | "interrupted"; // user spoke over the agent

export type Intent = {
  /** Free-text intent label from the dialogue capability. */
  label: string;
  /** Confidence in [0..1] if the model provides it. */
  confidence?: number;
};

export type AgentState = {
  turn: TurnState;
  /** The cast member currently speaking or thinking, if any. */
  activeSpeaker: CastMemberId | null;
  /** Last extracted intent from the user's turn. */
  lastIntent: Intent | null;
  /** Queued intents waiting to be acted on (e.g. mode-switches, scene-changes). */
  pendingIntents: Intent[];
};

export type AgentActions = {
  setTurn: (turn: TurnState) => void;
  setActiveSpeaker: (id: CastMemberId | null) => void;
  setLastIntent: (intent: Intent | null) => void;
  enqueueIntent: (intent: Intent) => void;
  dequeueIntent: () => Intent | null;
};

const initial: AgentState = {
  turn: "idle",
  activeSpeaker: null,
  lastIntent: null,
  pendingIntents: [],
};

export const useAgentStore = create<AgentState & AgentActions>()((set, get) => ({
  ...initial,
  setTurn: (turn) => set({ turn }),
  setActiveSpeaker: (id) => set({ activeSpeaker: id }),
  setLastIntent: (intent) => set({ lastIntent: intent }),
  enqueueIntent: (intent) =>
    set((s) => ({ pendingIntents: [...s.pendingIntents, intent] })),
  dequeueIntent: () => {
    const q = get().pendingIntents;
    const head = q[0];
    if (!head) return null;
    set({ pendingIntents: q.slice(1) });
    return head;
  },
}));

export const agentStore = useAgentStore;
