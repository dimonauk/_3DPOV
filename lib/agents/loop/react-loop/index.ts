/**
 * lib/agents/loop/react-loop/index.ts — the ReAct (Reason + Act) loop.
 *
 * One specialist, one task, one looping alternation between thought
 * and tool-call until the model emits a `Final Answer:`. This is the
 * primitive the crew layer composes — `runCrew` walks a plan and at
 * each step hands a subtask to `runReactLoop` with one specialist.
 *
 * Composition:
 *   ./types.ts        ReactStep, ReactLoopResult, RunReactLoopInput, constants
 *   ./prompts.ts      renderToolCatalogue, reactFormatSpec, buildSystemPrompt,
 *                     buildOpeningUserMessage
 *   ./parser.ts       parseTurn + parseArgs (tolerant text + JSON parsers)
 *   ./observation.ts  stringifyObservation (truncated tool-result rendering)
 *
 * Contract: this function MUST NOT throw. Every failure mode —
 * malformed model output, missing tool, tool that returned `ok:false`,
 * LLM transport error, exceeded iteration cap — is folded into a
 * `ReactLoopResult` with `ok: false` and a descriptive `error`.
 */

import "server-only";

import { callLLM, type LLMMessage } from "lib/agents/llm-client";
import { createLogger } from "lib/log";
import type { ToolResult } from "lib/agents/tools/types";

import {
  buildOpeningUserMessage,
  buildSystemPrompt,
  renderToolCatalogue,
} from "./prompts";
import { parseArgs, parseTurn } from "./parser";
import { stringifyObservation } from "./observation";
import {
  DEFAULT_LOOP_ID_PREFIX,
  DEFAULT_MAX_ITERATIONS,
  type ReactLoopResult,
  type ReactStep,
  type RunReactLoopInput,
} from "./types";

export type {
  ReactLoopResult,
  ReactStep,
  RunReactLoopInput,
} from "./types";

const log = createLogger("agents.react-loop");

export async function runReactLoop(
  input: RunReactLoopInput,
): Promise<ReactLoopResult> {
  const maxIterations = input.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const taskId =
    input.callingTaskId ?? `${DEFAULT_LOOP_ID_PREFIX}-${Date.now()}`;
  const trail: ReactStep[] = [];
  const usage = { inputTokens: 0, outputTokens: 0 };

  const { catalogue, allowed } = renderToolCatalogue(
    input.specialist,
    input.tools,
  );
  const systemPrompt = buildSystemPrompt(input.specialist, catalogue);
  const openingUser = buildOpeningUserMessage(input.task, input.context);

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
      return { ok: true, output: turn.answer, trail, iterations, usage };
    }

    // turn.kind === "action"
    const tool = allowed.get(turn.tool);
    if (!tool) {
      const errorMsg =
        allowed.size === 0
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
      trail.push({
        kind: "action",
        tool: turn.tool,
        args: turn.argsRaw,
        result,
      });
      messages.push({ role: "assistant", content: llmRes.text });
      messages.push({
        role: "user",
        content: `Observation: ${stringifyObservation(result)}`,
      });
      continue;
    }

    // Run the tool. Tools must not throw, but shield ourselves anyway —
    // a bad tool that does throw must not crash the whole loop.
    let toolResult: ToolResult;
    try {
      toolResult = await tool.run(parsedArgs.args, {
        callingSpecialist: input.specialist.slug,
        taskId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.warn(
        "react-loop tool threw (tools must return ToolResult, not throw)",
        {
          taskId,
          tool: turn.tool,
          err: msg,
        },
      );
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
