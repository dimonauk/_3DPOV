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
import { baby } from "./baby";
import { scribe } from "./scribe";
import { millie } from "./millie";
import { tim } from "./tim";
import { excavationBot } from "./excavation-bot";
// Canon-port 2026-05-19 — 6 bibles added from CAST-CANON.md.
import { lottie } from "./lottie";
import { dottie } from "./dottie";
import { shelly } from "./shelly";
import { danceTutor } from "./dance-tutor";
import { logistician } from "./logistician";
import { physicist } from "./physicist";

export type CastMemberId =
  | "aura"
  | "penny"
  | "marcel"
  | "betsy"
  | "trixie"
  | "baby"
  | "scribe"
  | "millie"
  | "tim"
  | "excavation-bot"
  // Canon-14 additions
  | "lottie"
  | "dottie"
  | "shelly"
  | "dance-tutor"
  | "logistician"
  | "physicist";

export const bibles: Record<CastMemberId, CharacterBible> = {
  aura,
  penny,
  marcel,
  betsy,
  trixie,
  baby,
  scribe,
  millie,
  tim,
  "excavation-bot": excavationBot,
  lottie,
  dottie,
  shelly,
  "dance-tutor": danceTutor,
  logistician,
  physicist,
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
export {
  aura, penny, marcel, betsy, trixie, baby, scribe, millie, tim, excavationBot,
  lottie, dottie, shelly, danceTutor, logistician, physicist,
};
