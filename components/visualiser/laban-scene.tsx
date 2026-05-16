"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import {
  BASIC_EFFORTS,
  type LabanEffort,
} from "lib/visualiser/laban-math";
import { ChromeLabel, LabelAt } from "./_helpers";

/**
 * LabanScene &mdash; the Space&times;Time&times;Weight cube plus the live
 * effort point and its motion trail. Flow is rendered as a small dial
 * overlay rather than a fourth spatial axis (we can&rsquo;t draw 4D on a
 * screen); it conditions trail persistence.
 *
 * Layout:
 *   X axis = Space    (left:  flexible, right: direct)
 *   Y axis = Time     (down:  sustained, up:    sudden)
 *   Z axis = Weight   (back:  light, front: strong)
 *
 * The eight cube vertices are the named Basic Efforts (Float / Wring /
 * Punch / Dab / Press / Glide / Slash / Flick). Their labels sit beside the
 * vertex spheres.
 */

type Props = {
  effort: LabanEffort;
};

const CUBE_HALF = 1;
const TRAIL_LENGTH = 30;

function cubeWireframeGeometry(): THREE.BufferGeometry {
  // 12 edges &times; 2 vertices = 24 positions.
  // prettier-ignore
  const v: ReadonlyArray<readonly [number, number, number]> = [
    [-1, -1, -1], [ 1, -1, -1],
    [ 1, -1, -1], [ 1, -1,  1],
    [ 1, -1,  1], [-1, -1,  1],
    [-1, -1,  1], [-1, -1, -1],
    [-1,  1, -1], [ 1,  1, -1],
    [ 1,  1, -1], [ 1,  1,  1],
    [ 1,  1,  1], [-1,  1,  1],
    [-1,  1,  1], [-1,  1, -1],
    [-1, -1, -1], [-1,  1, -1],
    [ 1, -1, -1], [ 1,  1, -1],
    [ 1, -1,  1], [ 1,  1,  1],
    [-1, -1,  1], [-1,  1,  1],
  ];
  const positions = new Float32Array(v.length * 3);
  for (let i = 0; i < v.length; i++) {
    const p = v[i] ?? [0, 0, 0];
    positions[i * 3] = p[0];
    positions[i * 3 + 1] = p[1];
    positions[i * 3 + 2] = p[2];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

function axisLabelOffset(corner: readonly [number, number, number]): [
  number,
  number,
  number,
] {
  // Push the label slightly outside the cube along the corner&rsquo;s
  // normal so the text never sits behind the cube wireframe.
  const out = 0.18;
  return [corner[0] * (1 + out), corner[1] * (1 + out), corner[2] * (1 + out)];
}

function effortPointPosition(e: LabanEffort): [number, number, number] {
  return [e.space, e.time, e.weight];
}

function Trail({ effort }: Props) {
  // Trail length is conditioned by flow: bound (+1) keeps a short trail;
  // free (-1) keeps the full TRAIL_LENGTH. The number of rendered samples
  // is what we vary; the sample buffer itself stays a fixed-size ring.
  const positionsRef = useRef<Float32Array>(
    new Float32Array(TRAIL_LENGTH * 3),
  );
  const writeIndexRef = useRef(0);
  const filledRef = useRef(0);
  // Initialise the geometry + position attribute synchronously on first
  // render. A useEffect-based setup races useFrame on the very first
  // frame — the frame loop fires before effects run, so `attributes.position`
  // is undefined when the body tries to set `needsUpdate`, throwing
  // "Cannot set properties of undefined (setting 'needsUpdate')".
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  if (!geometryRef.current) {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(positionsRef.current, 3),
    );
    g.setDrawRange(0, 0);
    geometryRef.current = g;
  }
  const drawCountRef = useRef(0);

  // Track effort changes; push the new sample into the ring on every render
  // that the effort actually changed. We avoid `useFrame` for sampling so
  // the trail is gesture-paced, not framerate-paced.
  const lastSampleRef = useRef<[number, number, number] | null>(null);
  const sample = effortPointPosition(effort);
  const last = lastSampleRef.current;
  const moved =
    !last ||
    Math.abs(last[0] - sample[0]) > 1e-4 ||
    Math.abs(last[1] - sample[1]) > 1e-4 ||
    Math.abs(last[2] - sample[2]) > 1e-4;
  if (moved) {
    const idx = writeIndexRef.current;
    const buf = positionsRef.current;
    buf[idx * 3] = sample[0];
    buf[idx * 3 + 1] = sample[1];
    buf[idx * 3 + 2] = sample[2];
    writeIndexRef.current = (idx + 1) % TRAIL_LENGTH;
    filledRef.current = Math.min(TRAIL_LENGTH, filledRef.current + 1);
    lastSampleRef.current = sample;
  }

  // Each frame: rebuild a linear non-ring positions slice (oldest -> newest)
  // and update the geometry&rsquo;s draw range based on flow.
  useFrame(() => {
    const filled = filledRef.current;
    const buf = positionsRef.current;
    if (filled < 2) {
      geometryRef.current.setDrawRange(0, 0);
      drawCountRef.current = 0;
      geometryRef.current.attributes.position!.needsUpdate = true;
      return;
    }

    // flow: -1 (free) -> 1 (bound). bound shortens the trail.
    const t = (effort.flow + 1) * 0.5; // 0 (free) -> 1 (bound)
    const visibleCount = Math.max(
      2,
      Math.floor(TRAIL_LENGTH - t * (TRAIL_LENGTH - 4)),
    );

    // Build a temporary linear sequence in a separate buffer so the draw
    // call can be a line-strip equivalent via lineSegments-pair stride.
    const seq = new Float32Array(visibleCount * 3);
    const start = (writeIndexRef.current - filled + TRAIL_LENGTH) % TRAIL_LENGTH;
    const offset = filled - visibleCount;
    for (let i = 0; i < visibleCount; i++) {
      const ringIdx = (start + offset + i) % TRAIL_LENGTH;
      seq[i * 3] = buf[ringIdx * 3] ?? 0;
      seq[i * 3 + 1] = buf[ringIdx * 3 + 1] ?? 0;
      seq[i * 3 + 2] = buf[ringIdx * 3 + 2] ?? 0;
    }

    // Pair consecutive samples into a flat lineSegments buffer.
    const segCount = visibleCount - 1;
    const segBuf = new Float32Array(segCount * 6);
    for (let i = 0; i < segCount; i++) {
      segBuf[i * 6] = seq[i * 3] ?? 0;
      segBuf[i * 6 + 1] = seq[i * 3 + 1] ?? 0;
      segBuf[i * 6 + 2] = seq[i * 3 + 2] ?? 0;
      segBuf[i * 6 + 3] = seq[(i + 1) * 3] ?? 0;
      segBuf[i * 6 + 4] = seq[(i + 1) * 3 + 1] ?? 0;
      segBuf[i * 6 + 5] = seq[(i + 1) * 3 + 2] ?? 0;
    }

    geometryRef.current.setAttribute(
      "position",
      new THREE.BufferAttribute(segBuf, 3),
    );
    geometryRef.current.setDrawRange(0, segCount * 2);
    drawCountRef.current = segCount * 2;
    geometryRef.current.attributes.position!.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geometryRef.current}>
      <lineBasicMaterial
        color="#fbcfe8"
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </lineSegments>
  );
}

function FlowDial({ flow }: { flow: number }) {
  // Render a small ring + a needle in the top-right of the canvas using an
  // HTML overlay. Lives inside the Canvas so it sits in the same DOM as the
  // rest of the labels.
  return (
    <ChromeLabel position={[CUBE_HALF + 0.6, CUBE_HALF + 0.4, 0]}>
      flow {flow >= 0 ? "+" : ""}
      {flow.toFixed(2)} &middot; {flow > 0.1 ? "bound" : flow < -0.1 ? "free" : "neutral"}
    </ChromeLabel>
  );
}

function Stage({ effort }: Props) {
  const cubeGeom = useMemo(() => cubeWireframeGeometry(), []);
  const pointPos = effortPointPosition(effort);

  return (
    <group>
      {/* Cube wireframe. */}
      <lineSegments geometry={cubeGeom}>
        <lineBasicMaterial color="#00f3ff" transparent opacity={0.35} />
      </lineSegments>

      {/* Cube faces &mdash; very faint for orientation. */}
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial
          color="#00f3ff"
          transparent
          opacity={0.025}
          depthWrite={false}
        />
      </mesh>

      {/* The eight Basic-Effort corner spheres + labels. */}
      {BASIC_EFFORTS.map((be) => (
        <group key={be.name}>
          <mesh position={[be.vertex[0], be.vertex[1], be.vertex[2]]}>
            <sphereGeometry args={[0.07, 18, 12]} />
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.8} />
          </mesh>
          <LabelAt position={axisLabelOffset(be.vertex)}>
            {be.name}
          </LabelAt>
        </group>
      ))}

      {/* Axis tick labels &mdash; one pair per axis. */}
      <ChromeLabel position={[-1.35, -1.15, -1]}>
        space &mdash; flexible
      </ChromeLabel>
      <ChromeLabel position={[1.4, -1.15, -1]}>
        space &mdash; direct
      </ChromeLabel>
      <ChromeLabel position={[1.15, 1.4, -1]}>
        time &mdash; sudden
      </ChromeLabel>
      <ChromeLabel position={[1.15, -1.4, -1]}>
        time &mdash; sustained
      </ChromeLabel>
      <ChromeLabel position={[1.15, -1.15, 1.4]}>
        weight &mdash; strong
      </ChromeLabel>
      <ChromeLabel position={[1.15, -1.15, -1.4]}>
        weight &mdash; light
      </ChromeLabel>

      {/* Trail. */}
      <Trail effort={effort} />

      {/* Live effort point &mdash; a slightly bigger pink sphere. */}
      <mesh position={pointPos}>
        <sphereGeometry args={[0.1, 28, 18]} />
        <meshStandardMaterial
          color="#fbcfe8"
          emissive="#fbcfe8"
          emissiveIntensity={0.6}
          metalness={0.1}
          roughness={0.5}
        />
      </mesh>

      {/* Flow dial label. */}
      <FlowDial flow={effort.flow} />
    </group>
  );
}

export default function LabanScene({ effort }: Props) {
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800"
      style={{ backgroundColor: "#0c0a12" }}
    >
      <Canvas
        camera={{ position: [3.2, 2.4, 3.4], fov: 50 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[4, 4, 3]} intensity={0.7} />
        <Stage effort={effort} />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.6}
          maxDistance={9}
          autoRotate={false}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-chrome-500">
        Drag to rotate &middot; scroll to zoom
      </div>
    </div>
  );
}
