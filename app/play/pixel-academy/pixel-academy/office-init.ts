/**
 * app/play/pixel-academy/pixel-academy/office-init.ts — Builds the
 * OfficeState with Aura already seated at her desk on frame 1.
 *
 * Extracted from pixel-academy-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { OfficeState } from "lib/pixel-academy";

import { AURA_ID, AURA_PALETTE, AURA_SEAT } from "./constants";

export function createOfficeWithAura(): OfficeState {
  const state = new OfficeState();
  // skipSpawnEffect=true: she's just *there* from frame 1, no matrix-rain entry
  state.addAgent(
    AURA_ID,
    AURA_PALETTE,
    0,
    AURA_SEAT,
    /* skipSpawnEffect */ true,
  );
  // Active from the start so she sits typing, not wandering the room
  state.setAgentActive(AURA_ID, true);
  return state;
}
