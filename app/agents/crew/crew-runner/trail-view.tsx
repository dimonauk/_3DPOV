"use client";

/**
 * app/agents/crew/crew-runner/trail-view.tsx — Visual rendering of a
 * completed CrewRun: header pill, vertical step timeline, and result
 * pane. Extracted from the runner client to keep the orchestrator
 * under the 300-line cap.
 *
 * Step colour legend:
 *   - plan       chrome
 *   - delegate   pink
 *   - tool       amber
 *   - answer     emerald
 *   - stop       warm-black
 */

import { useMemo, useState } from "react";

import type { ClientCrewRun, ClientCrewStep } from "./types";

export function RunView({ run }: { run: ClientCrewRun }) {
  return (
    <section className="flex flex-col gap-8">
      <RunHeader run={run} />
      <Trail steps={run.trail} />
      <ResultPane output={run.output} ok={run.ok} />
    </section>
  );
}

function RunHeader({ run }: { run: ClientCrewRun }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-sm border border-warm-black-700 bg-warm-black-950 px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-chrome-400">
      <span>
        Task id <span className="text-chrome-200">{run.taskId}</span>
      </span>
      <span>
        Iterations <span className="text-chrome-200">{run.iterations}</span>
      </span>
      <span>
        In tokens{" "}
        <span className="text-chrome-200">{run.totalUsage.inputTokens}</span>
      </span>
      <span>
        Out tokens{" "}
        <span className="text-chrome-200">{run.totalUsage.outputTokens}</span>
      </span>
      <span>
        Status{" "}
        <span className={run.ok ? "text-emerald-200" : "text-pink-200"}>
          {run.ok ? "ok" : "stopped"}
        </span>
      </span>
    </div>
  );
}

function Trail({ steps }: { steps: ClientCrewStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="text-xs leading-relaxed text-chrome-500">
        The crew didn&rsquo;t leave a trail. That shouldn&rsquo;t happen
        — check the server logs.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <TrailStep key={i} index={i} step={step} />
      ))}
    </ol>
  );
}

const STEP_KIND_STYLE: Record<
  ClientCrewStep["kind"],
  { bg: string; border: string; label: string }
> = {
  plan: {
    bg: "bg-chrome-500/10",
    border: "border-chrome-400/30",
    label: "text-chrome-200",
  },
  delegate: {
    bg: "bg-pink-300/10",
    border: "border-pink-300/40",
    label: "text-pink-200",
  },
  tool: {
    bg: "bg-amber-300/10",
    border: "border-amber-300/40",
    label: "text-amber-200",
  },
  answer: {
    bg: "bg-emerald-300/10",
    border: "border-emerald-300/40",
    label: "text-emerald-200",
  },
  stop: {
    bg: "bg-warm-black-700/60",
    border: "border-warm-black-600",
    label: "text-chrome-400",
  },
};

function TrailStep({ index, step }: { index: number; step: ClientCrewStep }) {
  const style = STEP_KIND_STYLE[step.kind];
  const [open, setOpen] = useState(true);
  const speaker = useMemo(() => speakerLabel(step), [step]);

  return (
    <li
      className={`rounded-sm border ${style.border} ${style.bg} px-4 py-3 text-xs text-chrome-200`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3"
      >
        <span className="flex items-center gap-3 text-left">
          <span className={`chrome-label ${style.label}`}>
            {String(index + 1).padStart(2, "0")} &middot; {step.kind}
          </span>
          <span className="text-chrome-300">{speaker}</span>
        </span>
        <span className={`chrome-label ${style.label}`}>
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? <div className="mt-3">{renderStepBody(step)}</div> : null}
    </li>
  );
}

function speakerLabel(step: ClientCrewStep): string {
  switch (step.kind) {
    case "plan":
    case "delegate":
    case "tool":
    case "answer":
      return step.by;
    case "stop":
      return "—";
  }
}

function renderStepBody(step: ClientCrewStep): React.ReactNode {
  switch (step.kind) {
    case "plan":
      return (
        <p className="whitespace-pre-wrap leading-relaxed text-chrome-200">
          {step.reasoning}
        </p>
      );
    case "delegate":
      return (
        <div className="flex flex-col gap-1 leading-relaxed">
          <span className="text-chrome-400">
            → <span className="text-pink-200">{step.to}</span>
          </span>
          <p className="whitespace-pre-wrap text-chrome-200">{step.subtask}</p>
        </div>
      );
    case "tool":
      return (
        <div className="flex flex-col gap-2 leading-relaxed">
          <span className="text-amber-200">tool: {step.tool}</span>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-sm border border-warm-black-700 bg-warm-black-950 p-2 text-[0.7rem] text-chrome-300">
            args: {safeStringify(step.args)}
          </pre>
          {step.result !== undefined ? (
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-sm border border-warm-black-700 bg-warm-black-950 p-2 text-[0.7rem] text-chrome-300">
              result: {safeStringify(step.result)}
            </pre>
          ) : null}
          {step.error ? (
            <p className="text-pink-200">error: {step.error}</p>
          ) : null}
        </div>
      );
    case "answer":
      return (
        <p className="whitespace-pre-wrap leading-relaxed text-emerald-100">
          {step.text}
        </p>
      );
    case "stop":
      return (
        <p className="leading-relaxed text-chrome-400">
          Stopped &mdash; {step.reason}
        </p>
      );
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function ResultPane({ output, ok }: { output: string; ok: boolean }) {
  const borderClass = ok ? "border-emerald-300/40" : "border-pink-300/40";
  const bgClass = ok ? "bg-emerald-300/5" : "bg-pink-300/5";
  const labelClass = ok ? "text-emerald-200" : "text-pink-200";
  return (
    <div
      className={`flex flex-col gap-3 rounded-sm border ${borderClass} ${bgClass} p-5`}
    >
      <span className={`chrome-label ${labelClass}`}>Result</span>
      {output.trim().length === 0 ? (
        <p className="text-xs italic text-chrome-400">
          (The crew returned an empty output. That&rsquo;s usually a
          sign the orchestrator gave up — check the trail above.)
        </p>
      ) : (
        <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-chrome-100">
          {output}
        </pre>
      )}
    </div>
  );
}
