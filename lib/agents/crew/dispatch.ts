/**
 * lib/agents/crew/dispatch.ts — Dispatch phase of the crew runner.
 *
 * Sends one sub-step to one specialist. Parses the response into one
 * of three branches:
 *
 *   - tool      — invoke the tool, then re-ask the specialist for an
 *                 answer turn with the tool result injected.
 *   - delegate  — return a delegation request the orchestrator queues.
 *   - text      — straight answer, recorded in the trail.
 *
 * Extracted from `crew.ts` to keep the orchestrator under the
 * 300-line cap.
 */

import "server-only";

import { callLLM, type LLMMessage } from "lib/agents/llm-client";

import { extractJsonObject, safeStringify } from "./helpers";
import { runTool } from "./tools";
import type {
  CrewStep,
  Specialist,
  Task,
  ToolCall,
  ToolRegistry,
} from "./types";

export type DispatchOutcome = {
  /** Trail steps to merge into the master log. */
  steps: CrewStep[];
  /** The specialist's final answer text, if any. */
  answer?: string;
  /** If the specialist requested delegation. */
  delegateTo?: string;
  delegateSubtask?: string;
};

export async function dispatchStep(opts: {
  specialist: Specialist;
  subtask: string;
  task: Task;
  priorTrail: ReadonlyArray<CrewStep>;
  tools?: ToolRegistry;
  timeoutMs?: number;
  totalUsage: { inputTokens: number; outputTokens: number };
}): Promise<DispatchOutcome> {
  const out: DispatchOutcome = { steps: [] };

  const userPrompt = buildSpecialistUserPrompt({
    specialist: opts.specialist,
    subtask: opts.subtask,
    task: opts.task,
    priorTrail: opts.priorTrail,
    toolNames: opts.specialist.tools,
    allowDelegation: opts.specialist.allowDelegation,
  });

  const messages: LLMMessage[] = [
    { role: "system", content: opts.specialist.systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const res = await callLLM({
    provider: opts.specialist.preferredModel.provider,
    model: opts.specialist.preferredModel.model,
    via: opts.specialist.preferredModel.via,
    messages,
    maxTokens: 1024,
    temperature: 0.7,
    timeoutMs: opts.timeoutMs,
  });

  if (!res.ok) {
    out.steps.push({
      kind: "stop",
      reason: `${opts.specialist.slug} LLM call failed: ${res.error}`,
    });
    return out;
  }

  opts.totalUsage.inputTokens += res.usage.inputTokens;
  opts.totalUsage.outputTokens += res.usage.outputTokens;

  const parsed = parseSpecialistResponse(res.text);

  // --- Tool branch -------------------------------------------------------
  if (parsed.kind === "tool") {
    const toolStep = await runTool({
      specialist: opts.specialist,
      call: parsed.call,
      tools: opts.tools,
    });
    out.steps.push(toolStep);

    // Feed the tool result back to the specialist for an answer turn.
    const followupMessages: LLMMessage[] = [
      ...messages,
      { role: "assistant", content: res.text },
      {
        role: "user",
        content:
          `Tool "${parsed.call.tool}" returned:\n${safeStringify(
            toolStep.kind === "tool" ? toolStep.result ?? toolStep.error ?? null : null,
          )}\n\nIncorporate this and produce your final answer for the sub-task. Plain text only — no further tool calls.`,
      },
    ];

    const followup = await callLLM({
      provider: opts.specialist.preferredModel.provider,
      model: opts.specialist.preferredModel.model,
      via: opts.specialist.preferredModel.via,
      messages: followupMessages,
      maxTokens: 1024,
      temperature: 0.7,
      timeoutMs: opts.timeoutMs,
    });

    if (followup.ok) {
      opts.totalUsage.inputTokens += followup.usage.inputTokens;
      opts.totalUsage.outputTokens += followup.usage.outputTokens;
      const followupText = followup.text.trim();
      if (followupText) {
        out.steps.push({
          kind: "answer",
          by: opts.specialist.slug,
          text: followupText,
        });
        out.answer = followupText;
      }
    } else {
      out.steps.push({
        kind: "stop",
        reason: `${opts.specialist.slug} follow-up after tool call failed: ${followup.error}`,
      });
    }
    return out;
  }

  // --- Delegate branch ---------------------------------------------------
  if (parsed.kind === "delegate") {
    if (!opts.specialist.allowDelegation) {
      out.steps.push({
        kind: "stop",
        reason: `${opts.specialist.slug} attempted to delegate but allowDelegation is false`,
      });
      return out;
    }
    out.steps.push({
      kind: "delegate",
      by: opts.specialist.slug,
      to: parsed.to,
      subtask: parsed.subtask,
    });
    out.delegateTo = parsed.to;
    out.delegateSubtask = parsed.subtask;
    return out;
  }

  // --- Plain-text branch -------------------------------------------------
  const text = parsed.text.trim();
  if (text) {
    out.steps.push({ kind: "answer", by: opts.specialist.slug, text });
    out.answer = text;
  }
  return out;
}

// ---------------------------------------------------------------------
// Specialist user-prompt assembler
// ---------------------------------------------------------------------

function buildSpecialistUserPrompt(opts: {
  specialist: Specialist;
  subtask: string;
  task: Task;
  priorTrail: ReadonlyArray<CrewStep>;
  toolNames: ReadonlyArray<string>;
  allowDelegation: boolean;
}): string {
  const lines: string[] = [];
  lines.push(`You are ${opts.specialist.displayName} — ${opts.specialist.role}.`);
  lines.push(`Your goal: ${opts.specialist.goal}`);
  lines.push(`Your backstory: ${opts.specialist.backstory}`);
  lines.push("");
  lines.push(`OVERALL TASK: ${opts.task.description}`);
  if (opts.task.expectedOutput) {
    lines.push(`EXPECTED OUTPUT SHAPE: ${opts.task.expectedOutput}`);
  }
  if (opts.task.context && Object.keys(opts.task.context).length > 0) {
    lines.push(`CONTEXT:\n${safeStringify(opts.task.context)}`);
  }
  lines.push("");
  lines.push(`YOUR SUB-TASK: ${opts.subtask}`);
  lines.push("");

  const priorAnswers = opts.priorTrail.filter(
    (s): s is Extract<CrewStep, { kind: "answer" }> => s.kind === "answer",
  );
  if (priorAnswers.length > 0) {
    lines.push(`PRIOR ANSWERS FROM OTHER SPECIALISTS:`);
    for (const a of priorAnswers) {
      lines.push(`- [${a.by}] ${a.text}`);
    }
    lines.push("");
  }

  if (opts.toolNames.length > 0) {
    lines.push(`AVAILABLE TOOLS: ${opts.toolNames.join(", ")}`);
    lines.push(
      `To call a tool, respond with EXACTLY this JSON shape and nothing else:`,
    );
    lines.push(`{"tool": "<name>", "args": { ... }}`);
    lines.push("");
  }

  if (opts.allowDelegation) {
    lines.push(
      `You may delegate to another specialist. To delegate, respond with EXACTLY this JSON shape:`,
    );
    lines.push(`{"delegate": "<slug>", "subtask": "<one sentence>"}`);
    lines.push("");
  }

  lines.push(
    `Otherwise: respond with the answer to your sub-task as plain text. No JSON wrapper, no markdown code fences.`,
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------
// Specialist-response parser
// ---------------------------------------------------------------------

type ParsedResponse =
  | { kind: "tool"; call: ToolCall }
  | { kind: "delegate"; to: string; subtask: string }
  | { kind: "text"; text: string };

function parseSpecialistResponse(raw: string): ParsedResponse {
  const obj = extractJsonObject(raw);
  if (obj) {
    if (typeof obj.tool === "string") {
      return {
        kind: "tool",
        call: { tool: obj.tool, args: obj.args ?? {} },
      };
    }
    if (typeof obj.delegate === "string" && typeof obj.subtask === "string") {
      return {
        kind: "delegate",
        to: obj.delegate,
        subtask: obj.subtask,
      };
    }
  }
  return { kind: "text", text: raw };
}
