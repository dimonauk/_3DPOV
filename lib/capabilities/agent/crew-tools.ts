import "server-only";

/**
 * lib/capabilities/agent/crew-tools.ts — runtime tool resolution +
 * the ReAct loop for `agent.crew-run` (Phase 4-tools / Phase 6).
 *
 * # What this adds
 *
 * Up to now, crew tasks ran as pure dialogue: one `respond()` call per
 * task, no tools. Tool bindings on an agent (`agent.tools[]`) were
 * validated at design time but never executed. This module is the
 * runtime side:
 *
 *   - `resolveCrewTools(crew, agent, ctx)` converts an agent's
 *     `CrewToolBinding[]` into a `Record<string, Tool>` the Vercel AI
 *     SDK understands.
 *   - `respondWithTools(...)` runs the AI SDK's native multi-step
 *     tool-calling loop (`generateText` + `stepCountIs`) — the ReAct
 *     loop — and returns the final text plus a record of which tools
 *     fired.
 *
 * crew-run's `runOneTask` calls `respondWithTools` ONLY when the agent
 * declares tools; tool-less agents keep using the plain `respond()`
 * path unchanged. So this is purely additive — dormant until a crew
 * actually declares tools.
 *
 * # The three binding kinds
 *
 *   - `subagent` — fully wired. The tool lets the running agent
 *     delegate a sub-question to another agent in the same crew via a
 *     single `respond()` turn. Genuinely useful: a lead can ask a
 *     specialist a focused question mid-task.
 *   - `builtin` — pattern established with ONE real example
 *     (`cast.roster.lookup`). Other builtin names return a clear
 *     "adapter not implemented" result rather than silently failing or
 *     dispatching arbitrary capabilities. Wiring more builtins is
 *     incremental per-capability work.
 *   - `mcp` — honest stub. There's no MCP client in the stack yet, so
 *     these tools return a structured "MCP client not wired" result.
 *     When an MCP client lands, this is the one place to wire it.
 *
 * # Why generateText, not streamText
 *
 * crew-run aggregates whole turns into a `CrewRunResult`; it doesn't
 * stream to a client. So `generateText` (await the full result) is the
 * right primitive, unlike the aura agent route which streams to the
 * browser.
 */

import { tool, generateText, stepCountIs, type ToolSet } from "ai";
import { z } from "zod";
import { getMember } from "./cast-roster";
import { respond, type AgentProvider } from "./dialogue";
import type {
  CrewDefinition,
  CrewAgentDefinition,
  CrewToolBinding,
} from "./crew-run";
import type { CharacterBible } from "lib/cast/aura";
import { createLogger } from "lib/log";

const log = createLogger("capability:agent.crew-tools");

const TEXT_MODEL =
  process.env.AI_GATEWAY_MODEL_TEXT ?? "google/gemini-3.1-flash-lite";

/** Default step cap for the ReAct loop — prevents runaway tool cycles. */
const DEFAULT_MAX_STEPS = 5;

export type RespondWithToolsResult = {
  text: string;
  /** Names of tools that fired, in call order, with their result summaries. */
  tool_calls: { tool: string; summary: string }[];
  /** How many model steps the loop took. */
  steps: number;
};

// ── Bible resolution (mirrors crew-run's private helper) ─────────────

function synthesiseBible(agent: CrewAgentDefinition): CharacterBible {
  const draws = agent.task_boundaries
    ? agent.task_boundaries.split(/[.\n]/).map((s) => s.trim()).filter(Boolean)
    : ["the task at hand", "their stated goal", "their backstory"];
  return {
    name: agent.id,
    role: agent.role,
    voice: agent.backstory,
    posture: agent.goal,
    draws: draws.length > 0 ? draws : ["the task at hand"],
    refusals: ["ignoring the task description"],
    catchphrases: [],
    forbidden: [],
    defaultMode: "azure",
    pronouns: "they/them",
    aspects: [],
    relationships: [],
    bio: agent.backstory,
    age: null,
    gender: null,
    location: null,
    avatarStyle: "minimal",
    color: { primary: "#888888", secondary: "#cccccc" },
    sigil: "",
    house: null,
  } as unknown as CharacterBible;
}

