"use client";

/**
 * components/visualiser/tir-scene-stage.tsx — The R3F stage for the TIR
 * visualiser.
 *
 * A horizontal interface plane sits at y = 0. The upper half-space (y > 0)
 * is the source medium of refractive index n1 (drawn with a faint chrome-
 * cyan tint to read as "denser"). The lower half-space (y < 0) is the
 * target medium of index n2 (left empty, reads as air).
 *
 * The incoming ray descends from the upper-left at the controlled angle
 * of incidence (measured from the surface normal). It strikes the
 * interface at the origin. From there:
 *   - the reflected ray (always present) leaves at the same angle on the
 *     other side of the normal, drawn in pink-200;
 *   - the refracted ray (present only when not TIR) leaves into the
 *     lower medium at the Snell-law angle, drawn in soft amber; its
 *     rendered opacity is scaled by (1 - R).
 *
 * Small angle arcs at the interface point label the incident, reflected,
 * and refracted angles. The scene is silent — no narrative voice, no
 * didactic captions; everything the visitor needs lives in surrounding
 * page chrome.
 */

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import {
  fresnelReflectance,
  isTIR,
  refractionAngle,
} from "lib/visualiser/tir-math";

import {
  ARC_RADIUS,
  DEG,
  HIT_POINT,
  INTERFACE_RADIUS,
  RAY_LENGTH,
  VOLUME_DEPTH,
  arcGeometry,
  discRimGeometry,
  lineGeometry,
  refractedArcGeometry,
} from "./tir-scene-geometry";
import { MediumLabel, RayLabel, TirBadge } from "./tir-scene-labels";

export type StageProps = {
  n1: number;
  n2: number;
  incidentDeg: number;
};

