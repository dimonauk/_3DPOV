"use client";

/**
 * Shared primitives for the /visualiser/* family.
 *
 * Kept deliberately small: label primitives that sit inside an R3F canvas
 * via Drei&rsquo;s &lt;Html&gt;, and a disposal hook used by every scene
 * that allocates three.js resources outside of automatic-disposal paths.
 * Anything used by 2+ visualisers lives here so the per-scene files stay
 * focused on the physics being visualised.
 *
 * IMPORTANT: this file is the line-segments-not-line rule made permanent.
 * Every line geometry in the visualiser family must use &lt;lineSegments&gt;
 * (or a lib helper) to avoid the SVG-JSX vs R3F-JSX namespace collision
 * that bit the TIR build twice before being locked down.
 */

import { Html } from "@react-three/drei";
import { useEffect } from "react";

/** Small chrome-cyan or pink-200 label floating at a 3D position. */
export function LabelAt({
  position,
  color = "#00f3ff",
  children,
}: {
  position: [number, number, number];
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "10px",
          color,
          background: "rgba(12, 10, 18, 0.85)",
          padding: "2px 6px",
          borderRadius: "2px",
          whiteSpace: "nowrap",
          letterSpacing: "0.06em",
        }}
      >
        {children}
      </div>
    </Html>
  );
}

/** Uppercase-tracked medium / corner label. Heavier weight than LabelAt. */
export function ChromeLabel({
  position,
  children,
}: {
  position: [number, number, number];
  children: React.ReactNode;
}) {
  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "10px",
          color: "#9ca3af",
          background: "rgba(12, 10, 18, 0.6)",
          padding: "3px 7px",
          borderRadius: "2px",
          whiteSpace: "nowrap",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </div>
    </Html>
  );
}

/**
 * Dispose a three.js resource (geometry / material / texture / RTT)
 * when the component unmounts AND when the resource reference changes.
 *
 * Without this, every visualiser scene leaks GPU memory as it reruns
 * useMemo across prop changes (preset, generation, resolution swap)
 * because three.js resources aren't garbage-collected by JS — their
 * GPU-side state needs an explicit `.dispose()` call to release.
 *
 * # Usage
 *
 *     const geom = useMemo(() => new THREE.BufferGeometry(), [deps]);
 *     useDispose(geom);
 *
 *     // For ref-held resources allocated in the component body:
 *     const ref = useRef<THREE.BufferGeometry | null>(null);
 *     if (!ref.current) ref.current = new THREE.BufferGeometry();
 *     useDispose(ref.current);
 *
 * # Why useEffect + identity dep, not a single mount/unmount effect
 *
 * The dep array `[thing]` means: when the caller hands us a new
 * reference, the previous effect's cleanup fires (disposing the old
 * thing) BEFORE the new effect captures the new thing. On unmount,
 * the final cleanup disposes the last value. This handles both the
 * "stable resource for the lifetime of the component" case AND the
 * "useMemo recreates on dep change" case with one API.
 */
export function useDispose(thing: { dispose: () => void } | null | undefined): void {
  useEffect(() => {
    return () => {
      thing?.dispose();
    };
  }, [thing]);
}
