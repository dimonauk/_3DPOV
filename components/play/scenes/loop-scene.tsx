"use client";

/**
 * components/play/scenes/loop-scene.tsx — Solo 3, "The Loop."
 *
 * Five stages in one ~30-second session: Draw → Capture → Reify →
 * Encounter → Pass. The Holoflow Loop is six positions in canon; this
 * level condenses to five because the first and last "body in space"
 * positions collapse into one continuous bracket.
 *
 * The marching-cubes pass uses canonical Three.js (`MarchingCubes` from
 * `three/examples/jsm/objects`) at 16³ resolution; each trail vertex
 * stamps a soft Gaussian blob into the volume; the iso-surface is the
 * shape of the gesture.
 *
 * Pieces live in sibling modules:
 *   - `./loop-scene-types`         — Stage union + constants
 *   - `./loop-scene-draw-surface`  — pointer raycast onto a camera plane
 *   - `./loop-scene-reified-mesh`  — MarchingCubes-based mesh
 *   - `./loop-scene-overlays`      — StageLabel, CaptureFrame, PassPanel
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useState } from "react";
import * as THREE from "three";
import { toast } from "sonner";

import { TrailLine } from "../trail-line";

import { MouseDrawSurface } from "./loop-scene-draw-surface";
import { ReifiedMesh } from "./loop-scene-reified-mesh";
import {
  CaptureFrame,
  LessonFooter,
  PassPanel,
  StageLabel,
} from "./loop-scene-overlays";
import {
  MAX_TRAIL_VERTICES,
  MIN_VERTICES_TO_CAPTURE,
  type Stage,
} from "./loop-scene-types";

export function LoopScene() {
  const [stage, setStage] = useState<Stage>("draw");
  const [liveTrail, setLiveTrail] = useState<THREE.Vector3[]>([]);
  const [capturedTrail, setCapturedTrail] = useState<THREE.Vector3[]>([]);
  const [fadeIn, setFadeIn] = useState(0);

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

  const onCommit = useCallback(() => {
    setLiveTrail((current) => {
      if (current.length < MIN_VERTICES_TO_CAPTURE) {
        return [];
      }
      setCapturedTrail(current.slice());
      setStage("capture");
      return [];
    });
  }, []);

  // Stage timeline. Capture ~1s, reify ~2s (fade-in), encounter ~5s, pass.
  useEffect(() => {
    if (stage === "capture") {
      const t = window.setTimeout(() => setStage("reify"), 1000);
      return () => window.clearTimeout(t);
    }
    if (stage === "reify") {
      const start = performance.now();
      let frame = 0;
      const tick = () => {
        const t = (performance.now() - start) / 2000;
        setFadeIn(Math.min(0.95, t * 0.95));
        if (t < 1) {
          frame = window.requestAnimationFrame(tick);
        } else {
          setStage("encounter");
        }
      };
      frame = window.requestAnimationFrame(tick);
      return () => window.cancelAnimationFrame(frame);
    }
    if (stage === "encounter") {
      const t = window.setTimeout(() => setStage("pass"), 5000);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [stage]);

  const reset = useCallback(() => {
    setLiveTrail([]);
    setCapturedTrail([]);
    setStage("draw");
    setFadeIn(0);
  }, []);

  const publishToRookery = useCallback(() => {
    toast("Trail saved locally", {
      description: "Rookery publish stubbed — the door lands with Solo 7.",
    });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("holoflow.play.loop.passed", "1");
      } catch {
        // localStorage may be unavailable.
      }
    }
  }, []);

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <div className="chrome-label mb-3 text-pink-200">
        Loop level &middot; preview
      </div>
      <p className="mb-6 max-w-prose text-sm text-chrome-300">
        Five stages in one session. Draw a trail; watch it captured, reified
        into a small mesh, and encountered from the other side. The body
        that drew it sees what it left behind.
      </p>

      <div className="relative h-[60vh] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-[#0c0a12]">
        <StageLabel stage={stage} />

        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
          >
            Reset
          </button>
        </div>

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
          <gridHelper
            args={[10, 20, "#1a1530", "#13101e"]}
            position={[0, -1.2, 0]}
          />

          <ambientLight intensity={0.4} />
          <pointLight position={[2, 2, 3]} intensity={1.2} color={"#00f3ff"} />
          <pointLight position={[-2, -1, 2]} intensity={0.6} color={"#ffb3d9"} />

          {stage === "draw" ? (
            <>
              {liveTrail.length > 1 ? (
                <TrailLine
                  points={liveTrail}
                  maxVertices={MAX_TRAIL_VERTICES}
                />
              ) : null}
              <MouseDrawSurface
                active
                onPoint={appendPoint}
                onCommit={onCommit}
              />
            </>
          ) : null}

          {(stage === "capture" ||
            stage === "reify" ||
            stage === "encounter" ||
            stage === "pass") &&
          capturedTrail.length > 1 ? (
            <TrailLine
              points={capturedTrail}
              maxVertices={MAX_TRAIL_VERTICES}
              opacity={stage === "encounter" || stage === "pass" ? 0.3 : 0.8}
            />
          ) : null}
          <CaptureFrame active={stage === "capture"} />

          {(stage === "reify" ||
            stage === "encounter" ||
            stage === "pass") &&
          capturedTrail.length > 1 ? (
            <ReifiedMesh
              points={capturedTrail}
              fadeIn={stage === "reify" ? fadeIn : 0.95}
              orbit={stage === "encounter" || stage === "pass"}
            />
          ) : null}

          {stage === "encounter" || stage === "pass" ? (
            <OrbitControls enablePan={false} enableZoom={false} />
          ) : null}
        </Canvas>
      </div>

      {stage === "pass" ? (
        <PassPanel onPublish={publishToRookery} onReset={reset} />
      ) : null}

      <LessonFooter />
    </div>
  );
}
