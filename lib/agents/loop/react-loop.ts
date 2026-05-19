/**
 * lib/agents/loop/react-loop.ts — the ReAct (Reason + Act) loop.
 *
 * One specialist, one task, one looping alternation between thought
 * and tool-call until the model emits a `Final Answer:`. This is the
 * primitive the crew layer composes — `runCrew` walks a plan and at
 * each step hands a subtask to `runReactLoop` with one specialist.
 *
 * Pattern is the classic ReAct shape from OpenAgents'
 * `ConversationalChatAgent` (observation_prefix = "Observation: ",
 * llm_prefix = "Thought:"), simplified to a single text-format
 * contract instead of LangChain's parser pyramid:
 *
 *   Thought: <free text>
 *   Action: <tool name from the registry>
 *   Args: <one-line JSON>
 *
 *   --- or ---
 *
 *   Thought: <free text>
 *   Final Answer: <free text, possibly multi-line>
 *
 * The runner parses each model turn, runs the tool if requested,
 * appends `Observation: <tool result>` to the transcript, and loops.
 * `maxIterations` is the hard ceiling (default 8) — if the model
 * never emits `Final Answer:`, the runner stops with whatever it has.
 *
 * Contract: this function MUST NOT throw. Every failure mode —
 * malformed model output, missing tool, tool that returned `ok:false`,
 * LLM transport error, exceeded iteration cap — is folded into a
 * `ReactLoopResult` with `ok: false` and a descriptive `error`. The
 * crew layer (and the route handlers above it) depend on that.
 *
 * The loop intentionally has zero awareness of the crew layer above
 * it: no delegation, no orchestrator, no plan. Just one specialist,
 * one task, one trail. Compose at the crew level.
 */

import "server-only";

import { callLLM, type LLMMessage } from "lib/agents/llm-client";
import { createLogger } from "lib/log";

import type { Specialist } from "lib/agents/crew/types";
import type { Tool, ToolRegistry, ToolResult } from "lib/agents/tools/types";

const log = createLogger("agents.react-loop");

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * A single recorded step in the ReAct trail. The trail is append-only
 * and order-preserving — replay it top-to-bottom and you can rebuild
 * exactly what the specialist saw and did.
 */
export type ReactStep =
  | { kind: "thought"; text: string }
  | { kind: "action"; tool: string; args: unknown; result: ToolResult }
  | { kind: "answer"; text: string };

export type ReactLoopResult = {
  /** True iff the loop reached a `Final Answer:` within `maxIterations`. */
  ok: boolean;
  /** The final answer text (or the last `thought` if `ok` is false). */
  output: string;
  /** Append-only record of everything that happened, in order. */
  trail: ReactStep[];
  /** Number of LLM-call iterations consumed (including the one that produced the answer). */
  iterations: number;
  /** Aggregate token usage across every LLM call this loop made. */
  usage: { inputTokens: number; outputTokens: number };
  /** Set when `ok` is false. Stable, machine-readable enough to grep. */
  error?: string;
};

export type RunReactLoopInput = {
  specialist: Specialist;
  task: string;
  /** Optional structured extras — drop ids, prior outputs, refs. Stringified into the user message. */
  context?: Record<string, unknown>;
  /** Map of tools available to this specialist. Filtered by `specialist.tools` before injection. */
  tools: ToolRegistry;
  /** Hard ceiling on LLM-call iterations. Default 8. */
  maxIterations?: number;
  /** Optional crew-task id, forwarded to tool contexts for log correlation. */
  callingTaskId?: string;
  /** Per-LLM-call timeout in ms. Forwarded to `callLLM`. */
  timeoutMs?: number;
};

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const DEFAULT_MAX_ITERATIONS = 8;
const DEFAULT_LOOP_ID_PREFIX = "react";

/** Soft cap on observation text we feed back into the model. Long tool
 *  outputs balloon the context window and rarely add signal past this. */
const OBSERVATION_TRUNCATE_AT = 4000;

// ---------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------

