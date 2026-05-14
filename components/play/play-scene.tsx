"use client";

/**
 * components/play/play-scene.tsx — Solo 2, "The Trail."
 *
 * Mouse-down + drag traces a line on a plane standing one metre in front of
 * the camera; release publishes the trail to local state. The trail's render
 * brightness is driven by the pointer's angular velocity (rad/sec, sampled
 * around the canvas centre) — a continuous fast gesture pushes the trail
 * toward full opacity; a stall dims it.
 *
 * Pass-condition gate: the trail has ≥ PASS_VERTEX_MIN vertices AND the mean
 * angular velocity over the gesture is ≥ PASS_ANGULAR_VELOCITY_MIN rad/s.
 *
 * Module integration: if the visitor passed the Module level, that pass's
 * brush slug (localStorage) drives this scene's `<TrailLine />`; otherwise
 * the thin-line module is the default.
 *
 * Pipeline lives in `./play-scene-draw-surface.tsx`; brush registry in
 * `./play-scene-brush.ts`; HUD/passive overlays in `./play-scene-overlays.tsx`.
 */

import { Canvas } from "@react-three/fiber";
import { useCallback, useState } from "react";
import * as THREE from "three";

import {
  loadBrushFromModulePass,
  type Brush,
} from "./play-scene-brush";
import {
  MAX_TRAIL_VERTICES,
  MouseDrawSurface,
  type AngularState,
} from "./play-scene-draw-surface";
import {
  FailToast,
  FloorReference,
  HudPanel,
  PassToast,
  PublishedTrails,
  XRSessionButton,
} from "./play-scene-overlays";

const PASS_VERTEX_MIN = 200;
const PASS_ANGULAR_VELOCITY_MIN = 1; // rad/sec mean over the gesture

type TrailSnapshot = {
  id: string;
  points: THREE.Vector3[];
  timestamp: number;
  meanAngularVelocity: number;
};

export function PlayScene() {
  const [liveTrail, setLiveTrail] = useState<THREE.Vector3[]>([]);
  const [published, setPublished] = useState<TrailSnapshot[]>([]);
  const [angular, setAngular] = useState<AngularState>({ live: 0, mean: 0 });
  const [drawing, setDrawing] = useState(false);
  const [passed, setPassed] = useState(false);
  const [lastFailReason, setLastFailReason] = useState<string | null>(null);

  const [brush] = useState<Brush>(() => loadBrushFromModulePass());

  const appendPoint = useCallback((p: THREE.Vector3) => {
    setLiveTrail((prev) => {
      const next =
        prev.length >= MAX_TRAIL_VERTICES
          ? prev.slice(prev.length - MAX_TRAIL_VERTICES + 1)
          : prev.slice();
      next.push(p);
      return next;
    });
  }, []);

  const onGestureStart = useCallback(() => {
    setDrawing(true);
    setLastFailReason(null);
  }, []);

  const commit = useCallback((meanAngularVelocity: number) => {
    setDrawing(false);
    setLiveTrail((current) => {
      if (current.length < 2) return [];
      if (current.length < PASS_VERTEX_MIN) {
        setLastFailReason(
          `Only ${current.length} vertices on the trail. The shape needs at least ${PASS_VERTEX_MIN} to read &mdash; keep the gesture moving.`,
        );
        return [];
      }
      if (meanAngularVelocity < PASS_ANGULAR_VELOCITY_MIN) {
        setLastFailReason(
          `Mean angular velocity ${meanAngularVelocity.toFixed(2)} rad/s &mdash; below the ${PASS_ANGULAR_VELOCITY_MIN.toFixed(0)} rad/s threshold. Time-sync gives dots; angular-sync gives the curve.`,
        );
        return [];
      }
      const snapshot: TrailSnapshot = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `trail-${Date.now()}`,
        points: current.slice(),
        timestamp: Date.now(),
        meanAngularVelocity,
      };
      setPublished((prev) => [...prev.slice(-19), snapshot]);
      setPassed(true);
      return [];
    });
  }, []);

  const clearAll = useCallback(() => {
    setLiveTrail([]);
    setPublished([]);
    setPassed(false);
    setLastFailReason(null);
    setAngular({ live: 0, mean: 0 });
  }, []);

  return (
    <div className="relative h-[60vh] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-[#0c0a12]">
      <XRSessionButton />
      <HudPanel
        publishedCount={published.length}
        liveCount={liveTrail.length}
        brushName={brush.name}
        angular={angular}
        passAngularMin={PASS_ANGULAR_VELOCITY_MIN}
      />
      <div className="absolute bottom-3 right-3 z-10 flex gap-2">
        {drawing && angular.mean < PASS_ANGULAR_VELOCITY_MIN ? (
          <div className="chrome-label rounded-sm border border-pink-200/40 bg-pink-200/10 px-3 py-1.5 text-[0.6rem] text-pink-200">
            Keep moving &mdash; the angle is the input.
          </div>
        ) : null}
        <button
          type="button"
          onClick={clearAll}
          className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
        >
          Clear
        </button>
      </div>

      {passed ? <PassToast /> : null}
      {lastFailReason ? <FailToast reasonHtml={lastFailReason} /> : null}

      <Canvas
        camera={{ position: [0, 0, 2.4], fov: 55 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["#0c0a12"]} />
        <FloorReference />
        <PublishedTrails trails={published} brush={brush} />
        <MouseDrawSurface
          active
          liveTrail={liveTrail}
          brush={brush}
          onPoint={appendPoint}
          onCommit={commit}
          onAngular={setAngular}
          onGestureStart={onGestureStart}
        />
      </Canvas>
    </div>
  );
}
