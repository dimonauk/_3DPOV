"use client";

/**
 * app/atelier/inverse-kata/inverse-kata/result-panels.tsx —
 * Phase-A heuristic result (ReadyResult) + Phase-B LLM orchestrator
 * panel (OrchestratorPanel) + tiny ConfidenceBar/asPct helpers.
 *
 * Extracted from inverse-kata-client.tsx per ARCHITECTURE.md Rule 1.
 */

import type { InverseKataResult } from "lib/capabilities/inverse-kata/match";
import { summariseSegment } from "lib/capabilities/inverse-kata/match";
import { getLabanCorner, labanCorners } from "lib/assets/flow-arts";

import type { OrchestratorResult } from "./types";

export function ReadyResult({ result }: { result: InverseKataResult }) {
  if (result.segments.length === 0) {
    return (
      <div className="flex flex-col gap-2 text-sm text-chrome-300">
        <p>No segments classified.</p>
        {result.notes.map((n, i) => (
          <p key={i} className="text-xs text-chrome-500">
            {n}
          </p>
        ))}
      </div>
    );
  }
  const totalSec = (result.totalDurationMs / 1000).toFixed(1);
  const meanPct = Math.round(result.meanConfidence * 100);
  return (
    <div className="flex flex-col gap-3 text-sm text-chrome-200">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-200">
          {result.segments.length} segments &middot; {totalSec}s &middot;{" "}
          {meanPct}% mean conf
        </span>
      </div>
      <ol className="flex flex-col gap-2">
        {result.segments.map((s, i) => (
          <li
            key={i}
            className="flex flex-col gap-1 rounded-sm border border-warm-black-800 bg-warm-black-950 p-2"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    getLabanCorner(s.labanEffort)?.hexColor ?? "#ffffff",
                }}
              />
              <span className="text-chrome-100">{s.kata.name}</span>
              <span className="ml-auto font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                {s.labanEffort}
              </span>
            </div>
            <ConfidenceBar
              label={`Laban ${asPct(s.labanConfidence)}`}
              value={s.labanConfidence}
            />
            <ConfidenceBar
              label={`Kata ${asPct(s.kataConfidence)}`}
              value={s.kataConfidence}
            />
            <p className="text-[11px] leading-snug text-chrome-500">
              {summariseSegment(s, i)}
            </p>
          </li>
        ))}
      </ol>
      {result.notes.length > 0 ? (
        <div className="flex flex-col gap-1 border-t border-warm-black-800 pt-2">
          {result.notes.map((n, i) => (
            <p key={i} className="text-[11px] leading-snug text-chrome-500">
              {n}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OrchestratorPanel({ result }: { result: OrchestratorResult }) {
  const totalSec = (
    result.sequence.reduce((acc, s) => acc + s.durationMs, 0) / 1000
  ).toFixed(1);
  const agreementTone = {
    confirms: "border-emerald-400/40 bg-emerald-900/20 text-emerald-100",
    refines: "border-amber-400/40 bg-amber-900/20 text-amber-100",
    disagrees: "border-pink-400/40 bg-pink-900/20 text-pink-100",
  } as const;
  const tone =
    agreementTone[result.agreementWithPhaseA] ?? agreementTone.refines;
  return (
    <div className="flex flex-col gap-3 text-sm text-chrome-200">
      <div className="flex flex-wrap items-baseline gap-2">
        <span
          className={`rounded-sm border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.15em] ${tone}`}
        >
          {result.agreementWithPhaseA} Phase A
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
          {result.sequence.length} segments &middot; {totalSec}s
        </span>
      </div>
      <p className="text-xs leading-relaxed text-chrome-300">
        {result.overallReasoning}
      </p>
      <ol className="flex flex-col gap-2">
        {result.sequence.map((s, i) => {
          const corner = labanCorners.find((c) => c.name === s.labanEffort);
          const isUncertain = result.uncertainSegments.includes(i);
          return (
            <li
              key={i}
              className={`flex flex-col gap-1 rounded-sm border px-3 py-2 ${
                isUncertain
                  ? "border-amber-400/40 bg-amber-900/10"
                  : "border-warm-black-800 bg-warm-black-950"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: corner?.hexColor ?? "#ffffff" }}
                />
                <span className="text-chrome-100">{s.kataSlug}</span>
                <span className="ml-auto font-mono text-[0.55rem] uppercase tracking-[0.12em] text-chrome-500">
                  {s.labanEffort} · {Math.round(s.durationMs)}ms ·{" "}
                  {asPct(s.confidence)}
                </span>
              </div>
              <p className="text-[11px] leading-snug text-chrome-400">
                {s.rationale}
              </p>
              {isUncertain ? (
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-amber-300">
                  flagged uncertain
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-chrome-500">
        {label}
      </span>
      <span className="flex-1 overflow-hidden rounded-sm bg-warm-black-800">
        <span
          className={`block h-1.5 ${
            pct > 0.6
              ? "bg-emerald-300"
              : pct > 0.35
                ? "bg-amber-300"
                : "bg-pink-300"
          }`}
          style={{ width: `${pct * 100}%` }}
        />
      </span>
    </div>
  );
}

function asPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}
