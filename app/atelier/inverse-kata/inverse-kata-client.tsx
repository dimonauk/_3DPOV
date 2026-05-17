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
 *
 * Orchestrator only. State machine (Phase A + Phase B) in
 * inverse-kata/use-match.ts; canvas draw helpers in canvas-draw.ts;
 * result panels (Phase A + Phase B + ConfidenceBar) in
 * result-panels.tsx; constants + state types in types.ts. Per
 * ARCHITECTURE.md Rule 1.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from "react";

import { getLabanCorner, labanCorners } from "lib/assets/flow-arts";
import type { Vec2 } from "lib/capabilities/inverse-kata/match";
import { useActiveChamber } from "lib/state/atelier-hooks";

import { drawDot, drawPolyline } from "./inverse-kata/canvas-draw";
import { OrchestratorPanel, ReadyResult } from "./inverse-kata/result-panels";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  POINT_SAMPLE_PIXEL_THRESHOLD,
} from "./inverse-kata/types";
import { useMatch } from "./inverse-kata/use-match";

export default function InverseKataClient() {
  useActiveChamber("inverse-kata");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sketchIdHelp = useId();

  const { state, setState, orch, runMatch, onAskLlm, onClear } = useMatch();

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

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Vec2 => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    },
    [],
  );

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
    [getCanvasPoint, setState],
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
    [getCanvasPoint, setState],
  );

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
    [runMatch, setState],
  );

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
          <p
            id={sketchIdHelp}
            className="text-xs leading-relaxed text-chrome-500"
          >
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
              onClick={() => void onAskLlm()}
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
              suggests transitions Phase A&rsquo;s pure-geometry view
              can&rsquo;t see. Rate-limited 8/hr.
            </p>
          ) : orch.kind === "thinking" ? (
            <p className="text-xs leading-relaxed text-chrome-300">
              Claude is reading the kata library + Laban canon + your
              trail. Usually back in ~5-10s.
            </p>
          ) : orch.kind === "error" ? (
            <p className="text-xs leading-relaxed text-pink-200">
              {orch.message}
            </p>
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
