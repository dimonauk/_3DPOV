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

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { SculptureFigure } from "components/three/SculptureFigure";
import type { SculptureLocation } from "lib/holo-walk/locations";

export default function SculpturePreviewClient({
  location,
}: {
  location: SculptureLocation;
}) {
  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0, 3.4], fov: 45 }}>
        <OrbitControls enablePan={false} />
        <SculptureFigure location={location} autoRotate />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-warm-black-800 bg-warm-black-950/80 px-3 py-1 font-mono text-xs text-chrome-100">
        engine: <span className="text-pink-200">{location.sculpture.engine}</span>
      </div>
    </div>
  );
}
