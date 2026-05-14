"use client";

/**
 * components/three/print-bar-canvas.tsx — Self-contained host for the 3D print-bar.
 *
 * One-line role: wrap `<PrintBar>` in its own R3F `<Canvas>` with lights + a fixed
 * camera so any non-3D page can drop in the commerce strip without composing it
 * into an existing scene.
 *
 * Full purpose in print-bar-canvas.PURPOSE.md.
 */

import { Canvas } from "@react-three/fiber";
import { useState } from "react";

import PrintBar from "./print-bar";

export type PrintBarCanvasProps = {
  geometryId: string;
  /** Hides the toast on order-received when false. Default true. */
  showOrderToast?: boolean;
};

export default function PrintBarCanvas({
  geometryId,
  showOrderToast = true,
}: PrintBarCanvasProps) {
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  return (
    <div className="relative h-[180px] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={0.7} />
        <directionalLight position={[-2, -1, 2]} intensity={0.25} color="#88aaff" />
        <PrintBar
          geometryId={geometryId}
          y={0}
          z={0}
          onOrderReceived={setLastOrderId}
        />
      </Canvas>
      {showOrderToast && lastOrderId && (
        <div className="absolute right-3 top-3 rounded-sm border border-pink-200/60 bg-warm-black-950/90 px-3 py-2 font-mono text-xs text-pink-100">
          order <span className="text-pink-200">{lastOrderId}</span> received
          <div className="text-chrome-400">
            we&rsquo;ll be in touch within one bench-day
          </div>
        </div>
      )}
    </div>
  );
}
