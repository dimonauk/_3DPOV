"use client";

/**
 * components/devices/DevicePlinth.tsx — Plinth + accent spotlight +
 * overhead placard for a single catalogue device.
 *
 * Same shape as SculpturePlinth — small wins from staying parallel:
 * the visitor reads both galleries with the same eye. Differences
 * are in the placard's metadata strip (year + manufacturer + licence
 * chip rather than edition) and the plinth-top scale (devices are
 * smaller than sculptures, so the plinth top is wider and shorter).
 */

import type { CSSProperties } from "react";
import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { SpotLight } from "three";

import type { DeviceEntry } from "lib/devices/catalogue";

import { DeviceMesh } from "./DeviceMesh";

export type DevicePlinthProps = {
  entry: DeviceEntry;
  position: [number, number, number];
  rotationY: number;
  spin?: number;
  showPlacard?: boolean;
  onHover?: (hovering: boolean) => void;
  onClick?: () => void;
};

const PLINTH_HEIGHT = 1.0;
const PLINTH_TOP_RADIUS = 0.28;
const PLINTH_BASE_RADIUS = 0.3;
const DEVICE_LIFT = 0.06;

const placardStyle: CSSProperties = {
  background: "rgba(12, 10, 18, 0.86)",
  border: "1px solid rgba(255, 196, 217, 0.32)",
  borderRadius: "2px",
  padding: "8px 12px",
  minWidth: "200px",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  color: "rgba(255, 230, 240, 0.95)",
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(6px)",
};
const placardTitleStyle: CSSProperties = {
  fontSize: "0.92rem",
  fontWeight: 500,
  letterSpacing: "0.01em",
};
const placardMetaStyle: CSSProperties = {
  fontSize: "0.62rem",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "rgba(255, 196, 217, 0.82)",
  marginTop: "4px",
  fontFamily: "ui-monospace, monospace",
};
const placardLicenceStyle: CSSProperties = {
  display: "inline-block",
  marginTop: "6px",
  padding: "1px 6px",
  fontSize: "0.58rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  border: "1px solid rgba(255, 196, 217, 0.4)",
  borderRadius: "2px",
  color: "rgba(255, 230, 240, 0.85)",
};

export function DevicePlinth({
  entry,
  position,
  rotationY,
  spin = 0,
  showPlacard = false,
  onHover,
  onClick,
}: DevicePlinthProps) {
  const spotRef = useRef<SpotLight>(null);

  const baseIntensity = useMemo(() => 1.4, []);
  useFrame(({ clock }) => {
    const spot = spotRef.current;
    if (!spot) return;
    const t = clock.elapsedTime;
    spot.intensity = baseIntensity + Math.sin(t * 1.2 + entry.year) * 0.10;
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
      {/* Plinth — slim cylinder. Same chrome material as the
          sculpture gallery so the two scenes read together. */}
      <mesh position={[0, PLINTH_HEIGHT * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry
          args={[PLINTH_TOP_RADIUS, PLINTH_BASE_RADIUS, PLINTH_HEIGHT, 32]}
        />
        <meshPhysicalMaterial
          color="#d8d8e0"
          roughness={0.14}
          metalness={0.92}
          clearcoat={0.4}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Accent spot above the device. */}
      <spotLight
        ref={spotRef}
        position={[0, PLINTH_HEIGHT + 1.8, 0]}
        angle={0.5}
        penumbra={0.55}
        intensity={baseIntensity}
        color={entry.presentation.accent}
        castShadow={false}
        target-position={[0, PLINTH_HEIGHT, 0]}
      />

      {/* The device itself. Lifted just above plinth top. */}
      <group position={[0, PLINTH_HEIGHT + DEVICE_LIFT + 0.15, 0]}>
        <DeviceMesh entry={entry} spin={spin} />
      </group>

      <Html
        position={[0, PLINTH_HEIGHT + 1.15, 0]}
        center
        distanceFactor={5.5}
        style={{
          pointerEvents: "none",
          opacity: showPlacard ? 1 : 0,
          transition: "opacity 180ms ease-out",
        }}
      >
        <div style={placardStyle}>
          <div style={placardTitleStyle}>{entry.name}</div>
          <div style={placardMetaStyle}>
            {entry.manufacturer} &middot; {entry.year}
          </div>
          <div
            style={{
              ...placardLicenceStyle,
              borderColor: entry.presentation.accent,
              color: entry.presentation.accent,
            }}
          >
            {entry.attribution.licence}
            {entry.attribution.source ? ` · ${entry.attribution.source}` : ""}
          </div>
        </div>
      </Html>
    </group>
  );
}

export default DevicePlinth;