export function Stage({ n1, n2, incidentDeg }: StageProps) {
  const incidentRad = incidentDeg * DEG;
  const refractDegOrNull = refractionAngle(incidentDeg, n1, n2);
  const tir = isTIR(incidentDeg, n1, n2);
  const R = fresnelReflectance(incidentDeg, n1, n2);

  // Source point of the incident ray: upper-left of the interface.
  const incidentSource = useMemo(() => {
    return new THREE.Vector3(
      -Math.sin(incidentRad) * RAY_LENGTH,
      Math.cos(incidentRad) * RAY_LENGTH,
      0,
    );
  }, [incidentRad]);

  // Reflected ray endpoint: upper-right, mirroring across the normal.
  const reflectedEnd = useMemo(() => {
    return new THREE.Vector3(
      Math.sin(incidentRad) * RAY_LENGTH,
      Math.cos(incidentRad) * RAY_LENGTH,
      0,
    );
  }, [incidentRad]);

  // Refracted ray endpoint: lower half-space at Snell-law angle.
  const refractedEnd = useMemo(() => {
    if (refractDegOrNull === null) return null;
    const r = refractDegOrNull * DEG;
    return new THREE.Vector3(
      Math.sin(r) * RAY_LENGTH,
      -Math.cos(r) * RAY_LENGTH,
      0,
    );
  }, [refractDegOrNull]);

  const incidentGeom = useMemo(
    () => lineGeometry(incidentSource, HIT_POINT),
    [incidentSource],
  );
  const reflectedGeom = useMemo(
    () => lineGeometry(HIT_POINT, reflectedEnd),
    [reflectedEnd],
  );
  const refractedGeom = useMemo(
    () => (refractedEnd ? lineGeometry(HIT_POINT, refractedEnd) : null),
    [refractedEnd],
  );
  const normalGeom = useMemo(
    () =>
      lineGeometry(
        new THREE.Vector3(0, RAY_LENGTH * 0.95, 0),
        new THREE.Vector3(0, -RAY_LENGTH * 0.95, 0),
      ),
    [],
  );
  const discRimGeom = useMemo(() => discRimGeometry(INTERFACE_RADIUS), []);

  // Angle arcs.
  const incidentArcGeom = useMemo(
    () => arcGeometry(-incidentRad, 0, ARC_RADIUS),
    [incidentRad],
  );
  const reflectedArcGeom = useMemo(
    () => arcGeometry(0, incidentRad, ARC_RADIUS),
    [incidentRad],
  );
  const refractedArcGeom = useMemo(() => {
    if (refractDegOrNull === null) return null;
    return refractedArcGeometry(refractDegOrNull * DEG, ARC_RADIUS);
  }, [refractDegOrNull]);

  // Fresnel-weighted refracted opacity. Near-normal: ~full. Near-critical: dim.
  const refractedOpacity = Math.max(0.18, 1 - R);

  return (
    <group>
      {/* Interface disc — thin chrome-cyan circle at y = 0. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[INTERFACE_RADIUS, 64]} />
        <meshBasicMaterial
          color="#00f3ff"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Disc rim so the interface reads as a plane. */}
      <lineSegments geometry={discRimGeom}>
        <lineBasicMaterial
          color="#00f3ff"
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </lineSegments>

      {/* Upper-medium volume hint — faint chrome-tint slab. */}
      <mesh position={[0, VOLUME_DEPTH / 2, 0]}>
        <boxGeometry
          args={[INTERFACE_RADIUS * 1.4, VOLUME_DEPTH, INTERFACE_RADIUS * 1.4]}
        />
        <meshBasicMaterial
          color="#00f3ff"
          transparent
          opacity={0.035}
          depthWrite={false}
        />
      </mesh>

      {/* The vertical normal. */}
      <lineSegments geometry={normalGeom}>
        <lineBasicMaterial color="#7a7a8a" transparent opacity={0.55} />
      </lineSegments>

      {/* Incident ray. */}
      <lineSegments geometry={incidentGeom}>
        <lineBasicMaterial color="#00f3ff" transparent opacity={0.95} />
      </lineSegments>
      <Html
        position={[
          (incidentSource.x + HIT_POINT.x) * 0.55,
          (incidentSource.y + HIT_POINT.y) * 0.55,
          0,
        ]}
        center
        style={{ pointerEvents: "none" }}
      >
        <RayLabel text={`θᵢ ${incidentDeg.toFixed(1)}°`} color="#00f3ff" />
      </Html>

      {/* Reflected ray. Always present. */}
      <lineSegments geometry={reflectedGeom}>
        <lineBasicMaterial color="#fbcfe8" transparent opacity={0.95} />
      </lineSegments>
      <Html
        position={[
          (HIT_POINT.x + reflectedEnd.x) * 0.55,
          (HIT_POINT.y + reflectedEnd.y) * 0.55,
          0,
        ]}
        center
        style={{ pointerEvents: "none" }}
      >
        <RayLabel
          text={`θᵣ ${incidentDeg.toFixed(1)}°  ·  R=${(R * 100).toFixed(0)}%`}
          color="#fbcfe8"
        />
      </Html>

      {/* Refracted ray. Only when below the critical angle. */}
      {refractedGeom && refractedEnd && refractDegOrNull !== null ? (
        <>
          <lineSegments geometry={refractedGeom}>
            <lineBasicMaterial
              color="#ffd28a"
              transparent
              opacity={refractedOpacity}
            />
          </lineSegments>
          <Html
            position={[
              (HIT_POINT.x + refractedEnd.x) * 0.55,
              (HIT_POINT.y + refractedEnd.y) * 0.55,
              0,
            ]}
            center
            style={{ pointerEvents: "none" }}
          >
            <RayLabel
              text={`θₜ ${refractDegOrNull.toFixed(1)}°  ·  T=${(
                (1 - R) *
                100
              ).toFixed(0)}%`}
              color="#ffd28a"
            />
          </Html>
        </>
      ) : null}

      {/* Angle arcs. */}
      <lineSegments geometry={incidentArcGeom}>
        <lineBasicMaterial color="#00f3ff" transparent opacity={0.55} />
      </lineSegments>
      <lineSegments geometry={reflectedArcGeom}>
        <lineBasicMaterial color="#fbcfe8" transparent opacity={0.55} />
      </lineSegments>
      {refractedArcGeom ? (
        <lineSegments geometry={refractedArcGeom}>
          <lineBasicMaterial color="#ffd28a" transparent opacity={0.55} />
        </lineSegments>
      ) : null}

      {/* TIR badge near the hit point. */}
      {tir ? (
        <Html position={[0.45, 0.45, 0]} center style={{ pointerEvents: "none" }}>
          <TirBadge />
        </Html>
      ) : null}

      {/* n₁ / n₂ corner labels. */}
      <Html
        position={[-INTERFACE_RADIUS * 0.9, VOLUME_DEPTH * 0.85, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <MediumLabel text={`n₁ = ${n1.toFixed(2)}`} />
      </Html>
      <Html
        position={[INTERFACE_RADIUS * 0.9, -VOLUME_DEPTH * 0.85, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <MediumLabel text={`n₂ = ${n2.toFixed(2)}`} />
      </Html>
    </group>
  );
}
