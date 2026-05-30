/**
 * SkillWebGraph — force-directed node graph on canvas.
 *
 * Lightweight self-contained simulation (no d3 dependency):
 *   - Each node has position + velocity
 *   - Repulsion between every pair (1/r² falloff)
 *   - Spring along every edge (Hooke-style, target = restLength)
 *   - Mild centripetal pull toward canvas centre
 *   - Damping
 *
 * Visual: nodes coloured by cluster, edges drawn first under nodes.
 * Hover surfaces a tooltip; pointer also drags the nearest node.
 * Honors prefers-reduced-motion (renders one frame, then stops).
 *
 * Caller supplies:
 *   nodes: {key, label, cluster, weight?}[]
 *   edges: {a, b}[]
 *   clusterColors: {[cluster]: cssColor}
 */

"use client";

import { useEffect, useRef, useState } from "react";

export type SkillNode = {
  key: string;
  label: string;
  cluster: string;
  /** Node radius weighting; default 1. */
  weight?: number;
};

export type SkillEdge = { a: string; b: string };

type RuntimeNode = SkillNode & { x: number; y: number; vx: number; vy: number; r: number };

export function SkillWebGraph({
  nodes,
  edges,
  clusterColors,
  height = 480,
}: {
  nodes: SkillNode[];
  edges: SkillEdge[];
  clusterColors: Record<string, string>;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; node: RuntimeNode } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    let raf = 0;
    let running = true;
    let drag: RuntimeNode | null = null;

    // build the runtime model — random initial positions in a circle.
    const rt: RuntimeNode[] = nodes.map((n) => ({
      ...n,
      x: 0, y: 0, vx: 0, vy: 0,
      r: 4 + (n.weight ?? 1) * 1.6,
    }));
    const byKey = new Map(rt.map((n) => [n.key, n]));
    const links = edges
      .map((e) => ({ a: byKey.get(e.a), b: byKey.get(e.b) }))
      .filter((e): e is { a: RuntimeNode; b: RuntimeNode } => !!e.a && !!e.b);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // re-seed positions if zero
      if (rt.every((n) => n.x === 0 && n.y === 0)) {
        rt.forEach((n, i) => {
          const a = (i / rt.length) * Math.PI * 2;
          n.x = w / 2 + Math.cos(a) * Math.min(w, h) * 0.35;
          n.y = h / 2 + Math.sin(a) * Math.min(w, h) * 0.35;
        });
      }
    };

    const step = () => {
      // Repulsion: O(n²) — fine for ~60 nodes.
      for (let i = 0; i < rt.length; i++) {
        for (let j = i + 1; j < rt.length; j++) {
          const a = rt[i]!, b = rt[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = Math.max(80, dx * dx + dy * dy);
          const f = 1800 / d2;
          const fx = (dx / Math.sqrt(d2)) * f;
          const fy = (dy / Math.sqrt(d2)) * f;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }
      }
      // Springs along edges.
      for (const l of links) {
        const dx = l.b.x - l.a.x;
        const dy = l.b.y - l.a.y;
        const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const rest = 90;
        const k = 0.022;
        const f = (d - rest) * k;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        l.a.vx += fx; l.a.vy += fy;
        l.b.vx -= fx; l.b.vy -= fy;
      }
      // Centripetal pull + integrate + damping.
      const cx = w / 2, cy = h / 2;
      for (const n of rt) {
        if (drag === n) continue;
        n.vx += (cx - n.x) * 0.0008;
        n.vy += (cy - n.y) * 0.0008;
        n.vx *= 0.86; n.vy *= 0.86;
        n.x += n.vx; n.y += n.vy;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // edges
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(180, 144, 255, 0.18)";
      for (const l of links) {
        ctx.beginPath();
        ctx.moveTo(l.a.x, l.a.y);
        ctx.lineTo(l.b.x, l.b.y);
        ctx.stroke();
      }
      // nodes
      for (const n of rt) {
        ctx.beginPath();
        ctx.fillStyle = clusterColors[n.cluster] ?? "#aaa";
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      if (!running) return;
      step();
      draw();
      if (!reduced) raf = requestAnimationFrame(loop);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      if (drag) {
        drag.x = px; drag.y = py; drag.vx = 0; drag.vy = 0;
      }
      // nearest-node hit test (cheap)
      let best: RuntimeNode | null = null;
      let bestD = Infinity;
      for (const n of rt) {
        const dx = n.x - px;
        const dy = n.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD && d2 < (n.r + 8) ** 2) {
          best = n; bestD = d2;
        }
      }
      setHover(best ? { x: px, y: py, node: best } : null);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (hover) drag = hover.node;
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onPointerUp = (e: PointerEvent) => {
      drag = null;
      canvas.releasePointerCapture?.(e.pointerId);
    };

    resize();
    loop();
    window.addEventListener("resize", resize, { passive: true });
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", () => setHover(null));

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  // hover only listened to via setHover; safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, clusterColors]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden border border-warm-black-700 bg-warm-black-925"
      style={{ height }}
    >
      <canvas ref={canvasRef} className="block h-full w-full cursor-crosshair" />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 border border-lavender-400 bg-warm-black-950 px-2 py-1 font-mono text-[10px] text-chrome-100"
          style={{ left: hover.x + 12, top: hover.y - 8 }}
        >
          <div className="font-semibold">{hover.node.label}</div>
          <div className="text-chrome-500">{hover.node.cluster}</div>
        </div>
      )}
    </div>
  );
}
