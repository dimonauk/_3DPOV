"use client";

/**
 * components/three/SculptureFigure.tsx — Shared 3D component for HoloWalk light sculptures.
 *
 * One-line role: render a `SculptureLocation`'s attractor trajectory as a glowing drei `<Trail>` with optional selective Bloom, reused by the preview view and the AR view.
 * Full purpose in SculptureFigure.PURPOSE.md.
 *
 * Aesthetic upgrade over the original points-cloud renderer: a
 * single head cursor walks the attractor trajectory on a continuous
 * loop while drei's `<Trail>` lays a long fading line behind it,
 * with `@react-three/postprocessing` `<Bloom>` lifting the trail's
 * `#ff66cc` head into a hot bloom that reads as long-exposure light
 * even on chrome-on-midnight backgrounds.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Group } from "three";

import { generateAttractor } from "lib/capabilities/viz/attractor";
import type { SculptureLocation } from "lib/holo-walk/locations";

import {
  cycleIndex,
  fitToRadius,
  readPoint,
  DEFAULT_CYCLE_MS,
  DEFAULT_TARGET_RADIUS,
} from "lib/visualiser/sculpture-figure-math";

/** Default point-count for the trajectory when the location omits a hint. */
const DEFAULT_POINT_COUNT = 50_000;

/** Trail head colour — bright magenta, matches the original preview. */
const TRAIL_COLOUR = "#ff66cc";

/** Trail width in scene units. Tuned to read as a fat brush stroke without overpowering bloom. */
const TRAIL_WIDTH = 2;

/**
 * Trail length — number of internal samples * 10. 300 gives ~3000
 * points of tail, enough for a long fading sweep across the
 * trajectory at 60fps without buffering more than ~5 seconds of
 * head-cursor history (which keeps memory flat on long sessions).
 */
const TRAIL_LENGTH = 300;

/** Slow Y rotation in radians per second when `autoRotate` is on. */
const AUTO_ROTATE_RAD_PER_SEC = 0.4;

/** Linear width-falloff curve — head full width, tail tapers to zero. */
function trailAttenuation(width: number): number {
  return width;
}

export type SculptureFigureProps = {
  location: SculptureLocation;
  /** Position offset in scene units. Defaults to origin (preview mode). AR mode passes the ENU-offset target position. */
  position?: readonly [number, number, number];
  /** Scale multiplier. Default 1.0. Preview mode uses 1.0; AR mode uses a tuned ratio. */
  scale?: number;
  /** Whether to auto-rotate the sculpture around its Y axis. Preview = true; AR = false (world-locked). */
  autoRotate?: boolean;
  /** Whether to enable selective bloom on the sculpture. Default true. */
  bloom?: boolean;
};

/** Inner walker: rotates + drives the head cursor along the trajectory. */
function SculptureWalker({
  trajectory,
  fitScale,
  fitCentre,
  autoRotate,
}: {
  trajectory: Float32Array;
  fitScale: number;
  fitCentre: readonly [number, number, number];
  autoRotate: boolean;
}) {
  const rotatorRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const startRef = useRef<number>(0);

  // Bind the start time on mount so re-renders don't reset the cycle.
  useEffect(() => {
    startRef.current = performance.now();
  }, []);

  const count = useMemo(() => Math.floor(trajectory.length / 3), [trajectory]);

  useFrame((_, delta) => {
    const elapsed = performance.now() - startRef.current;

    // Walk the head cursor: pick the trajectory index, translate the
    // head cursor to the fitted, centre-corrected coordinate.
    if (headRef.current && count > 0) {
      const idx = cycleIndex(elapsed, count, DEFAULT_CYCLE_MS);
      const [px, py, pz] = readPoint(trajectory, idx);
      headRef.current.position.set(
        (px - fitCentre[0]) * fitScale,
        (py - fitCentre[1]) * fitScale,
        (pz - fitCentre[2]) * fitScale,
      );
    }

    // Auto-rotate the wrapping group rather than the trail — keeps
    // the world-space tail intact while the figure spins for the
    // preview viewer.
    if (autoRotate && rotatorRef.current) {
      rotatorRef.current.rotation.y += AUTO_ROTATE_RAD_PER_SEC * delta;
    }
  });

  return (
    <group ref={rotatorRef}>
      <Trail
        width={TRAIL_WIDTH}
        length={TRAIL_LENGTH}
        color={TRAIL_COLOUR}
        attenuation={trailAttenuation}
        decay={1}
        local={false}
        stride={0}
        interval={1}
      >
        <group ref={headRef}>
          <mesh>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color={TRAIL_COLOUR} toneMapped={false} />
          </mesh>
        </group>
      </Trail>
    </group>
  );
}

/**
 * `<SculptureFigure>` — the shared light-sculpture renderer.
 *
 * Mount inside an R3F `<Canvas>`. Returns the scene contents (an
 * `<EffectComposer>` for Bloom plus a positioned `<group>` housing
 * the head cursor + drei `<Trail>`) — the caller's canvas wraps
 * both. Selective bloom on the head's `meshBasicMaterial` with
 * `toneMapped={false}` keeps the chrome-on-midnight palette intact
 * while the trail itself glows.
 */
export function SculptureFigure({
  location,
  position = [0, 0, 0],
  scale = 1,
  autoRotate = true,
  bloom = true,
}: SculptureFigureProps): React.JSX.Element {
  // Generate the trajectory + bounding-sphere fit once per location.
  // Re-keying on the location's id keeps the buffer steady even if
  // the parent re-renders.
  const { trajectory, fitScale, fitCentre } = useMemo(() => {
    const count = location.sculpture.particleCount ?? DEFAULT_POINT_COUNT;
    const result = generateAttractor(location.sculpture.engine, { count });
    const fit = fitToRadius(result.positions, DEFAULT_TARGET_RADIUS);
    return {
      trajectory: result.positions,
      fitScale: fit.scale,
      fitCentre: fit.center,
    };
  }, [location.id, location.sculpture.engine, location.sculpture.particleCount]);

  return (
    <>
      {bloom ? (
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      ) : null}
      <ambientLight intensity={0.4} />
      <group position={position as unknown as [number, number, number]} scale={scale}>
        <SculptureWalker
          trajectory={trajectory}
          fitScale={fitScale}
          fitCentre={fitCentre}
          autoRotate={autoRotate}
        />
      </group>
    </>
  );
}
