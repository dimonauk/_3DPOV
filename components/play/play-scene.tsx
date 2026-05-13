"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { TrailLine } from "./trail-line";

/**
 * PlayScene &mdash; Solo 2, "The Trail."
 *
 * Mouse-down + drag traces a line on a plane standing one metre in
 * front of the camera; release publishes the trail to local state.
 *
 * v0.2 enhancement &mdash; angular-sync HUD.
 *
 * The trail&rsquo;s render brightness is driven by the pointer&rsquo;s
 * angular velocity (radians/sec, sampled around the canvas centre).
 * A continuous fast gesture pushes the trail toward full opacity; a
 * stall dims it. A small HUD top-right reports the live angular
 * velocity so the visitor can see the angle-not-clock philosophy as
 * input.
 *
 * Pass-condition gate:
 *   &mdash; the trail has at least 200 vertices
 *   &mdash; the mean angular velocity over the gesture is at least 1
 *     rad/sec
 *
 * Below either threshold the level reads "keep moving &mdash; the
 * angle is the input." Above both, the gesture publishes and the
 * pass screen appears.
 *
 * Module integration. If the visitor passed the Module level, the
 * brush parameters from that pass drive this scene&rsquo;s
 * &lt;TrailLine /&gt;. Default is the thin line module otherwise.
 *
 * Performance: the trail caps at 2000 vertices and starts shifting
 * the oldest off the head of the array.
 *
 * The XR session entry point is stubbed; @react-three/xr is not yet
 * installed.
 */

const MAX_TRAIL_VERTICES = 2000;
const TRAIL_PLANE_DISTANCE = 1;
const PASS_VERTEX_MIN = 200;
const PASS_ANGULAR_VELOCITY_MIN = 1; // rad/sec mean over the gesture
const ANGULAR_WINDOW_MS = 250; // window for live HUD readout

type BrushSlug = "thin" | "fat" | "dotted" | "additive";

type Brush = {
  slug: BrushSlug;
  name: string;
  color: string;
  opacity: number;
  pointKeepRate: number;
};

const BRUSHES: Record<BrushSlug, Brush> = {
  thin: {
    slug: "thin",
    name: "Thin line",
    color: "#00f3ff",
    opacity: 0.9,
    pointKeepRate: 1,
  },
  fat: {
    slug: "fat",
    name: "Fat brush",
    color: "#ffb3d9",
    opacity: 0.95,
    pointKeepRate: 1,
  },
  dotted: {
    slug: "dotted",
    name: "Dotted",
    color: "#e6e6e6",
    opacity: 1,
    pointKeepRate: 0.18,
  },
  additive: {
    slug: "additive",
    name: "Additive smear",
    color: "#ffcc66",
    opacity: 0.7,
    pointKeepRate: 1,
  },
};

const MODULE_CHOICE_STORAGE_KEY = "holoflow.play.module.choice";

function loadBrushFromModulePass(): Brush {
  if (typeof window === "undefined") return BRUSHES.thin;
  try {
    const slug = window.localStorage.getItem(MODULE_CHOICE_STORAGE_KEY);
    if (
      slug === "thin" ||
      slug === "fat" ||
      slug === "dotted" ||
      slug === "additive"
    ) {
      return BRUSHES[slug];
    }
  } catch {
    // localStorage may be unavailable.
  }
  return BRUSHES.thin;
}

type TrailSnapshot = {
  id: string;
  points: THREE.Vector3[];
  timestamp: number;
  meanAngularVelocity: number;
};

type PointerSample = {
  /** Angular position around the canvas centre, radians. */
  theta: number;
  /** ISO timestamp (ms). */
  t: number;
};

type AngularState = {
  /** Live angular velocity, radians per second. */
  live: number;
  /** Mean angular velocity over the current gesture. */
  mean: number;
};