/**
 * Render the tool catalogue the specialist will see in its system
 * prompt. Only tools listed in `specialist.tools` are exposed —
 * everything else in the registry is hidden, so a specialist can't
 * accidentally invoke a capability it wasn't given.
 */
function renderToolCatalogue(
  specialist: Specialist,
  tools: ToolRegistry,
): { catalogue: string; allowed: Map<string, Tool> } {
  const allowed = new Map<string, Tool>();
  for (const name of specialist.tools) {
    const tool = tools.get(name);
    if (tool) allowed.set(name, tool);
  }
  if (allowed.size === 0) {
    return { catalogue: "(no tools available — produce a Final Answer directly)", allowed };
  }
  const lines: string[] = [];
  for (const tool of allowed.values()) {
    lines.push(`- ${tool.name}: ${tool.description}`);
    lines.push(`  args: ${tool.argsSchema.replace(/\s+/g, " ").trim()}`);
  }
  return { catalogue: lines.join("\n"), allowed };
}

/**
 * The ReAct format spec — appended to every specialist's system
 * prompt. Kept verbose on purpose: smaller models drift off-format
 * fast otherwise.
 */
function reactFormatSpec(): string {
  return [
    "You operate in a ReAct (Reason + Act) loop. Each of your turns must follow exactly one of these two shapes:",
    "",
    "  Shape A — call a tool:",
    "    Thought: <one sentence on what you're about to do and why>",
    "    Action: <one tool name, copied verbatim from the tool list>",
    "    Args: <single-line JSON object matching that tool's args schema>",
    "",
    "  Shape B — finish:",
    "    Thought: <one sentence summarising the answer you reached>",
    "    Final Answer: <your full answer to the task, free form, may span multiple lines>",
    "",
    "Rules:",
    "  - Never emit both an Action and a Final Answer in the same turn.",
    "  - If a tool returns an error in an Observation, do NOT immediately retry the same call with the same args.",
    "  - Prefer fewer tool calls. If you can answer from what you already have, do.",
    "  - The Args line must be ONE line of valid JSON. No comments, no trailing commas.",
  ].join("\n");
}

/** Stitch the specialist's system prompt + tool catalogue + format spec. */
function buildSystemPrompt(
  specialist: Specialist,
  catalogue: string,
): string {
  return [
    specialist.systemPrompt.trim(),
    "",
    "AVAILABLE TOOLS",
    catalogue,
    "",
    "OUTPUT FORMAT",
    reactFormatSpec(),
  ].join("\n");
}

