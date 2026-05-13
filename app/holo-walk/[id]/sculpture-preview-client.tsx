"use client";

/**
 * app/holo-walk/[id]/sculpture-preview-client.tsx — Per-sculpture 3D preview.
 *
 * One-line role: render the animated light-sculpture trajectory for a single HoloWalk location in a desktop-spectator R3F Canvas.
 * Full purpose in sculpture-preview-client.PURPOSE.md.
 *
 * No AR yet — this is the standing-still preview. The AR variant at
 * /holo-walk/<id>/ar lands in the next wave with the magic-window stack.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  type Points as ThreePoints,
} from "three";

import { renderSculptureFrame } from "lib/capabilities/viz/light-sculpture";
import type { SculptureLocation } from "lib/holo-walk/locations";

function AnimatedSculpture({ location }: { location: SculptureLocation }) {
  const pointsRef = useRef<ThreePoints | null>(null);
  const startRef = useRef<number>(performance.now());

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(0), 3),
    );
    g.setAttribute(
      "opacity",
      new BufferAttribute(new Float32Array(0), 1),
    );
    return g;
  }, []);

  useFrame(() => {
    const elapsed = performance.now() - startRef.current;
    const frame = renderSculptureFrame(location, elapsed);
    geometry.setAttribute(
      "position",
      new BufferAttribute(frame.positions, 3),
    );
    geometry.setAttribute(
      "opacity",
      new BufferAttribute(frame.opacities, 1),
    );
    geometry.computeBoundingSphere();
    const bs = geometry.boundingSphere;
    if (bs && bs.radius > 0 && pointsRef.current) {
      const s = 1.4 / bs.radius;
      pointsRef.current.scale.setScalar(s);
      pointsRef.current.position.set(
        -bs.center.x * s,
        -bs.center.y * s,
        -bs.center.z * s,
      );
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.012}
        color="#ff66cc"
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function SculpturePreviewClient({
  location,
}: {
  location: SculptureLocation;
}) {
  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0, 3.4], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <OrbitControls
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
        <AnimatedSculpture location={location} />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-warm-black-800 bg-warm-black-950/80 px-3 py-1 font-mono text-xs text-chrome-100">
        engine: <span className="text-pink-200">{location.sculpture.engine}</span>
      </div>
    </div>
  );
}
