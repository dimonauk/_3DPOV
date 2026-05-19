"use client";

/**
 * components/sculpture-gallery/WallRelief.tsx — Belt-printed wall
 * relief hung on the back wall at eye-level.
 *
 * The relief is a thin disc — the belt printer's continuous tile,
 * mounted on a black aluminium back-plate. Tinted accent strip below
 * the title. No plinth, no spot — the gallery's ceiling fill lights
 * it at the same exposure as the floor pieces.
 */

import type { CSSProperties } from "react";
import { Html } from "@react-three/drei";

import type { SculptureEntry } from "lib/sculpture-gallery/catalogue";

import { SculptureMesh } from "./SculptureMesh";

export type WallReliefProps = {
  entry: SculptureEntry;
  position: [number, number, number];
  /** Always faces +z so the visitor reads the relief straight. */
  rotationY: number;
  showPlacard?: boolean;
  onHover?: (hovering: boolean) => void;
  onClick?: () => void;
};

const BACKPLATE_SIZE = 0.9;
const BACKPLATE_THICKNESS = 0.04;

// Inline placard styles — mirrors SculpturePlinth so the two surfaces
// read as part of the same gallery without depending on a class in
// globals.css.
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

export function WallRelief({
  entry,
  position,
  rotationY,
  showPlacard = false,
  onHover,
  onClick,
}: WallReliefProps) {
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
      {/* Black aluminium back-plate. Thin slab, matt finish so the
          relief reads against it without specular contamination. */}
      <mesh position={[0, 0, BACKPLATE_THICKNESS * 0.5]}>
        <boxGeometry
          args={[BACKPLATE_SIZE, BACKPLATE_SIZE, BACKPLATE_THICKNESS]}
        />
        <meshStandardMaterial color="#0c0c12" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* The relief itself — a flat-scaled sculpture mesh projecting
          forward from the back-plate. */}
      <group position={[0, 0, BACKPLATE_THICKNESS + 0.06]}>
        <SculptureMesh
          modelUrl={entry.modelUrl}
          primitive={entry.primitive}
          accent={entry.accent}
          flat
        />
      </group>

      {/* Accent strip beneath the relief — same tint as the plinth
          spot would have used. */}
      <mesh position={[0, -BACKPLATE_SIZE * 0.55, BACKPLATE_THICKNESS + 0.005]}>
        <boxGeometry args={[BACKPLATE_SIZE * 0.7, 0.015, 0.002]} />
        <meshBasicMaterial color={entry.accent} />
      </mesh>

      {/* Placard. Mounted to the right of the relief at the same
          height, only visible on hover/focus. */}
      <Html
        position={[BACKPLATE_SIZE * 0.7, 0, BACKPLATE_THICKNESS + 0.01]}
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
            {entry.edition ? null : " · open edition"}
          </div>
          <div style={{ ...placardRuleStyle, background: entry.accent }} />
        </div>
      </Html>
    </group>
  );
}
