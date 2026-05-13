"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { toast } from "sonner";

import { TrailLine } from "../trail-line";

/**
 * LoopScene &mdash; Solo 3, "The Loop."
 *
 * Five stages in one ~30-second session: Draw &rarr; Capture &rarr;
 * Reify &rarr; Encounter &rarr; Pass. The Holoflow Loop is six
 * positions in canon (body / write / capture / reify / encounter /
 * body); the level condenses to five because the first and last
 * "body in space" positions collapse into one continuous bracket
 * &mdash; the visitor is the body the whole way through.
 *
 * The marching-cubes pass uses Three.js&rsquo;s
 * `MarchingCubes` from `three/examples/jsm/objects` &mdash; the
 * canonical implementation, sized at 16&sup3; for v0.1 to keep the
 * reify-step under ~1 second on commodity hardware. Each trail vertex
 * stamps a soft Gaussian blob into the volume; the iso-surface is the
 * shape of the gesture.
 *
 * Persistence is stubbed at "publish to Rookery" &mdash; the toast
 * lands, the Firestore write is queued. See docs/PLAY_GAME_PLAN.md
 * Solo 7 &middot; The Perch for the eventual pipeline.
 */

const MAX_TRAIL_VERTICES = 2000;
const TRAIL_PLANE_DISTANCE = 1;
const MIN_VERTICES_TO_CAPTURE = 60;
const MC_RESOLUTION = 16;
/** Iso-surface threshold; tuned so a typical trail lands ~chunky-but-coherent. */
const MC_ISOLATION = 80;
/** Per-vertex "strength" of the Gaussian stamp into the field. */
const MC_BALL_STRENGTH = 0.35;
/** Per-vertex Gaussian falloff. Lower numbers = fatter blobs. */
const MC_BALL_SUBTRACT = 12;

type Stage = "draw" | "capture" | "reify" | "encounter" | "pass";

function MouseDrawSurface({
  active,
  onPoint,
  onCommit,
}: {
  active: boolean;
  onPoint: (p: THREE.Vector3) => void;
  onCommit: () => void;
}) {
  const { camera, gl } = useThree();
  const drawing = useRef(false);
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(
    new THREE.Plane(new THREE.Vector3(0, 0, 1), TRAIL_PLANE_DISTANCE),
  );

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.current.setFromCamera(ndc, camera);
      const planeNormal = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .normalize();
      const planePoint = camera.position
        .clone()
        .add(planeNormal.clone().multiplyScalar(TRAIL_PLANE_DISTANCE));
      plane.current.setFromNormalAndCoplanarPoint(planeNormal, planePoint);
      const hit = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(plane.current, hit);
      return hit;
    },
    [camera, gl],
  );

  useEffect(() => {
    const el = gl.domElement;
    if (!active) return;

    const handleDown = (e: PointerEvent) => {
      drawing.current = true;
      el.setPointerCapture(e.pointerId);
      onPoint(screenToWorld(e.clientX, e.clientY));
    };
    const handleMove = (e: PointerEvent) => {
      if (!drawing.current) return;
      onPoint(screenToWorld(e.clientX, e.clientY));
    };
    const handleUp = (e: PointerEvent) => {
      if (!drawing.current) return;
      drawing.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released.
      }
      onCommit();
    };

    el.addEventListener("pointerdown", handleDown);
    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerup", handleUp);
    el.addEventListener("pointercancel", handleUp);

    return () => {
      el.removeEventListener("pointerdown", handleDown);
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerup", handleUp);
      el.removeEventListener("pointercancel", handleUp);
    };
  }, [active, gl, onCommit, onPoint, screenToWorld]);

  return null;
}

/**
 * The reified mesh. Renders a Three.js MarchingCubes at resolution
 * MC_RESOLUTION; the trail&rsquo;s vertices are normalised into the
 * field&rsquo;s ±1 cube and stamped as soft Gaussian blobs via
 * `addBall`. The iso-surface comes out as a chrome-cyan chunky mesh
 * &mdash; the gesture, as object.
 *
 * The camera orbits autonomously during the Encounter stage so the
 * visitor sees the object from every side without having to drag.
 * OrbitControls is mounted on top so they can take over if they
 * want.
 */
function ReifiedMesh({
  points,
  fadeIn,
  orbit,
}: {
  points: THREE.Vector3[];
  /** 0..1, drives mesh opacity over the reify stage. */
  fadeIn: number;
  /** Whether to autoplay the orbit during Encounter. */
  orbit: boolean;
}) {
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#00f3ff"),
      emissive: new THREE.Color("#0a6677"),
      emissiveIntensity: 0.6,
      roughness: 0.35,
      metalness: 0.55,
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  const mc = useMemo(() => {
    const instance = new MarchingCubes(MC_RESOLUTION, material, true, false);
    instance.isolation = MC_ISOLATION;
    instance.enableUvs = false;
    instance.enableColors = false;
    return instance;
  }, [material]);

  // Stamp the trail into the field. We do this once per `points`
  // identity; mesh stays static after.
  useEffect(() => {
    mc.reset();
    if (points.length < 2) return;
    // Find the trail&rsquo;s bounding box and normalise to ±0.8 inside
    // the marching-cubes &plusmn;1 volume, leaving margin for the
    // Gaussian falloff to fit.
    const bb = new THREE.Box3().setFromPoints(points);
    const size = new THREE.Vector3();
    bb.getSize(size);
    const centre = new THREE.Vector3();
    bb.getCenter(centre);
    const maxDim = Math.max(size.x, size.y, size.z, 1e-3);
    const scale = 1.6 / maxDim;
    for (const p of points) {
      const x = (p.x - centre.x) * scale * 0.5 + 0.5;
      const y = (p.y - centre.y) * scale * 0.5 + 0.5;
      const z = (p.z - centre.z) * scale * 0.5 + 0.5;
      // addBall takes 0..1 coordinates; we clamp to keep the stamp
      // inside the field.
      const cx = Math.max(0.05, Math.min(0.95, x));
      const cy = Math.max(0.05, Math.min(0.95, y));
      const cz = Math.max(0.05, Math.min(0.95, z));
      mc.addBall(cx, cy, cz, MC_BALL_STRENGTH, MC_BALL_SUBTRACT);
    }
    mc.update();
  }, [points, mc]);

  useEffect(() => {
    material.opacity = Math.max(0, Math.min(0.95, fadeIn));
  }, [fadeIn, material]);

  // Autonomous orbit during Encounter.
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!orbit) return;
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.35;
  });

  useEffect(() => {
    return () => {
      material.dispose();
      mc.geometry?.dispose();
    };
  }, [material, mc]);

  return (
    <group ref={ref} scale={[1.4, 1.4, 1.4]}>
      <primitive object={mc} />
    </group>
  );
}

