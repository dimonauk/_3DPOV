/**
 * lib/agents/crew/synthesise.ts — Final-output composition.
 *
 * Once the dispatch loop has run, the orchestrator reads every
 * specialist's answer and produces one coherent piece of output in
 * its own voice. If the LLM call fails, the helper falls back to
 * the concatenated contributions rather than returning empty.
 *
 * Extracted from `crew.ts` to keep the orchestrator under the
 * 300-line cap.
 */

import "server-only";

import { createLogger } from "lib/log";
import { callLLM, type LLMMessage } from "lib/agents/llm-client";

import type { CrewStep, Specialist, Task } from "./types";

const log = createLogger("agents.crew.synthesise");

export async function synthesise(opts: {
  task: Task;
  orchestrator: Specialist;
  trail: ReadonlyArray<CrewStep>;
  timeoutMs?: number;
  totalUsage: { inputTokens: number; outputTokens: number };
}): Promise<string> {
  const answers = opts.trail.filter(
    (s): s is Extract<CrewStep, { kind: "answer" }> => s.kind === "answer",
  );

  if (answers.length === 0) return "";

  const contributions = answers
    .map((a) => `[${a.by}]\n${a.text}`)
    .join("\n\n");

  const synthesisPrompt = [
    `You are synthesising the final output for the task below. Your crewmates have contributed; weave their work into one coherent answer in your voice as the orchestrator.`,
    ``,
    `TASK: ${opts.task.description}`,
    opts.task.expectedOutput
      ? `EXPECTED OUTPUT: ${opts.task.expectedOutput}`
      : "",
    ``,
    `CONTRIBUTIONS:`,
    contributions,
    ``,
    `Return ONLY the final output. No preamble, no meta-commentary, no JSON.`,
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  const messages: LLMMessage[] = [
    { role: "system", content: opts.orchestrator.systemPrompt },
    { role: "user", content: synthesisPrompt },
  ];

  const res = await callLLM({
    provider: opts.orchestrator.preferredModel.provider,
    model: opts.orchestrator.preferredModel.model,
    via: opts.orchestrator.preferredModel.via,
    messages,
    maxTokens: 2048,
    temperature: 0.7,
    timeoutMs: opts.timeoutMs,
  });

  if (!res.ok) {
    log.warn("synthesis failed; falling back to concatenated contributions", {
      taskId: opts.task.id,
      error: res.error,
    });
    return contributions;
  }
  opts.totalUsage.inputTokens += res.usage.inputTokens;
  opts.totalUsage.outputTokens += res.usage.outputTokens;
  return res.text.trim();
}