function resolveAgentBible(agent: CrewAgentDefinition): CharacterBible {
  try {
    return getMember(agent.id as never).bible;
  } catch {
    return synthesiseBible(agent);
  }
}

// ── Tool builders, one per binding kind ──────────────────────────────

/**
 * subagent — delegate a focused sub-question to another crew agent.
 * The tool's `execute` runs a single `respond()` turn against the
 * target agent and returns its text. The calling LLM weaves that into
 * its own answer.
 */
function buildSubagentTool(
  crew: CrewDefinition,
  binding: Extract<CrewToolBinding, { kind: "subagent" }>,
  provider: AgentProvider | undefined,
  runId: string,
) {
  const target = crew.agents.find((a) => a.id === binding.agent_id);
  const targetRole = target ? target.role : binding.agent_id;
  return tool({
    description: `Delegate a focused sub-question to ${binding.agent_id} (${targetRole}). Use when you need that specialist's input on one specific point. Returns their answer as text; weave it into your own reply.`,
    inputSchema: z.object({
      question: z
        .string()
        .max(1000)
        .describe("The specific question to put to the sub-agent."),
    }),
    execute: async ({ question }: { question: string }) => {
      if (!target) {
        return {
          summary: `No agent "${binding.agent_id}" in this crew — cannot delegate.`,
        };
      }
      try {
        const bible = resolveAgentBible(target);
        const result = await respond({
          speakerId: target.id,
          bible,
          userText: question,
          ...(provider ? { provider } : {}),
          contextSuffix: `You are being consulted by a peer agent mid-task. Answer the specific question concisely.`,
        });
        log.info("subagent delegation", {
          run_id: runId,
          to: target.id,
          q: question.slice(0, 80),
        });
        return { summary: result.text };
      } catch (err) {
        return {
          summary: `Sub-agent ${target.id} failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  });
}

/**
 * builtin — invoke a registered capability. One real example wired
 * (`cast.roster.lookup`); other names return a clear not-implemented
 * result so the gap is visible rather than silent.
 */
function buildBuiltinTool(
  binding: Extract<CrewToolBinding, { kind: "builtin" }>,
) {
  if (binding.name === "cast.roster.lookup") {
    return tool({
      description:
        "Look up a cast member's role and posture by id. Returns their bible summary. Use to ground a reference to another character.",
      inputSchema: z.object({
        member_id: z
          .string()
          .max(80)
          .describe("Cast member id, e.g. 'aura', 'physicist'."),
      }),
      execute: async ({ member_id }: { member_id: string }) => {
        try {
          const m = getMember(member_id as never);
          return {
            summary: `${m.bible.name} — ${m.bible.role}. Posture: ${m.bible.posture}.`,
          };
        } catch {
          return { summary: `No cast member "${member_id}".` };
        }
      },
    });
  }
  // Pattern for everything else: explicit not-implemented, not silent.
  return tool({
    description: `Builtin capability "${binding.name}" (adapter not yet implemented).`,
    inputSchema: z.object({}),
    execute: async () => ({
      summary: `Builtin tool "${binding.name}" has no runtime adapter wired yet. Proceed without it.`,
    }),
  });
}

/**
 * mcp — honest stub. No MCP client in the stack. When one lands, wire
 * the actual call here (server + tool + payload).
 */
function buildMcpTool(binding: Extract<CrewToolBinding, { kind: "mcp" }>) {
  return tool({
    description: `MCP tool "${binding.tool}" on server "${binding.server}" (MCP client not wired in this deployment).`,
    inputSchema: z.object({
      payload: z
        .record(z.string(), z.unknown())
        .optional()
        .describe("Arguments for the MCP tool."),
    }),
    execute: async () => ({
      summary: `MCP tool ${binding.server}/${binding.tool} can't run — no MCP client is wired in this deployment. Proceed without it or hand back to the operator.`,
    }),
  });
}

// ── Public: resolve an agent's bindings into an AI SDK ToolSet ────────

/**
 * Convert an agent's tool bindings into a `Record<string, Tool>`. Tool
 * keys are derived from the binding so the LLM can address them:
 *   - subagent → `ask_<agent_id>`
 *   - builtin  → `builtin_<name with dots → underscores>`
 *   - mcp      → `mcp_<server>_<tool>`
 *
 * Returns an empty object if the agent has no tools.
 */
export function resolveCrewTools(
  crew: CrewDefinition,
  agent: CrewAgentDefinition,
  runId: string,
): ToolSet {
  const tools: ToolSet = {};
  for (const binding of agent.tools ?? []) {
    if (binding.kind === "subagent") {
      const key = `ask_${sanitise(binding.agent_id)}`;
      tools[key] = buildSubagentTool(crew, binding, agent.provider, runId);
    } else if (binding.kind === "builtin") {
      const key = `builtin_${sanitise(binding.name)}`;
      tools[key] = buildBuiltinTool(binding);
    } else if (binding.kind === "mcp") {
      const key = `mcp_${sanitise(binding.server)}_${sanitise(binding.tool)}`;
      tools[key] = buildMcpTool(binding);
    }
  }
  return tools;
}

function sanitise(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

// ── Public: the ReAct loop ───────────────────────────────────────────

/**
 * Run one task turn WITH tools. Uses the AI SDK's native multi-step
 * tool loop. Returns the final text + a record of tool calls.
 *
 * Falls back to a plain text answer if the gateway isn't configured —
 * mirrors `respond()`'s graceful-offline behaviour so a missing key
 * never crashes a crew run.
 */
export async function respondWithTools(opts: {
  crew: CrewDefinition;
  agent: CrewAgentDefinition;
  bible: CharacterBible;
  userText: string;
  contextSuffix?: string;
  runId: string;
  maxSteps?: number;
}): Promise<RespondWithToolsResult> {
  const { crew, agent, bible, userText, contextSuffix, runId } = opts;

  if (!process.env.AI_GATEWAY_API_KEY) {
    return {
      text: "(crew tool-runner offline — set AI_GATEWAY_API_KEY to enable tool-using agents.)",
      tool_calls: [],
      steps: 0,
    };
  }

  const tools = resolveCrewTools(crew, agent, runId);
  const system = buildToolSystemPrompt(bible, contextSuffix);

  try {
    const result = await generateText({
      model: TEXT_MODEL,
      system,
      prompt: userText,
      tools,
      stopWhen: stepCountIs(opts.maxSteps ?? DEFAULT_MAX_STEPS),
      temperature: 0.7,
      maxOutputTokens: 1024,
    });

    // Collect tool-call summaries across all steps.
    const toolCalls: { tool: string; summary: string }[] = [];
    for (const step of result.steps) {
      for (const tr of step.toolResults ?? []) {
        const out = tr.output as { summary?: string } | undefined;
        toolCalls.push({
          tool: tr.toolName,
          summary:
            out && typeof out.summary === "string"
              ? out.summary.slice(0, 280)
              : "(no summary)",
        });
      }
    }

    log.info("respondWithTools done", {
      run_id: runId,
      agent_id: agent.id,
      steps: result.steps.length,
      tool_calls: toolCalls.length,
    });

    return {
      text: result.text,
      tool_calls: toolCalls,
      steps: result.steps.length,
    };
  } catch (err) {
    log.error("respondWithTools failed", {
      run_id: runId,
      agent_id: agent.id,
      err: err instanceof Error ? err.message : String(err),
    });
    // Surface as a thrown error so runOneTask's retry loop can catch it.
    throw new Error(
      `tool-using turn for agent ${agent.id} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function buildToolSystemPrompt(
  bible: CharacterBible,
  contextSuffix?: string,
): string {
  const base = `You are ${bible.name}. ${bible.role}

VOICE: ${bible.voice}

POSTURE: ${bible.posture}

You have tools available. Use them when they help complete the task,
then synthesise their results into your final answer. Do not narrate
tool mechanics — just fold what you learn into a natural reply in your
voice. If a tool reports it can't run, proceed without it.`;
  return contextSuffix ? `${base}\n\nCONTEXT: ${contextSuffix}` : base;
}