function CaptureFrame({ active }: { active: boolean }) {
  // A subtle inner box that frames the captured trail. Reads as
  // "the moment was held."
  if (!active) return null;
  return (
    <mesh>
      <boxGeometry args={[3.6, 2.6, 0.001]} />
      <meshBasicMaterial
        color={"#ffb3d9"}
        wireframe
        transparent
        opacity={0.25}
      />
    </mesh>
  );
}

function StageLabel({ stage }: { stage: Stage }) {
  const labels: Record<Stage, string> = {
    draw: "Draw &middot; the body writes",
    capture: "Captured &middot; the moment is held",
    reify: "Reified &middot; the gesture becomes object",
    encounter: "Encountered &middot; the body meets the object",
    pass: "The loop has closed",
  };
  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 transform">
      <div
        className="chrome-label rounded-sm border border-pink-200/40 bg-warm-black-950/90 px-3 py-1.5 text-[0.6rem] text-pink-200"
        dangerouslySetInnerHTML={{ __html: labels[stage] }}
      />
    </div>
  );
}

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
        // Too few vertices to reify; reset and stay in draw.
        return [];
      }
      setCapturedTrail(current.slice());
      setStage("capture");
      return [];
    });
  }, []);

  // Stage timeline. Capture for ~1s, then reify for ~2s
  // (fade-in), then encounter for ~5s, then pass.
  useEffect(() => {
    if (stage === "capture") {
      const t = window.setTimeout(() => setStage("reify"), 1000);
      return () => window.clearTimeout(t);
    }
    if (stage === "reify") {
      // Fade-in animation.
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
    // TODO: persist `capturedTrail` to Firestore /trails the same way
    // the Perch level will. Currently the trail lives in local state
    // only.
    toast("Trail saved locally", {
      description: "Rookery publish stubbed — the door lands with Solo 7.",
    });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          "holoflow.play.loop.passed",
          "1",
        );
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
        Five stages in one session. Draw a trail; watch it captured,
        reified into a small mesh, and encountered from the other
        side. The body that drew it sees what it left behind.
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

          {/* Lighting for the reified mesh. */}
          <ambientLight intensity={0.4} />
          <pointLight position={[2, 2, 3]} intensity={1.2} color={"#00f3ff"} />
          <pointLight position={[-2, -1, 2]} intensity={0.6} color={"#ffb3d9"} />

          {/* Stage: draw &mdash; live trail accumulates. */}
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

          {/* Stage: capture &mdash; trail frozen, framed. */}
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

          {/* Stage: reify &mdash; marching cubes builds. */}
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

          {/* Stage: encounter &mdash; viewer can drag the camera. */}
          {stage === "encounter" || stage === "pass" ? (
            <OrbitControls enablePan={false} enableZoom={false} />
          ) : null}
        </Canvas>
      </div>

      {stage === "pass" ? (
        <div className="mt-5 rounded-sm border border-pink-200/60 bg-pink-200/[0.06] p-5">
          <div className="chrome-label mb-2 text-pink-200">
            Pass &middot; the loop has closed
          </div>
          <p className="text-sm text-chrome-200">
            The body that drew the trail has met it as an object. This
            is what your gesture left behind. Send it to the Rookery
            or draw another &mdash; the loop is the practice.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={publishToRookery}
              className="chrome-label rounded-sm border border-pink-200/50 bg-pink-200/10 px-3 py-1.5 text-[0.6rem] text-pink-200 hover:bg-pink-200/20"
            >
              Send to the Rookery
            </button>
            <button
              type="button"
              onClick={reset}
              className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
            >
              Draw again
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4">
        <p className="text-xs leading-relaxed text-chrome-400">
          The marching-cubes pass is canonical Three.js
          (`three/examples/jsm/objects/MarchingCubes`), running at
          16&sup3; resolution for the v0.1 reify-step. The Holoflow
          Loop is six positions in canon; this level condenses to
          five because the opening and closing "body in space"
          collapse into one continuous bracket &mdash; the visitor is
          the body the whole way through.
        </p>
        <Link
          href="/the-loop"
          className="chrome-label mt-3 inline-block text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          The full Loop diagram &rarr;
        </Link>
      </div>
    </div>
  );
}