/** Stitch the user task + optional context into the opening user message. */
function buildOpeningUserMessage(
  task: string,
  context?: Record<string, unknown>,
): string {
  const parts: string[] = [`TASK\n${task.trim()}`];
  if (context && Object.keys(context).length > 0) {
    let contextJson: string;
    try {
      contextJson = JSON.stringify(context, null, 2);
    } catch {
      contextJson = String(context);
    }
    parts.push(`CONTEXT\n${contextJson}`);
  }
  parts.push("Begin.");
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------

type ParsedTurn =
  | { kind: "action"; thought: string; tool: string; argsRaw: string }
  | { kind: "answer"; thought: string; answer: string }
  | { kind: "malformed"; raw: string };

/**
 * Parse one model turn into either an action, a final answer, or
 * malformed. Tolerant of leading/trailing whitespace and of the model
 * wrapping its output in code fences (some local models love them).
 */
function parseTurn(rawIn: string): ParsedTurn {
  // Strip a single surrounding ``` fence if present.
  let raw = rawIn.trim();
  const fenceMatch = raw.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  if (fenceMatch && fenceMatch[1] !== undefined) raw = fenceMatch[1].trim();

  // Pull Thought (optional — some models skip it on the final turn).
  const thoughtMatch = raw.match(/Thought:\s*([\s\S]*?)(?=\n(?:Action:|Final Answer:)|$)/);
  const thought = thoughtMatch?.[1] ? thoughtMatch[1].trim() : "";

  // Final Answer takes precedence — if both are present (which is
  // against the rules), we treat it as the answer and ignore the action.
  const finalMatch = raw.match(/Final Answer:\s*([\s\S]*)$/);
  if (finalMatch) {
    return { kind: "answer", thought, answer: (finalMatch[1] ?? "").trim() };
  }

  const actionMatch = raw.match(/Action:\s*([^\n]+)\s*\n\s*Args:\s*([\s\S]*)$/);
  if (actionMatch) {
    return {
      kind: "action",
      thought,
      tool: (actionMatch[1] ?? "").trim(),
      argsRaw: (actionMatch[2] ?? "").trim(),
    };
  }

  // Some models will give us just a paragraph of prose on the last
  // turn. Treat that as an implicit Final Answer rather than malformed
  // — it's almost always what the model meant.
  if (!thought && raw.length > 0 && !/Action:/i.test(raw)) {
    return { kind: "answer", thought: "", answer: raw };
  }

  return { kind: "malformed", raw };
}

/**
 * Args are emitted as a single JSON line. Tolerant of:
 *  - trailing prose ("…} and that should do it") — we slice at the first balanced `}`
 *  - the model wrapping JSON in a fenced block
 *  - the model omitting Args entirely (treated as empty object)
 */
function parseArgs(argsRaw: string): { ok: true; args: unknown } | { ok: false; error: string } {
  let s = argsRaw.trim();
  if (s === "") return { ok: true, args: {} };

  // Strip a surrounding ``` fence.
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence && fence[1] !== undefined) s = fence[1].trim();

  // If the model added trailing prose after the JSON, find the first
  // balanced top-level object and parse just that.
  if (s.startsWith("{")) {
    let depth = 0;
    let end = -1;
    let inStr = false;
    let escape = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') {
        inStr = !inStr;
        continue;
      }
      if (inStr) continue;
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end > 0) s = s.slice(0, end + 1);
  }

  try {
    return { ok: true, args: JSON.parse(s) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `args not valid JSON: ${msg}` };
  }
}

// ---------------------------------------------------------------------
// Observation formatting
// ---------------------------------------------------------------------

function truncate(s: string): string {
  if (s.length <= OBSERVATION_TRUNCATE_AT) return s;
  return `${s.slice(0, OBSERVATION_TRUNCATE_AT)}\n…[truncated, ${
    s.length - OBSERVATION_TRUNCATE_AT
  } chars elided]`;
}

function stringifyObservation(result: ToolResult): string {
  if (!result.ok) return `ERROR: ${result.error}`;
  if (typeof result.output === "string") return truncate(result.output);
  try {
    return truncate(JSON.stringify(result.output, null, 2));
  } catch {
    return truncate(String(result.output));
  }
}

// ---------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------

/**
 * Run one specialist through a ReAct loop on one task. Returns a
 * `ReactLoopResult`. Never throws — every failure is folded into
 * `ok: false` with a descriptive `error`.
 */