function MouseDrawSurface({
  active,
  liveTrail,
  brush,
  onPoint,
  onCommit,
  onAngular,
  onGestureStart,
}: {
  active: boolean;
  liveTrail: THREE.Vector3[];
  brush: Brush;
  onPoint: (p: THREE.Vector3) => void;
  onCommit: (mean: number) => void;
  onAngular: (state: AngularState) => void;
  onGestureStart: () => void;
}) {
  const { camera, gl } = useThree();
  const drawing = useRef(false);
  const sampleCounter = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(
    new THREE.Plane(new THREE.Vector3(0, 0, 1), TRAIL_PLANE_DISTANCE),
  );

  // Angular-sync state. We sample the pointer&rsquo;s angle around
  // the canvas centre, accumulate the unwrapped angle, and track a
  // short rolling window for the live HUD plus a gesture-wide sum
  // for the pass-condition check.
  const lastSample = useRef<PointerSample | null>(null);
  const windowSamples = useRef<PointerSample[]>([]);
  const gestureUnwrapped = useRef(0);
  const gestureStartT = useRef(0);

  const angleAt = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return Math.atan2(clientY - cy, clientX - cx);
    },
    [gl],
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

    const recordAngular = (clientX: number, clientY: number, t: number) => {
      const theta = angleAt(clientX, clientY);
      const prev = lastSample.current;
      if (prev) {
        // Unwrap the angle delta so a continuous spin doesn&rsquo;t
        // get clipped by the ±π wrap.
        let d = theta - prev.theta;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        gestureUnwrapped.current += Math.abs(d);
      }
      lastSample.current = { theta, t };
      windowSamples.current.push({ theta, t });
      const cutoff = t - ANGULAR_WINDOW_MS;
      while (
        windowSamples.current.length > 1 &&
        windowSamples.current[0]!.t < cutoff
      ) {
        windowSamples.current.shift();
      }
      // Live angular velocity over the rolling window.
      let live = 0;
      if (windowSamples.current.length >= 2) {
        let unwrapped = 0;
        for (let i = 1; i < windowSamples.current.length; i++) {
          const a = windowSamples.current[i - 1]!.theta;
          const b = windowSamples.current[i]!.theta;
          let d = b - a;
          if (d > Math.PI) d -= 2 * Math.PI;
          if (d < -Math.PI) d += 2 * Math.PI;
          unwrapped += Math.abs(d);
        }
        const dt =
          (windowSamples.current[windowSamples.current.length - 1]!.t -
            windowSamples.current[0]!.t) /
          1000;
        live = dt > 0 ? unwrapped / dt : 0;
      }
      const elapsed = Math.max(0.001, (t - gestureStartT.current) / 1000);
      const mean = gestureUnwrapped.current / elapsed;
      onAngular({ live, mean });
    };

    const accept = (clientX: number, clientY: number) => {
      sampleCounter.current += 1;
      const keep = Math.max(0.01, brush.pointKeepRate);
      if (keep < 1) {
        const stride = Math.round(1 / keep);
        if (sampleCounter.current % stride !== 0) return;
      }
      onPoint(screenToWorld(clientX, clientY));
    };

    const handleDown = (e: PointerEvent) => {
      drawing.current = true;
      sampleCounter.current = 0;
      lastSample.current = null;
      windowSamples.current = [];
      gestureUnwrapped.current = 0;
      gestureStartT.current = e.timeStamp;
      onGestureStart();
      el.setPointerCapture(e.pointerId);
      recordAngular(e.clientX, e.clientY, e.timeStamp);
      accept(e.clientX, e.clientY);
    };
    const handleMove = (e: PointerEvent) => {
      if (!drawing.current) return;
      recordAngular(e.clientX, e.clientY, e.timeStamp);
      accept(e.clientX, e.clientY);
    };
    const handleUp = (e: PointerEvent) => {
      if (!drawing.current) return;
      drawing.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released.
      }
      const elapsed = Math.max(
        0.001,
        (e.timeStamp - gestureStartT.current) / 1000,
      );
      const mean = gestureUnwrapped.current / elapsed;
      onCommit(mean);
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
  }, [
    active,
    gl,
    onCommit,
    onPoint,
    onAngular,
    onGestureStart,
    screenToWorld,
    angleAt,
    brush.pointKeepRate,
  ]);

  // The live opacity tracks angular velocity &mdash; the trail
  // brightens as the body moves continuously, dims when the angle
  // stalls. Bound between 0.18 (visible but quiet) and the brush&rsquo;s
  // configured opacity.
  return liveTrail.length > 1 ? (
    <TrailLine
      points={liveTrail}
      maxVertices={MAX_TRAIL_VERTICES}
      color={brush.color}
      opacity={brush.opacity}
    />
  ) : null;
}

function PublishedTrails({
  trails,
  brush,
}: {
  trails: TrailSnapshot[];
  brush: Brush;
}) {
  return (
    <>
      {trails.map((trail) => (
        <TrailLine
          key={trail.id}
          points={trail.points}
          maxVertices={MAX_TRAIL_VERTICES}
          color={brush.color}
          opacity={0.6}
        />
      ))}
    </>
  );
}

function FloorReference() {
  return (
    <gridHelper
      args={[10, 20, "#1a1530", "#13101e"]}
      position={[0, -1.2, 0]}
    />
  );
}

