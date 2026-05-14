/**
 * lib/capabilities/agent/banter.ts — Capability `agent.banter`: multi-character LLM banter driven by live telemetry.
 *
 * One-line role: take live telemetry + 1..N active speakers' character bibles, call Gemini with a multi-voice system prompt, return a 1-3 line exchange typed as {speaker, emotion, text}[].
 * Full purpose in banter.PURPOSE.md.
 *
 * Provenance: Hangar `apps/prototypes/neo-london-chrono-protocol/services/geminiService.ts`
 * — the SYSTEM_INSTRUCTION canon for AURA/YOW/PURP banter, the responseSchema shape,
 * and the 12-second tick cadence referenced in HANGAR_RECONCILIATION.md (B5).
 * Atomised here per docs/MIGRATION_PRINCIPLES.md: shredded to the bible-driven shape so
 * any active subset of the cast can banter, with no hardcoded triple.
 */

import { GoogleGenAI, Type, type Schema } from "@google/genai";

import type { CharacterBible } from "lib/cast/aura";
import type { ChronoModeSlug } from "lib/chrono-protocol";
import { envOrThrow, isConfigured } from "lib/env";
import type { CastMemberId } from "lib/state/cast";

/** Canon tick: the prototype runs banter on a 12-second interval. */
export const DEFAULT_TICK_MS = 12_000;

/** Allowed emotion register — matches the Hangar responseSchema enum. */
export type BanterEmotion =
  | "neutral"
  | "happy"
  | "angry"
  | "fear"
  | "excited"
  | "sad";

/** Live game / scene signal the banter reacts to. */
export type BanterTelemetry = {
  /** Tunnel speed (Hangar canon: > 1.5 reads as urgent). */
  speed?: number;
  /** Active ChronoMode register. */
  chronoMode: ChronoModeSlug;
  /** Hit-combo counter, when the run has one. */
  combo?: number;
  /** Player health 0..N. Hangar canon: < 3 panics Yow. */
  health?: number;
  /** Lifecycle phase. */
  phase?: "boot" | "hub" | "run" | "end";
  /** Interval hint between calls; defaults to DEFAULT_TICK_MS. */
  tickMs?: number;
};

/** Context passed into respondBanter. */
export type BanterContext = {
  /** Subset of the cast currently on-mic. Must be a non-empty subset of the supplied bibles. */
  activeSpeakers: CastMemberId[];
  telemetry: BanterTelemetry;
  /** Free-text last event ("clipped the wall", "combo broken"). */
  lastEvent?: string;
};

/** One line in the exchange. */
export type BanterTurn = {
  speaker: CastMemberId;
  emotion: BanterEmotion;
  text: string;
};

/** What respondBanter returns. */
export type BanterResult = {
  turns: BanterTurn[];
  /** The tick the caller asked us to honour, echoed for clarity. */
  tickMs: number;
  /** Suggested ms-from-now the caller may schedule the next call. */
  followUpEta?: number;
};

// ---------- system-prompt assembly ----------

function describeSpeaker(b: CharacterBible): string {
  const draws = b.draws.map((d) => `    - ${d}`).join("\n");
  const refusals = b.refusals.map((r) => `    - ${r}`).join("\n");
  const catchphrases = b.catchphrases.map((p) => `    - "${p}"`).join("\n");
  const forbidden = b.forbidden.map((p) => `    - "${p}"`).join("\n");
  return `- ${b.name} (id: "${b.id}") — ${b.role}
  VOICE: ${b.voice}
  POSTURE: ${b.posture}
  DRAWS:
${draws}
  REFUSALS:
${refusals}
  CATCHPHRASES:
${catchphrases}
  FORBIDDEN:
${forbidden}`;
}

function summariseTelemetry(t: BanterTelemetry, lastEvent?: string): string {
  const bits: string[] = [];
  bits.push(`chronoMode=${t.chronoMode}`);
  if (typeof t.speed === "number") bits.push(`speed=${t.speed.toFixed(2)}`);
  if (typeof t.combo === "number") bits.push(`combo=${t.combo}`);
  if (typeof t.health === "number") bits.push(`health=${t.health}`);
  if (t.phase) bits.push(`phase=${t.phase}`);
  if (lastEvent) bits.push(`lastEvent="${lastEvent}"`);
  return bits.join(" · ");
}

