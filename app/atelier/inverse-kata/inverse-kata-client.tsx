"use client";

/**
 * app/atelier/inverse-kata/inverse-kata-client.tsx — Phase-A chamber UI.
 *
 * Sketch surface (left), kata result panel (right), Laban canon strip
 * (bottom). The user draws with pointer events; on release, we POST
 * the polyline to /api/inverse-kata and render the matched sequence.
 *
 * Segmentation is visualised by drawing per-segment polylines in
 * different Laban-corner colours over the source sketch — the user
 * can see WHERE the matcher cut the trail and which Laban corner
 * each piece belongs to.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { createLogger } from "lib/log";
import {
  type InverseKataResult,
  type Vec2,
  summariseSegment,
} from "lib/capabilities/inverse-kata/match";
import {
  type LabanCorner,
  getLabanCorner,
  labanCorners,
} from "lib/assets/flow-arts";
import { useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:inverse-kata");

type OrchestratedSegment = {
  kataSlug: string;
  labanEffort: string;
  durationMs: number;
  confidence: number;
  rationale: string;
};

type OrchestratorResult = {
  sequence: OrchestratedSegment[];
  agreementWithPhaseA: "confirms" | "refines" | "disagrees";
  overallReasoning: string;
  uncertainSegments: number[];
};

type OrchestratorState =
  | { kind: "idle" }
  | { kind: "thinking" }
  | { kind: "ready"; result: OrchestratorResult }
  | { kind: "error"; message: string };

type State =
  | { kind: "idle" }
  | { kind: "drawing"; points: Vec2[]; timing: number[]; startMs: number }
  | { kind: "matching"; points: Vec2[]; timing: number[] }
  | {
      kind: "ready";
      points: Vec2[];
      timing: number[];
      result: InverseKataResult;
    }
  | { kind: "error"; message: string };

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 480;
const POINT_SAMPLE_PIXEL_THRESHOLD = 4;

export default function InverseKataClient() {
  useActiveChamber("inverse-kata");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [orch, setOrch] = useState<OrchestratorState>({ kind: "idle" });
  const sketchIdHelp = useId();

  // Resize canvas DPR-aware so strokes stay crisp.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  // Redraw whenever the state changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#0c0c10";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid
    ctx.strokeStyle = "rgba(120, 120, 140, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(CANVAS_WIDTH, y + 0.5);
      ctx.stroke();
    }

    if (state.kind === "drawing" || state.kind === "matching") {
      drawPolyline(ctx, state.points, "rgba(244, 230, 240, 0.8)", 2);
    } else if (state.kind === "ready") {
      // Source in faint chrome
      drawPolyline(ctx, state.points, "rgba(180, 180, 200, 0.25)", 1);
      // Per-segment overlay in Laban corner colour
      for (const seg of state.result.segments) {
        const corner = getLabanCorner(seg.labanEffort);
        const colour = corner?.hexColor ?? "#ffffff";
        const sub = state.points.slice(
          seg.segment.startIdx,
          seg.segment.endIdx + 1,
        );
        drawPolyline(ctx, sub, colour, 3.5);
        // Endpoint dots
        const start = state.points[seg.segment.startIdx];
        const end = state.points[seg.segment.endIdx];
        if (start) drawDot(ctx, start, colour);
        if (end) drawDot(ctx, end, colour);
      }
    }
  }, [state]);

  // ---- Pointer handlers ----

  const getCanvasPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Vec2 => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      const p = getCanvasPoint(e);
      const now = performance.now();
      setState({
        kind: "drawing",
        points: [p],
        timing: [0],
        startMs: now,
      });
    },
    [getCanvasPoint],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      setState((cur) => {
        if (cur.kind !== "drawing") return cur;
        const p = getCanvasPoint(e);
        const last = cur.points[cur.points.length - 1]!;
        const dx = p[0] - last[0];
        const dy = p[1] - last[1];
        if (Math.hypot(dx, dy) < POINT_SAMPLE_PIXEL_THRESHOLD) return cur;
        return {
          ...cur,
          points: [...cur.points, p],
          timing: [...cur.timing, performance.now() - cur.startMs],
        };
      });
    },
    [getCanvasPoint],
  );

  const runMatch = useCallback(async (points: Vec2[], timing: number[]) => {
    if (points.length < 4) {
      setState({
        kind: "error",
        message: "Trail too short — draw a longer line (at least 4 sample points).",
      });
      return;
    }
    setState({ kind: "matching", points, timing });
    try {
      // Pass a default trailScale of 0.005 metres-per-pixel (i.e. the
      // canvas represents a ~3.6m × 2.4m volume). This is only used when
      // the matcher needs to infer duration from length; we always pass
      // timing here so it's mostly informational.
      const res = await fetch("/api/inverse-kata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points,
          timing,
          trailScale: 0.005,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(text) as { error?: string };
          if (parsed.error) message = parsed.error;
        } catch {
          if (text.length > 0 && text.length < 300) message = text;
        }
        setState({ kind: "error", message });
        return;
      }
      const json = (await res.json()) as { result?: InverseKataResult };
      if (!json.result) {
        setState({ kind: "error", message: "Server replied without a result." });
        return;
      }
      setState({ kind: "ready", points, timing, result: json.result });
    } catch (err) {
      log.error("match failed", { err });
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Match failed.",
      });
    }
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setState((cur) => {
        if (cur.kind !== "drawing") return cur;
        // Fire-and-forget the match; runMatch will transition state itself.
        void runMatch(cur.points, cur.timing);
        return { kind: "matching", points: cur.points, timing: cur.timing };
      });
    },
    [runMatch],
  );

  const onClear = useCallback(() => {
    setState({ kind: "idle" });
    setOrch({ kind: "idle" });
  }, []);

  // Reset orchestrator whenever a fresh phase-A result lands.
  useEffect(() => {
    if (state.kind === "drawing" || state.kind === "matching") {
      setOrch({ kind: "idle" });
    }
  }, [state.kind]);

  const onAskLlm = useCallback(async () => {
    if (state.kind !== "ready") return;
    setOrch({ kind: "thinking" });
    try {
      const res = await fetch("/api/inverse-kata/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: state.points,
          timing: state.timing,
          phaseAResult: state.result,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(text) as { error?: string };
          if (parsed.error) message = parsed.error;
        } catch {
          if (text.length > 0 && text.length < 300) message = text;
        }
        setOrch({ kind: "error", message });
        return;
      }
      const json = (await res.json()) as { result?: OrchestratorResult };
      if (!json.result) {
        setOrch({ kind: "error", message: "Empty LLM result." });
        return;
      }
      setOrch({ kind: "ready", result: json.result });
    } catch (err) {
      log.error("orchestrate failed", { err });
      setOrch({
        kind: "error",
        message: err instanceof Error ? err.message : "LLM call failed.",
      });
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-8">
      {/* Canvas + result panel */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Sketch surface */}
        <div className="flex flex-col gap-2">
          <span className="chrome-label text-chrome-400">Sketch surface</span>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-describedby={sketchIdHelp}
            className="touch-none rounded-sm border border-warm-black-700 bg-warm-black-950"
          />
          <p id={sketchIdHelp} className="text-xs leading-relaxed text-chrome-500">
            Drag to draw a trail. On release, the chamber matches it
            against the kata library. Press Clear to start over.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClear}
              className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Result panel */}
        <aside className="flex flex-col gap-3 rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4">
          <span className="chrome-label text-chrome-400">Kata script</span>
          {state.kind === "idle" ? (
            <p className="text-sm text-chrome-400">
              Draw a trail. The matched kata sequence will appear here.
            </p>
          ) : state.kind === "drawing" ? (
            <p className="text-sm text-chrome-400">
              Drawing&hellip; {state.points.length} sample points so far.
            </p>
          ) : state.kind === "matching" ? (
            <p className="text-sm text-chrome-300">
              Matching against the kata library&hellip;
            </p>
          ) : state.kind === "error" ? (
            <p className="text-sm text-pink-200">{state.message}</p>
          ) : (
            <ReadyResult result={state.result} />
          )}
        </aside>
      </section>

      {/* Phase B — LLM orchestrator */}
      {state.kind === "ready" ? (
        <section className="flex flex-col gap-3 rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="chrome-label text-chrome-400">
              Phase B &middot; LLM orchestrator (Claude)
            </span>
            <button
              type="button"
              onClick={onAskLlm}
              disabled={orch.kind === "thinking"}
              className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
            >
              {orch.kind === "thinking"
                ? "Thinking…"
                : orch.kind === "ready"
                  ? "Ask again"
                  : "Ask the LLM"}
            </button>
          </div>
          {orch.kind === "idle" ? (
            <p className="text-xs leading-relaxed text-chrome-400">
              Phase A is heuristic feature-matching — fast but brittle on
              edge cases. Phase B reads the trail in plain language, uses
              the kata-notes context (what each move actually means), and
              suggests transitions Phase A&rsquo;s pure-geometry view can&rsquo;t
              see. Rate-limited 8/hr.
            </p>
          ) : orch.kind === "thinking" ? (
            <p className="text-xs leading-relaxed text-chrome-300">
              Claude is reading the kata library + Laban canon + your
              trail. Usually back in ~5-10s.
            </p>
          ) : orch.kind === "error" ? (
            <p className="text-xs leading-relaxed text-pink-200">{orch.message}</p>
          ) : (
            <OrchestratorPanel result={orch.result} />
          )}
        </section>
      ) : null}

      {/* Laban canon strip — the 8 corners */}
      <section className="flex flex-col gap-3">
        <span className="chrome-label text-chrome-400">
          Laban Basic Efforts &middot; the eight corners
        </span>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {labanCorners.map((c) => (
            <li
              key={c.name}
              className="flex flex-col gap-1 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-3 text-xs text-chrome-300"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.hexColor }}
                />
                <span className="font-mono text-chrome-100">{c.name}</span>
              </span>
              <span className="text-[10px] leading-snug text-chrome-500">
                {c.space} &middot; {c.weight} &middot; {c.time} &middot;{" "}
                {c.flow}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- Sub-components ----------

function ReadyResult({ result }: { result: InverseKataResult }) {
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
          {result.segments.length} segments &middot; {totalSec}s &middot; {meanPct}% mean conf
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

function OrchestratorPanel({ result }: { result: OrchestratorResult }) {
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
                  {s.labanEffort} · {Math.round(s.durationMs)}ms · {asPct(s.confidence)}
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

// ---------- Drawing helpers ----------

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: Vec2[],
  colour: string,
  width: number,
) {
  if (points.length === 0) return;
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const first = points[0]!;
  ctx.moveTo(first[0], first[1]);
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
}

function drawDot(ctx: CanvasRenderingContext2D, point: Vec2, colour: string) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(point[0], point[1], 4, 0, Math.PI * 2);
  ctx.fill();
}
