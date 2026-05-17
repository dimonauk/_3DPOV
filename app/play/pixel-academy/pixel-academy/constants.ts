/**
 * app/play/pixel-academy/pixel-academy/constants.ts — Aura's
 * reserved id + seat + camera/zoom tuning + chamber height + the
 * SubagentCharacter type shared between canvas + overlay.
 *
 * Extracted from pixel-academy-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

// Reserved character ID for the Headmistress. Scribe Bridge agents start at 1+.
// Negative IDs are sub-agents, so 0 is permanently hers.
export const AURA_ID = 0;
// Palette 5 = the sixth skin. Regular agents round-robin 0-4 so she always
// looks distinct from whoever else is in the room.
export const AURA_PALETTE = 5;
// Right-room top chair — head-of-table, facing the desk.
export const AURA_SEAT = "chair-r-top";

// Camera + zoom tuning — copied from the bench app so the chamber
// behaves identically.
export const CAMERA_FOLLOW_LERP = 0.1;
export const CAMERA_FOLLOW_SNAP_THRESHOLD = 0.5;
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 8;
export const ZOOM_SCROLL_THRESHOLD = 50;
export const PAN_MARGIN_FRACTION = 0.5;

// The chamber's standing height. Tall enough to read the room without
// dominating the article that frames it.
export const CHAMBER_HEIGHT = "640px";

export interface SubagentCharacter {
  id: number;
  label: string;
}
