"use client";

/**
 * RunButton.tsx — client component that runs a reference crew against
 * the live API and renders the trace inline. Handles human_in_the_loop
 * pause/resume by round-tripping the resume_state.
 *
 * Used inside the (server-rendered) crew cards on
 * /capabilities/agent/crew-run. The button POSTs to
 * /api/capabilities/agent/crew-run/run; the route calls runCrew() and
 * returns { result, trace }.
 *
 * This is deliberately self-contained — no shared state, no store. Each
 * button instance owns its own run lifecycle.
 */

import { useState } from "react";

type CrewTraceTurn = {
  agent_id: string;
  task_id: string;
  text: string;
  duration_ms: number;
  wave: number | null;
  offset_ms: number;
};

type CrewTrace = {
  status: string;
  run_id: string;
  total_duration_ms: number | null;
  turns: CrewTraceTurn[];
  skipped_task_ids: string[];
  paused_at_task: string | null;
  error: string | null;
};

// Loose shape — we only read the fields we render.
type RunResponse = {
  result: {
    status: string;
    resume_state?: unknown;
    error?: string;
    paused_at_task?: string;
  };
  trace: CrewTrace;
};

type Phase = "idle" | "running" | "done" | "paused" | "error";

export function RunButton({ crewId }: { crewId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [trace, setTrace] = useState<CrewTrace | null>(null);
  const [resumeState, setResumeState] = useState<unknown>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [runCount, setRunCount] = useState(0);

  async function run(resumeFrom?: unknown) {
    setPhase("running");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/capabilities/agent/crew-run/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crew_id: crewId,
          ...(resumeFrom ? { resume_from: resumeFrom } : {}),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        setErrorMsg(
          body.message ?? body.error ?? `HTTP ${res.status} ${res.statusText}`,
        );
        setPhase("error");
        return;
      }

      const data = (await res.json()) as RunResponse;
      setTrace(data.trace);
      setRunCount((c) => c + 1);

      if (data.result.status === "paused_for_approval") {
        setResumeState(data.result.resume_state ?? null);
        setPhase("paused");
      } else if (data.result.status === "error") {
        setErrorMsg(data.result.error ?? "crew run errored");
        setPhase("error");
      } else {
        setResumeState(null);
        setPhase("done");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }

  const isBusy = phase === "running";

  return (
    <div className="mt-6 border-t border-warm-black-800 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => run()}
          disabled={isBusy}
          className={`rounded-sm border px-4 py-1.5 text-xs uppercase tracking-wider transition-colors ${
            isBusy
              ? "cursor-not-allowed border-warm-black-700 text-chrome-500"
              : "border-pink-200/60 text-pink-200 hover:bg-pink-200/10"
          }`}
        >
          {isBusy ? "running…" : runCount > 0 ? "run again" : "run crew"}
        </button>

        {phase === "paused" && (
          <button
            type="button"
            onClick={() => run(resumeState)}
            className="rounded-sm border border-pink-200/60 px-4 py-1.5 text-xs uppercase tracking-wider text-pink-200 hover:bg-pink-200/10"
          >
            approve &amp; resume →
          </button>
        )}

        {trace && (
          <span className="font-mono text-[10px] text-chrome-400">
            run {trace.run_id.slice(0, 8)} ·{" "}
            {trace.total_duration_ms !== null
              ? `${trace.total_duration_ms}ms`
              : "—"}
          </span>
        )}
      </div>

      {phase === "running" && (
        <p className="mt-3 text-xs text-chrome-400">
          dispatching agents… hierarchical crews run all workers then a
          synthesis pass, so this can take a minute.
        </p>
      )}

      {phase === "error" && errorMsg && (
        <div className="mt-3 rounded-sm border border-warm-black-700 bg-warm-black-950/60 p-3 font-mono text-xs text-chrome-400">
          {errorMsg}
        </div>
      )}

      {phase === "paused" && trace && (
        <div className="mt-3 rounded-sm border border-pink-200/40 bg-warm-black-950/40 p-3 text-xs text-chrome-300">
          Paused for human approval at task{" "}
          <span className="font-mono text-pink-200">
            {trace.paused_at_task}
          </span>
          . Review the turns below, then approve to continue. (For a real
          gate you'd inspect the output and decide — here, approve resumes
          to the next HITL task or completion.)
        </div>
      )}

      {trace && trace.turns.length > 0 && (
        <div className="mt-4 space-y-2">
          {trace.turns.map((turn, idx) => {
            const isSynthesis = turn.task_id === "__synthesis__";
            return (
              <div
                key={`${turn.task_id}-${idx}`}
                className={`rounded-sm border p-3 text-xs ${
                  isSynthesis
                    ? "border-pink-200/40 bg-warm-black-950/40"
                    : "border-warm-black-800 bg-warm-black-950/40"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-chrome-200">
                    {isSynthesis ? "synthesis" : turn.task_id}
                    <span className="ml-2 text-chrome-500">
                      {turn.agent_id}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-chrome-500">
                    {turn.wave === -1
                      ? "post-DAG"
                      : turn.wave === null
                        ? ""
                        : `wave ${turn.wave}`}{" "}
                    · {turn.duration_ms}ms
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-chrome-300">
                  {turn.text}
                </p>
              </div>
            );
          })}

          {trace.skipped_task_ids.length > 0 && (
            <div className="rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-3 text-xs text-chrome-400">
              <span className="chrome-label">Skipped</span>{" "}
              <span className="font-mono">
                {trace.skipped_task_ids.join(", ")}
              </span>{" "}
              — conditional edges resolved false.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
