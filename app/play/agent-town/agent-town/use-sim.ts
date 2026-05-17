"use client";

/**
 * app/play/agent-town/agent-town/use-sim.ts — Sim init + the
 * 24-fps draw/tick loop. Spins up each townie inside its room
 * bounds with a random wander target, then on every rAF tick
 * advances positions, swaps targets on timer expiry, and repaints
 * the floor + rooms + grid + each townie + the selection ring.
 *
 * Extracted from agent-town-client.tsx per ARCHITECTURE.md Rule 1.
 */

import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import type { CastMemberId } from "lib/cast";
import { createLogger } from "lib/log";

import { drawFloor, drawGrid, drawRooms, drawShape } from "./canvas-draw";
import { ROSTER } from "./roster";
import { boundsForHome, randomIn, timestamp } from "./sim-helpers";
import { FRAME_MS, H, W, type Sim, type Townie } from "./types";

const log = createLogger("client:play.agent-town:sim");

export type UseSimOptions = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  selectedRef: RefObject<CastMemberId | null>;
  pushLog: (line: string) => void;
};

export type UseSimResult = {
  rosterById: Map<CastMemberId, Townie>;
  simsRef: RefObject<Sim[]>;
  handleCanvasClick: (
    e: React.MouseEvent<HTMLCanvasElement>,
  ) => CastMemberId | null;
};

export function useSim({
  canvasRef,
  selectedRef,
  pushLog,
}: UseSimOptions): UseSimResult {
  const simsRef = useRef<Sim[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const rosterById = useMemo(() => {
    const map = new Map<CastMemberId, Townie>();
    for (const t of ROSTER) map.set(t.id, t);
    return map;
  }, []);

  // ---- initial sim state ----
  useEffect(() => {
    if (simsRef.current.length > 0) return;
    simsRef.current = ROSTER.map((t) => {
      const b = boundsForHome(t.home);
      const x = randomIn(b.minX, b.maxX);
      const y = randomIn(b.minY, b.maxY);
      return {
        id: t.id,
        x,
        y,
        targetX: x,
        targetY: y,
        speed: 0.4 + Math.random() * 0.45,
        wanderTimer: 60 + Math.random() * 200,
        bounds: b,
      };
    });
    pushLog(`floor online — ${ROSTER.length} voices in residence.`);
    log.info("sim initialised", { count: ROSTER.length });
  }, [pushLog]);

  // ---- draw + tick loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = (now: number) => {
      if (now - lastTickRef.current >= FRAME_MS) {
        lastTickRef.current = now;
        // update
        for (const sim of simsRef.current) {
          const dx = sim.targetX - sim.x;
          const dy = sim.targetY - sim.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1) {
            sim.x += (dx / dist) * sim.speed * 1.6;
            sim.y += (dy / dist) * sim.speed * 1.6;
          }
          sim.wanderTimer -= 1;
          if (sim.wanderTimer <= 0) {
            sim.wanderTimer = 100 + Math.random() * 280;
            sim.targetX = randomIn(sim.bounds.minX, sim.bounds.maxX);
            sim.targetY = randomIn(sim.bounds.minY, sim.bounds.maxY);
          }
        }

        // draw
        drawFloor(ctx);
        drawRooms(ctx);
        drawGrid(ctx);

        for (const sim of simsRef.current) {
          const townie = rosterById.get(sim.id);
          if (!townie) continue;
          ctx.save();
          ctx.translate(sim.x, sim.y);
          drawShape(ctx, townie.shape, townie.colour, townie.glow);
          ctx.restore();

          // name label
          ctx.save();
          ctx.fillStyle = townie.colour;
          ctx.font = "8px ui-monospace, Menlo, monospace";
          ctx.textAlign = "center";
          ctx.fillText(townie.name, sim.x, sim.y - 13);
          ctx.restore();

          // selection ring
          if (selectedRef.current === sim.id) {
            ctx.save();
            ctx.strokeStyle = townie.glow;
            ctx.lineWidth = 1.2;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.arc(sim.x, sim.y, 13, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [canvasRef, rosterById, selectedRef]);

  // ---- click to inspect ----
  // Returns the id of the townie at the click position, or null if
  // no shape was within ~halo + body distance. The caller decides
  // what to do with the hit (set selection state, push a log line).
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): CastMemberId | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      // canvas is rendered with CSS scaling, so map pointer back to
      // its internal pixel space before hit-testing.
      const cx = ((e.clientX - rect.left) / rect.width) * W;
      const cy = ((e.clientY - rect.top) / rect.height) * H;
      let hitId: CastMemberId | null = null;
      let hitDist = 18; // ~ halo + body
      for (const sim of simsRef.current) {
        const d = Math.hypot(cx - sim.x, cy - sim.y);
        if (d < hitDist) {
          hitDist = d;
          hitId = sim.id;
        }
      }
      return hitId;
    },
    [canvasRef],
  );

  // Re-export for the host so it can push log lines using a consistent
  // timestamp format.
  void timestamp;

  return { rosterById, simsRef, handleCanvasClick };
}