function buildSystemPrompt(
  activeIds: CastMemberId[],
  bibles: Record<CastMemberId, CharacterBible>,
): string {
  const speakerBlocks: string[] = [];
  for (const id of activeIds) {
    const b = bibles[id];
    if (!b) continue;
    speakerBlocks.push(describeSpeaker(b));
  }
  const idList = activeIds.map((id) => `"${id}"`).join(", ");
  return `You are the Neo-London Chrono-Protocol narrator engine. You generate short banter exchanges between named constructs in response to live telemetry.

ACTIVE SPEAKERS (use ONLY these; never invent another voice):
${speakerBlocks.join("\n\n")}

RULES:
- Output a 1-3 line exchange. One turn per speaker turn; the same speaker may speak twice only if a third voice has spoken between.
- Each turn's "speaker" MUST be one of: ${idList}. Never any other id.
- Honour each speaker's voice + posture + draws + refusals; never let one character borrow another's register.
- Use the catchphrases sparingly — sprinkle, do not stack.
- Never speak any FORBIDDEN phrase from any speaker's list.
- Keep each line punchy: under 18 words. Cyberpunk / London / studio register where the bible calls for it.
- React to the telemetry directly. If speed is high, urgency rises. If health is low, fear rises. If chronoMode is amber/crimson, the room is hotter; if azure/veridian, calmer.
- Emotion is one of: neutral | happy | angry | fear | excited | sad.

OUTPUT: JSON object { "turns": [ { "speaker", "emotion", "text" }, ... ] } honouring the responseSchema.`;
}

// ---------- Gemini call ----------

type RawTurn = {
  speaker?: string;
  emotion?: string;
  text?: string;
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    turns: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          speaker: { type: Type.STRING },
          emotion: {
            type: Type.STRING,
            enum: ["neutral", "happy", "angry", "fear", "excited", "sad"],
          },
          text: { type: Type.STRING },
        },
        required: ["speaker", "emotion", "text"],
      },
    },
  },
  required: ["turns"],
};

async function callGemini(
  systemPrompt: string,
  userPayload: string,
): Promise<string> {
  const apiKey = envOrThrow("GOOGLE_AI_API_KEY");
  const modelName = process.env.GOOGLE_AI_MODEL ?? "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: modelName,
    contents: userPayload,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.8,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });
  return response.text ?? "";
}

// ---------- parsing ----------

const ALLOWED_EMOTIONS: ReadonlySet<BanterEmotion> = new Set<BanterEmotion>([
  "neutral",
  "happy",
  "angry",
  "fear",
  "excited",
  "sad",
]);

function normaliseEmotion(raw: string | undefined): BanterEmotion {
  if (!raw) return "neutral";
  const lower = raw.toLowerCase();
  return (ALLOWED_EMOTIONS as Set<string>).has(lower)
    ? (lower as BanterEmotion)
    : "neutral";
}

function parseTurns(raw: string, activeIds: CastMemberId[]): BanterTurn[] {
  const trimmed = raw.trim().replace(/^```json\s*/, "").replace(/```$/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return [];
  }
  const rawTurns: RawTurn[] = Array.isArray(parsed)
    ? (parsed as RawTurn[])
    : Array.isArray((parsed as { turns?: unknown }).turns)
      ? ((parsed as { turns: RawTurn[] }).turns)
      : [];
  const allowedSpeakers = new Set(activeIds);
  const out: BanterTurn[] = [];
  for (const t of rawTurns) {
    if (typeof t?.speaker !== "string" || typeof t?.text !== "string") continue;
    if (!allowedSpeakers.has(t.speaker)) continue;
    out.push({
      speaker: t.speaker,
      emotion: normaliseEmotion(t.emotion),
      text: t.text.trim(),
    });
    if (out.length >= 3) break;
  }
  return out;
}

// ---------- public surface ----------

/**
 * Run one banter tick. Reads telemetry + the supplied character bibles,
 * calls Gemini once, returns a typed 1-3 line exchange. Headless — no
 * slice writes; callers persist via cast.history if they want it logged.
 *
 * Returns an empty `BanterResult` (with a console.warn) when
 * `GOOGLE_AI_API_KEY` is unset, so the UI never crashes when banter is
 * unavailable.
 */
export async function respondBanter(
  context: BanterContext,
  bibles: Record<CastMemberId, CharacterBible>,
): Promise<BanterResult> {
  const tickMs = context.telemetry.tickMs ?? DEFAULT_TICK_MS;
  const activeIds = context.activeSpeakers.filter((id) => bibles[id]);

  if (!isConfigured("GOOGLE_AI_API_KEY")) {
    console.warn(
      "agent.banter: GOOGLE_AI_API_KEY is not set — returning empty banter.",
    );
    return { turns: [], tickMs, followUpEta: tickMs };
  }

  if (activeIds.length === 0) {
    console.warn(
      "agent.banter: no active speakers had matching bibles — returning empty banter.",
    );
    return { turns: [], tickMs, followUpEta: tickMs };
  }

  const systemPrompt = buildSystemPrompt(activeIds, bibles);
  const summary = summariseTelemetry(context.telemetry, context.lastEvent);
  const userPayload = `Telemetry: ${summary}. React in voice.`;

  try {
    const raw = await callGemini(systemPrompt, userPayload);
    const turns = parseTurns(raw, activeIds);
    return { turns, tickMs, followUpEta: tickMs };
  } catch (error) {
    console.error("agent.banter: Gemini call failed", error);
    return { turns: [], tickMs, followUpEta: tickMs };
  }
}

/** Predicate matching the registry convention; true when Gemini is reachable. */
export function isAvailable(): boolean {
  return isConfigured("GOOGLE_AI_API_KEY");
}