export async function runReactLoop(
  input: RunReactLoopInput,
): Promise<ReactLoopResult> {
  const maxIterations = input.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const taskId = input.callingTaskId ?? `${DEFAULT_LOOP_ID_PREFIX}-${Date.now()}`;
  const trail: ReactStep[] = [];
  const usage = { inputTokens: 0, outputTokens: 0 };

  const { catalogue, allowed } = renderToolCatalogue(input.specialist, input.tools);
  const systemPrompt = buildSystemPrompt(input.specialist, catalogue);
  const openingUser = buildOpeningUserMessage(input.task, input.context);

  // The running transcript. We rebuild `messages` each iteration so
  // the assistant turns and observation turns interleave correctly.
  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: openingUser },
  ];

  log.debug("react-loop start", {
    taskId,
    specialist: input.specialist.slug,
    model: input.specialist.preferredModel.model,
    via: input.specialist.preferredModel.via,
    tools: Array.from(allowed.keys()),
    maxIterations,
  });

  let iterations = 0;
  let lastThought = "";

  while (iterations < maxIterations) {
    iterations++;

    const llmRes = await callLLM({
      provider: input.specialist.preferredModel.provider,
      model: input.specialist.preferredModel.model,
      via: input.specialist.preferredModel.via,
      messages,
      timeoutMs: input.timeoutMs,
    });

    if (!llmRes.ok) {
      log.warn("react-loop llm failed", {
        taskId,
        iteration: iterations,
        error: llmRes.error,
        status: llmRes.status,
      });
      return {
        ok: false,
        output: lastThought,
        trail,
        iterations,
        usage,
        error: `llm_error: ${llmRes.error}`,
      };
    }

    usage.inputTokens += llmRes.usage.inputTokens;
    usage.outputTokens += llmRes.usage.outputTokens;

    const turn = parseTurn(llmRes.text);

    if (turn.kind === "malformed") {
      // Tell the model what we expected, give it one more shot via the loop.
      log.warn("react-loop malformed turn", {
        taskId,
        iteration: iterations,
        rawHead: turn.raw.slice(0, 200),
      });
      messages.push({ role: "assistant", content: llmRes.text });
      messages.push({
        role: "user",
        content:
          "Observation: Your previous turn did not match the required format. " +
          "Reply with EITHER `Thought:` + `Action:` + `Args:` OR `Thought:` + `Final Answer:`.",
      });
      continue;
    }

    lastThought = turn.thought || lastThought;
    if (turn.thought) trail.push({ kind: "thought", text: turn.thought });

    if (turn.kind === "answer") {
      trail.push({ kind: "answer", text: turn.answer });
      log.debug("react-loop done", {
        taskId,
        iterations,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      });
      return {
        ok: true,
        output: turn.answer,
        trail,
        iterations,
        usage,
      };
    }

    // turn.kind === "action"
    const tool = allowed.get(turn.tool);
    if (!tool) {
      const errorMsg = allowed.size === 0
        ? `tool_unknown: '${turn.tool}' — no tools are available for this specialist`
        : `tool_unknown: '${turn.tool}' — available: ${Array.from(allowed.keys()).join(", ")}`;
      const result: ToolResult = { ok: false, error: errorMsg };
      trail.push({ kind: "action", tool: turn.tool, args: null, result });
      messages.push({ role: "assistant", content: llmRes.text });
      messages.push({
        role: "user",
        content: `Observation: ${stringifyObservation(result)}`,
      });
      continue;
    }

    const parsedArgs = parseArgs(turn.argsRaw);
    if (!parsedArgs.ok) {
      const result: ToolResult = { ok: false, error: parsedArgs.error };
      trail.push({ kind: "action", tool: turn.tool, args: turn.argsRaw, result });
      messages.push({ role: "assistant", content: llmRes.text });
      messages.push({
        role: "user",
        content: `Observation: ${stringifyObservation(result)}`,
      });
      continue;
    }

    // Run the tool. Tools must not throw, but we shield ourselves anyway —
    // a bad tool that does throw must not crash the whole loop.
    let toolResult: ToolResult;
    try {
      toolResult = await tool.run(parsedArgs.args, {
        callingSpecialist: input.specialist.slug,
        taskId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.warn("react-loop tool threw (tools must return ToolResult, not throw)", {
        taskId,
        tool: turn.tool,
        err: msg,
      });
      toolResult = { ok: false, error: `tool_threw: ${msg}` };
    }

    trail.push({
      kind: "action",
      tool: turn.tool,
      args: parsedArgs.args,
      result: toolResult,
    });

    messages.push({ role: "assistant", content: llmRes.text });
    messages.push({
      role: "user",
      content: `Observation: ${stringifyObservation(toolResult)}`,
    });
  }

  // Fell off the bottom — model never said Final Answer.
  log.warn("react-loop exhausted iterations", {
    taskId,
    specialist: input.specialist.slug,
    maxIterations,
  });
  return {
    ok: false,
    output: lastThought,
    trail,
    iterations,
    usage,
    error: `max_iterations_reached: ${maxIterations}`,
  };
}
