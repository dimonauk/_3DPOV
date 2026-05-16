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

import { GoogleGenAI, Type, type Schema } from "@google/genai";

import { envOrThrow, envOrUndefined, isConfigured } from "lib/env";
import {
  defaultModelForProvider,
  gatewayChat,
  GatewayUnavailableError,
  type GatewayMessage,
} from "lib/llm/gateway";
import { createLogger } from "lib/log";
import { agentStore } from "lib/state/agent";
import { castStore } from "lib/state/cast";
import { auraStore } from "lib/state/aura";
import type { CharacterBible } from "lib/cast/aura";

const log = createLogger("capability:agent.dialogue");

export type AgentProvider = "gemini" | "openai" | "anthropic" | "zai";

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

Output a JSON object honouring the response schema:
  - "text" — your spoken reply, in your voice.
  - "intent" — one of greet | answer | redirect | refuse | tease | reflect | invite.
  - "mode" — one of amber | azure | amethyst | crimson | veridian. Default to "${bible.defaultMode}" unless the user's intent calls for a different register.`;

  return contextSuffix ? `${base}\n\nCONTEXT: ${contextSuffix}` : base;
}

const DIALOGUE_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING },
    intent: {
      type: Type.STRING,
      enum: ["greet", "answer", "redirect", "refuse", "tease", "reflect", "invite"],
    },
    mode: {
      type: Type.STRING,
      enum: ["amber", "azure", "amethyst", "crimson", "veridian"],
    },
  },
  required: ["text", "intent", "mode"],
};

const JSON_INSTRUCTION_SUFFIX = `

Your reply MUST be a single JSON object on one line, no markdown
fence, no surrounding text. Schema:

  {
    "text": "<your spoken reply, in your voice>",
    "intent": "greet" | "answer" | "redirect" | "refuse" | "tease" | "reflect" | "invite",
    "mode":   "amber" | "azure" | "amethyst" | "crimson" | "veridian"
  }`;

/**
 * Dispatch via Vercel AI Gateway (Anthropic / Z.ai / OpenAI). Builds
 * the OpenAI-compatible message list and appends a JSON-shape
 * instruction to the system prompt — gateway providers don't have
 * Gemini's `responseSchema` knob, so we coerce via prompt + parse on
 * return.
 */
async function callViaGateway(
  provider: "anthropic" | "zai" | "openai",
  systemPrompt: string,
  history: { role: "user" | "model"; text: string }[],
  userText: string,
): Promise<string> {
  const model = defaultModelForProvider(provider);
  const messages: GatewayMessage[] = [
    { role: "system", content: systemPrompt + JSON_INSTRUCTION_SUFFIX },
    ...history.map<GatewayMessage>((h) => ({
      role: h.role === "model" ? "assistant" : "user",
      content: h.text,
    })),
    { role: "user", content: userText },
  ];
  const result = await gatewayChat({
    model,
    messages,
    temperature: 0.75,
    maxTokens: 1024,
  });
  return result.text;
}

async function callGemini(
  systemPrompt: string,
  history: { role: "user" | "model"; text: string }[],
  userText: string,
): Promise<string> {
  const apiKey = envOrThrow("GOOGLE_AI_API_KEY");
  const modelName = process.env.GOOGLE_AI_MODEL ?? "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });
  const chat = ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.75,
      responseMimeType: "application/json",
      responseSchema: DIALOGUE_RESPONSE_SCHEMA,
    },
    history: history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
  });
  const response = await chat.sendMessage({ message: userText });
  return response.text ?? "";
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
 * The fallback returned when the configured provider is unreachable —
 * either the API key is unset or the call failed. Callers translate this
 * into "Aura's brain is offline" copy rather than crashing the UI.
 */
function offlineResult(): RespondResult {
  return {
    text: "(Aura's brain is offline — set GOOGLE_AI_API_KEY in your env to enable replies.)",
    intent: null,
    mode: null,
  };
}

/**
 * One turn: user input → LLM call → text + intent + mode, written to
 * cast.history + agent.lastIntent + aura.mode (if mode returned).
 *
 * Graceful on missing API key / provider failure: returns a typed
 * `offlineResult()` instead of throwing, so the UI can render a
 * sensible "brain offline" state without bubbling exceptions into the
 * React tree. Use `isProviderAvailable(provider)` to feature-detect
 * before the user-facing button is enabled.
 */
export async function respond(options: RespondOptions): Promise<RespondResult> {
  const provider: AgentProvider =
    options.provider ?? resolveDefaultProvider();
  if (!isProviderAvailable(provider)) {
    return offlineResult();
  }
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
    try {
      switch (provider) {
        case "gemini":
          raw = await callGemini(systemPrompt, history, options.userText);
          break;
        case "anthropic":
        case "zai":
        case "openai":
          raw = await callViaGateway(
            provider,
            systemPrompt,
            history,
            options.userText,
          );
          break;
      }
    } catch (err) {
      if (err instanceof GatewayUnavailableError) {
        log.warn("gateway unavailable, falling back to offline", {
          provider,
          code: err.code,
        });
      } else {
        log.error("provider call failed", { provider, err });
      }
      return offlineResult();
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
    case "anthropic":
      return (
        isConfigured("AI_GATEWAY_API_KEY") || isConfigured("ANTHROPIC_API_KEY")
      );
    case "zai":
      return isConfigured("AI_GATEWAY_API_KEY") || isConfigured("ZAI_API_KEY");
    case "openai":
      // No direct OpenAI env wired yet; OpenAI works ONLY through the
      // gateway. Visitors can BYO their OpenAI key in the future.
      return isConfigured("AI_GATEWAY_API_KEY");
  }
}

export function listProviders(): AgentProvider[] {
  return ["gemini", "anthropic", "zai", "openai"];
}

/**
 * Resolve the default provider when the caller doesn't pin one.
 * Reads `LLM_DEFAULT_AGENT_PROVIDER` env; falls back to "gemini" for
 * back-compat. Validates the value; an unknown string falls back too.
 */
function resolveDefaultProvider(): AgentProvider {
  const raw = envOrUndefined("LLM_DEFAULT_AGENT_PROVIDER");
  if (raw === "anthropic" || raw === "zai" || raw === "openai" || raw === "gemini") {
    return raw;
  }
  return "gemini";
}
