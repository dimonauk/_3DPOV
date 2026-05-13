/**
 * lib/state/cast.ts — Zustand slice: per-character memory references and dialogue history.
 *
 * One-line role: shared state-bus for the cast of named agents (Penny, Baby, Marcel, etc).
 * Full purpose in cast.PURPOSE.md.
 */

import { create } from "zustand";

export type CastMemberId = string;

export type DialogueTurn = {
  /** ISO timestamp. */
  at: string;
  /** Who spoke. "user" for the human, or a `CastMemberId` for an NPC. */
  speaker: "user" | CastMemberId;
  text: string;
  /** Intent extracted by the dialogue capability, if any. */
  intent?: string;
};

export type CastMemberStatus =
  | "active" // currently in scene
  | "offstage" // exists, not in current frame
  | "unmet"; // user hasn't encountered yet

export type CastMember = {
  id: CastMemberId;
  /** Display name (e.g. "Penny", "Baby", "Marcel"). */
  name: string;
  status: CastMemberStatus;
  /** Reference / pointer to the character's bible file (e.g. "lib/cast/penny.ts"). */
  bibleRef: string;
  /** Reference / handle for the character's vector-store memory. Provider-opaque. */
  memoryRef: string | null;
};

export type CastState = {
  members: Record<CastMemberId, CastMember>;
  /** Dialogue history per cast member, most recent last. */
  history: Record<CastMemberId, DialogueTurn[]>;
};

export type CastActions = {
  upsertMember: (member: CastMember) => void;
  setStatus: (id: CastMemberId, status: CastMemberStatus) => void;
  appendTurn: (id: CastMemberId, turn: DialogueTurn) => void;
  clearHistory: (id: CastMemberId) => void;
};

const initial: CastState = {
  members: {},
  history: {},
};

export const useCastStore = create<CastState & CastActions>()((set) => ({
  ...initial,
  upsertMember: (member) =>
    set((s) => ({ members: { ...s.members, [member.id]: member } })),
  setStatus: (id, status) =>
    set((s) => {
      const existing = s.members[id];
      if (!existing) return s;
      return { members: { ...s.members, [id]: { ...existing, status } } };
    }),
  appendTurn: (id, turn) =>
    set((s) => ({
      history: { ...s.history, [id]: [...(s.history[id] ?? []), turn] },
    })),
  clearHistory: (id) =>
    set((s) => {
      const next = { ...s.history };
      delete next[id];
      return { history: next };
    }),
}));

export const castStore = useCastStore;
