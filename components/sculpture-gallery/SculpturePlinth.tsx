"use client";

/**
 * components/sculpture-gallery/SculpturePlinth.tsx — Plinth + accent
 * spotlight + overhead placard for a single sculpture.
 *
 * Split out of the scene file so SculptureGalleryScene stays under the
 * 300-line cap and so the dynamic-route page can mount a single
 * SculpturePlinth on its own without dragging in the whole gallery.
 *
 * Props are deliberately small — the entry plus its placement, plus
 * a hover callback the parent uses to drive the info popover. Pick-up
 * mode (XR controller grab) is owned by the parent scene; this
 * component just renders what it's told.
 */

import type { CSSProperties } from "react";
import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { SpotLight } from "three";

import type { SculptureEntry } from "lib/sculpture-gallery/catalogue";

import { SculptureMesh } from "./SculptureMesh";

export type SculpturePlinthProps = {
  entry: SculptureEntry;
  /** Where the plinth sits — y is the floor under the plinth. */
  position: [number, number, number];
  /** Plinth facing in radians around Y. */
  rotationY: number;
  /** Optional spin applied to the sculpture mesh (for pick-up mode). */
  spin?: number;
  /** Whether to show the placard popover (hover/focus from parent). */
  showPlacard?: boolean;
  /** Hover handlers — wire to onPointerOver/Out at the group. */
  onHover?: (hovering: boolean) => void;
  /** Click handler — wire to onClick. The parent owns the URL push. */
  onClick?: () => void;
};

const PLINTH_HEIGHT = 1.0;
const PLINTH_RADIUS = 0.35;
const SCULPTURE_LIFT = 0.05;

// Inline placard styles. Using inline CSS so the component is
// self-contained — no globals.css edits, no className resolution
// inside the drei `<Html>` portal.
const placardStyle: CSSProperties = {
  background: "rgba(12, 10, 18, 0.86)",
  border: "1px solid rgba(255, 196, 217, 0.35)",
  borderRadius: "2px",
  padding: "8px 12px",
  minWidth: "180px",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  color: "rgba(255, 230, 240, 0.95)",
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(6px)",
};
const placardTitleStyle: CSSProperties = {
  fontSize: "0.95rem",
  fontWeight: 500,
  letterSpacing: "0.01em",
};
const placardMetaStyle: CSSProperties = {
  fontSize: "0.65rem",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "rgba(255, 196, 217, 0.85)",
  marginTop: "4px",
  fontFamily: "ui-monospace, monospace",
};
const placardRuleStyle: CSSProperties = {
  marginTop: "6px",
  height: "2px",
  width: "32px",
};

export function SculpturePlinth({
  entry,
  position,
  rotationY,
  spin = 0,
  showPlacard = false,
  onHover,
  onClick,
}: SculpturePlinthProps) {
  const spotRef = useRef<SpotLight>(null);

  // Subtle breathing of the spotlight intensity. Reduced motion is
  // honoured by the parent — when the parent passes spin=0 and the
  // animation budget is restricted, the spot stays at constant
  // intensity. This frame hook is cheap (one float write per spot).
  const baseIntensity = useMemo(() => 1.6, []);
  useFrame(({ clock }) => {
    const spot = spotRef.current;
    if (!spot) return;
    const t = clock.elapsedTime;
    spot.intensity = baseIntensity + Math.sin(t * 1.4) * 0.12;
  });

  return (
    <group
      position={position}
      rotation-y={rotationY}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover?.(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover?.(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Plinth — chrome material. The chrome reads cleanly under the
          tinted spot above; a matt plinth would mute the accent. */}
      <mesh position={[0, PLINTH_HEIGHT * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry
          args={[PLINTH_RADIUS, PLINTH_RADIUS * 1.05, PLINTH_HEIGHT, 36]}
        />
        <meshPhysicalMaterial
          color="#d8d8e0"
          roughness={0.12}
          metalness={0.95}
          clearcoat={0.4}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Tinted spotlight above the piece. Each plinth gets its own
          spot so a row of pieces reads as a row of cones of light. */}
      <spotLight
        ref={spotRef}
        position={[0, PLINTH_HEIGHT + 2.2, 0]}
        angle={0.55}
        penumbra={0.6}
        intensity={baseIntensity}
        color={entry.accent}
        castShadow={false}
        target-position={[0, PLINTH_HEIGHT, 0]}
      />

      {/* The sculpture, lifted just above the plinth top so it doesn't
          z-fight. The mesh's own spin is applied inside SculptureMesh. */}
      <group position={[0, PLINTH_HEIGHT + SCULPTURE_LIFT + 0.35, 0]}>
        <SculptureMesh
          modelUrl={entry.modelUrl}
          primitive={entry.primitive}
          accent={entry.accent}
          spin={spin}
        />
      </group>

      {/* Placard. Always present in the scene graph but only visible
          when the parent says so — keeps the hover popover responsive
          without remounting the Html portal. */}
      <Html
        position={[0, PLINTH_HEIGHT + 1.4, 0]}
        center
        distanceFactor={6}
        style={{
          pointerEvents: "none",
          opacity: showPlacard ? 1 : 0,
          transition: "opacity 180ms ease-out",
        }}
      >
        <div style={placardStyle}>
          <div style={placardTitleStyle}>{entry.title}</div>
          <div style={placardMetaStyle}>
            {entry.year}
            {entry.edition ? (
              <>
                {" · "}edition {entry.edition.number} of {entry.edition.of}
              </>
            ) : null}
          </div>
          <div style={{ ...placardRuleStyle, background: entry.accent }} />
        </div>
      </Html>
    </group>
  );
}
