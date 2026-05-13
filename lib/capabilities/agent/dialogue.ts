/**
 * lib/capabilities/agent/dialogue.ts — Capability `agent.dialogue`: one LLM turn per call.
 *
 * One-line role: take user input + a character bible + history, call the LLM, return text + intent + chosen ChronoMode, write the turn through the cast + agent slices.
 * Full purpose in dialogue.PURPOSE.md.
 *
 * v0.1 ships the Gemini provider only. Provider is pluggable via the
 * `provider` option; OpenAI / Anthropic siblings can land later behind
 * the same `respond()` surface.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

import { envOrThrow, isConfigured } from "lib/env";
import { agentStore } from "lib/state/agent";
import { castStore } from "lib/state/cast";
import { auraStore } from "lib/state/aura";
import type { CharacterBible } from "lib/cast/aura";

export type AgentProvider = "gemini" | "openai" | "anthropic";

export type RespondOptions = {
  /** Cast-member ID — the speaker. */
  speakerId: string;
  /** The character bible to ground the LLM call. */
  bible: CharacterBible;
  /** User's message text. */
  userText: string;
  /** Provider routing. Defaults to "gemini". */
  provider?: AgentProvider;
  /** Optional system-prompt suffix for context (scene, mode, mood). */
  contextSuffix?: string;
};

export type RespondResult = {
  text: string;
  intent: string | null;
  mode: string | null;
};

function buildSystemPrompt(bible: CharacterBible, contextSuffix?: string): string {
  const draws = bible.draws.map((d) => `  - ${d}`).join("\n");
  const refusals = bible.refusals.map((r) => `  - ${r}`).join("\n");
  const forbidden = bible.forbidden.map((p) => `  - "${p}"`).join("\n");
  const catchphrases = bible.catchphrases.map((p) => `  - "${p}"`).join("\n");

  const base = `You are ${bible.name}. ${bible.role}

VOICE: ${bible.voice}

POSTURE: ${bible.posture}

DRAWS (topics you lean into):
${draws}

REFUSALS (hard no, never compromise):
${refusals}

CATCHPHRASES (you do say these):
${catchphrases}

FORBIDDEN PHRASES (never say these):
${forbidden}

OUTPUT FORMAT:
Reply as a JSON object with three fields:
{
  "text": "<your spoken reply>",
  "intent": "<one short word: greet | answer | redirect | refuse | tease | reflect | invite>",
  "mode": "<one of: amber | azure | amethyst | crimson | veridian>"
}
The "mode" is which ChronoMode register you're holding for this reply. Default to "${bible.defaultMode}" unless the user's intent calls for a different one.`;

  return contextSuffix ? `${base}\n\nCONTEXT: ${contextSuffix}` : base;
}

async function callGemini(
  systemPrompt: string,
  history: { role: "user" | "model"; text: string }[],
  userText: string,
): Promise<string> {
  const apiKey = envOrThrow("GOOGLE_AI_API_KEY");
  const modelName = process.env.GOOGLE_AI_MODEL ?? "gemini-2.0-flash-exp";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
  });
  const chat = model.startChat({
    history: history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
  });
  const result = await chat.sendMessage(userText);
  return result.response.text();
}

function parseResponse(raw: string): RespondResult {
  const trimmed = raw.trim().replace(/^```json\s*/, "").replace(/```$/, "");
  try {
    const parsed = JSON.parse(trimmed) as Partial<RespondResult>;
    return {
      text: typeof parsed.text === "string" ? parsed.text : raw,
      intent: typeof parsed.intent === "string" ? parsed.intent : null,
      mode: typeof parsed.mode === "string" ? parsed.mode : null,
    };
  } catch {
    return { text: raw, intent: null, mode: null };
  }
}

/**
 * One turn: user input → LLM call → text + intent + mode, written to
 * cast.history + agent.lastIntent + aura.mode (if mode returned).
 * Throws if the configured provider has no API key.
 */
export async function respond(options: RespondOptions): Promise<RespondResult> {
  const provider: AgentProvider = options.provider ?? "gemini";
  agentStore.getState().setTurn("agent-thinking");
  agentStore.getState().setActiveSpeaker(options.speakerId);

  try {
    const systemPrompt = buildSystemPrompt(options.bible, options.contextSuffix);
    const history = (castStore.getState().history[options.speakerId] ?? []).map(
      (turn) => ({
        role:
          turn.speaker === "user" ? ("user" as const) : ("model" as const),
        text: turn.text,
      }),
    );

    castStore.getState().appendTurn(options.speakerId, {
      at: new Date().toISOString(),
      speaker: "user",
      text: options.userText,
    });

    let raw: string;
    switch (provider) {
      case "gemini":
        raw = await callGemini(systemPrompt, history, options.userText);
        break;
      case "openai":
      case "anthropic":
        throw new Error(`agent.dialogue: provider "${provider}" not implemented yet`);
    }

    const result = parseResponse(raw);

    castStore.getState().appendTurn(options.speakerId, {
      at: new Date().toISOString(),
      speaker: options.speakerId,
      text: result.text,
      intent: result.intent ?? undefined,
    });
    agentStore.getState().setLastIntent(
      result.intent ? { label: result.intent } : null,
    );
    if (result.mode && options.speakerId === "aura") {
      const validModes = ["amber", "azure", "amethyst", "crimson", "veridian"] as const;
      if ((validModes as readonly string[]).includes(result.mode)) {
        auraStore.getState().setMode(
          result.mode as (typeof validModes)[number],
        );
      }
    }
    return result;
  } finally {
    agentStore.getState().setTurn("idle");
  }
}

/** Whether the configured provider has its API key set. */
export function isProviderAvailable(provider: AgentProvider = "gemini"): boolean {
  switch (provider) {
    case "gemini":
      return isConfigured("GOOGLE_AI_API_KEY");
    case "openai":
    case "anthropic":
      return false;
  }
}

export function listProviders(): AgentProvider[] {
  return ["gemini", "openai", "anthropic"];
}
