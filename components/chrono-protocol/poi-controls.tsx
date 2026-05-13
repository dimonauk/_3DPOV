"use client";

/**
 * Dual-thumb poi controls for the Chrono-Protocol run scene.
 *
 * v0.1: visible-stub. Two circular UI elements positioned at bottom-
 * left and bottom-right, representing the left and right poi anchors.
 * They render but do not yet drive any input. The Wave 3 implementation
 * wires pointer / touch / gamepad gesture into actual poi-head spring
 * physics (matching the prototype's pendulum + Euler-integration model
 * in Poi.tsx).
 *
 * TODO &mdash; Wave 3 (controls + physics):
 *   - Touch pointer events from each thumb anchor.
 *   - Pendulum physics on a 1.2-unit rope (gravity, spring tension,
 *     air damping; Euler integration with a delta cap).
 *   - Persistence-of-vision trail render attached to each poi head.
 *   - Hand-tracking pass-through when @react-three/xr is installed.
 *   - Gamepad mapping (Quest controllers, generic dual-stick).
 *
 * The component renders pure HTML positioned absolute. It is the input
 * surface, not the render surface; the poi-head trails live inside the
 * R3F canvas as their own component when Wave 3 lands.
 */

export type PoiControlsStubProps = {
  /** Whether the controls are visible. Default true. */
  visible?: boolean;
};

export function PoiControlsStub({ visible = true }: PoiControlsStubProps) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-between px-8">
      <PoiThumb side="left" />
      <PoiThumb side="right" />
    </div>
  );
}

function PoiThumb({ side }: { side: "left" | "right" }) {
  const label = side === "left" ? "L" : "R";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative h-20 w-20 rounded-full border border-chrome-500/40 bg-warm-black-950/60 backdrop-blur-sm"
        aria-label={`${side} poi anchor (stub)`}
      >
        <div className="absolute inset-2 rounded-full border border-chrome-500/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xl text-chrome-300">{label}</span>
        </div>
      </div>
      <span className="chrome-label text-chrome-500">poi {side}</span>
    </div>
  );
}