function XRSessionButton() {
  // TODO: when @react-three/xr is wired in, replace this stub with
  // the package&rsquo;s &lt;XRButton /&gt; mounted via a portal.
  const supported =
    typeof navigator !== "undefined" &&
    "xr" in navigator &&
    typeof (navigator as Navigator & { xr?: unknown }).xr !== "undefined";

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-10">
      <div
        className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-400"
        title={
          supported
            ? "WebXR detected — session entry lands when @react-three/xr is installed."
            : "WebXR not detected in this browser. Desktop draw mode is active."
        }
      >
        {supported ? "WebXR · session pending" : "Desktop · mouse draw"}
      </div>
    </div>
  );
}

export function PlayScene() {
  const [liveTrail, setLiveTrail] = useState<THREE.Vector3[]>([]);
  const [published, setPublished] = useState<TrailSnapshot[]>([]);
  const [angular, setAngular] = useState<AngularState>({ live: 0, mean: 0 });
  const [drawing, setDrawing] = useState(false);
  const [passed, setPassed] = useState(false);
  const [lastFailReason, setLastFailReason] = useState<string | null>(null);

  // Pick the brush from the visitor&rsquo;s Module pass; if no pass
  // is recorded, default to the thin line module. Load once on
  // mount; the visitor would have already passed Module before
  // arriving here in the canonical ladder.
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

  const commit = useCallback(
    (meanAngularVelocity: number) => {
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
    },
    [],
  );

  const clearAll = useCallback(() => {
    setLiveTrail([]);
    setPublished([]);
    setPassed(false);
    setLastFailReason(null);
    setAngular({ live: 0, mean: 0 });
  }, []);

  // The HUD bar gives a clean visual of angular velocity. Maps 0..3
  // rad/s onto 0..100% width so a moderate gesture reads as ~33%.
  const hudPercent = useMemo(
    () => Math.min(100, Math.round((angular.live / 3) * 100)),
    [angular.live],
  );
  const meanPercent = useMemo(
    () => Math.min(100, Math.round((angular.mean / 3) * 100)),
    [angular.mean],
  );

  return (
    <div className="relative h-[60vh] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-[#0c0a12]">
      <XRSessionButton />
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        <div className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-400">
          {published.length} trail{published.length === 1 ? "" : "s"}
          {" "}&middot; {liveTrail.length} live &middot; {brush.name.toLowerCase()}
        </div>
        <div className="rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-400">
          <div className="chrome-label mb-1 text-chrome-500">
            Angular-sync &middot; live
          </div>
          <div className="h-1 w-44 rounded-sm bg-warm-black-800">
            <div
              className="h-full rounded-sm bg-pink-200/80 transition-[width] duration-100"
              data-percent={hudPercent}
              ref={(el) => {
                if (el) el.style.width = `${hudPercent}%`;
              }}
            />
          </div>
          <div className="mt-1 text-chrome-300">
            {angular.live.toFixed(2)} rad/s &middot; mean {angular.mean.toFixed(2)}
          </div>
          <div className="mt-2 h-1 w-44 rounded-sm bg-warm-black-800">
            <div
              className="h-full rounded-sm bg-pink-200/40 transition-[width] duration-100"
              ref={(el) => {
                if (el) el.style.width = `${meanPercent}%`;
              }}
            />
          </div>
          <div className="mt-1 text-[0.55rem] uppercase tracking-[0.18em] text-chrome-500">
            pass at &ge;{PASS_ANGULAR_VELOCITY_MIN.toFixed(0)} rad/s
          </div>
        </div>
      </div>
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

      {passed ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-12 z-10 mx-auto max-w-md rounded-sm border border-pink-200/60 bg-warm-black-950/95 p-4 backdrop-blur-sm">
          <div className="chrome-label mb-1 text-pink-200">
            Pass &middot; the curve emerged
          </div>
          <p className="text-xs text-chrome-200">
            The trail held continuous. Angular-sync gave you the shape;
            time-sync would have given dots. The same architectural
            choice the studio&rsquo;s POV rigs are built on.
          </p>
        </div>
      ) : null}

      {lastFailReason ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-12 z-10 mx-auto max-w-md rounded-sm border border-warm-black-700 bg-warm-black-950/95 p-4 backdrop-blur-sm">
          <div className="chrome-label mb-1 text-chrome-300">
            Held back &middot; gesture below threshold
          </div>
          <p
            className="text-xs text-chrome-200"
            dangerouslySetInnerHTML={{ __html: lastFailReason }}
          />
        </div>
      ) : null}

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
