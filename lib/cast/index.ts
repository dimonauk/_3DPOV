/**
 * lib/cast/index.ts — Registry of the studio's named cast members.
 *
 * One-line role: enumerate every CharacterBible the agent.dialogue + agent.banter capabilities can ground against.
 * Full purpose in index.PURPOSE.md.
 */

import { aura, type CharacterBible } from "./aura";
import { penny } from "./penny";
import { marcel } from "./marcel";
import { betsy } from "./betsy";
import { trixie } from "./trixie";

export type CastMemberId =
  | "aura"
  | "penny"
  | "marcel"
  | "betsy"
  | "trixie";

export const bibles: Record<CastMemberId, CharacterBible> = {
  aura,
  penny,
  marcel,
  betsy,
  trixie,
};

export function getBible(id: CastMemberId): CharacterBible {
  return bibles[id];
}

export function listBibles(): CharacterBible[] {
  return Object.values(bibles);
}

export function listCastIds(): CastMemberId[] {
  return Object.keys(bibles) as CastMemberId[];
}

export type { CharacterBible };
export { aura, penny, marcel, betsy, trixie };
