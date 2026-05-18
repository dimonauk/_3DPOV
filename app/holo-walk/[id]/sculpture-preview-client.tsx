"use client";

/**
 * app/holo-walk/[id]/sculpture-preview-client.tsx — Per-sculpture 3D preview.
 *
 * One-line role: render the animated light-sculpture trajectory for a single HoloWalk location in a desktop-spectator R3F Canvas via the shared `<SculptureFigure>`.
 * Full purpose in sculpture-preview-client.PURPOSE.md.
 *
 * No AR yet — this is the standing-still preview. The AR variant at
 * /holo-walk/<id>/ar lands in the next wave with the magic-window
 * stack and reuses the same `<SculptureFigure>` underneath.
 */

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { SculptureFigure } from "components/three/SculptureFigure";
import PrintBar from "components/three/print-bar";
import {
  getAttractorParams,
  type SculptureLocation,
} from "lib/holo-walk/locations";

export default function SculpturePreviewClient({
  location,
}: {
  location: SculptureLocation;
}) {
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  return (
    <div
      className="relative h-full w-full"
      role="img"
      aria-label={`3D preview of the ${location.name} light-sculpture${location.city ? ` in ${location.city}` : ""}. Drag with mouse or touch to orbit; pinch to zoom.`}
    >
      <Canvas camera={{ position: [0, -0.2, 4.4], fov: 45 }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={0.7} />
        <directionalLight position={[-2, -1, 2]} intensity={0.25} color="#88aaff" />
        <OrbitControls enablePan={false} target={[0, 0, 0]} />
        <SculptureFigure location={location} autoRotate />
        <group scale={0.5} position={[0, -1.6, 0]}>
          <PrintBar
            geometryId={`holo-walk-${location.id}`}
            y={0}
            z={0}
            onOrderReceived={setLastOrderId}
          />
        </group>
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-warm-black-800 bg-warm-black-950/80 px-3 py-1 font-mono text-xs text-chrome-100">
        engine:{" "}
        <span className="text-pink-200">
          {getAttractorParams(location.sculpture)?.engine ??
            (location.sculpture.kind === "splat" ? "splat" : "—")}
        </span>
      </div>
      {lastOrderId && (
        <div className="absolute right-3 top-3 rounded-sm border border-pink-200/60 bg-warm-black-950/90 px-3 py-2 font-mono text-xs text-pink-100">
          order <span className="text-pink-200">{lastOrderId}</span> received
          <div className="text-chrome-400">we&rsquo;ll be in touch within one bench-day</div>
        </div>
      )}
    </div>
  );
}
