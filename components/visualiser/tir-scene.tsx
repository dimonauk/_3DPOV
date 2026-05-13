"use client";

import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import {
  fresnelReflectance,
  isTIR,
  refractionAngle,
} from "lib/visualiser/tir-math";

/**
 * TIRScene &mdash; the ray-traced visualiser for total internal reflection.
 *
 * A horizontal interface plane sits at y = 0. The upper half-space (y > 0)
 * is the source medium of refractive index n1 (drawn with a faint chrome-cyan
 * tint to read as &ldquo;denser&rdquo;). The lower half-space (y < 0) is the
 * target medium of index n2 (left empty, reads as air).
 *
 * The incoming ray descends from the upper-left at the controlled angle of
 * incidence (measured from the surface normal, i.e. the vertical Y axis).
 * It strikes the interface at the origin. From there:
 *
 *   - the reflected ray (always present) leaves at the same angle on the
 *     other side of the normal, drawn in pink-200;
 *   - the refracted ray (present only when not TIR) leaves into the lower
 *     medium at the Snell-law angle, drawn in soft amber; its rendered
 *     opacity is scaled by (1 - R) where R is the Fresnel reflectance, so
 *     a near-critical ray appears dim and a normal-incidence ray appears
 *     full strength.
 *
 * Small angle arcs at the interface point label the incident, reflected,
 * and refracted angles. Free orbit camera; auto-rotation disabled by
 * default so the visitor stays in control.
 *
 * The scene is silent &mdash; no narrative voice, no didactic captions.
 * Everything the visitor needs to interpret it lives in the surrounding
 * page chrome and the controls panel.
 */

type Props = {
  n1: number;
  n2: number;
  incidentDeg: number;
};

const DEG = Math.PI / 180;

// Visual constants. The "stage" is a 4-wide, 3-tall box centred on the
// interface point; rays are ~1.6 units long; the interface disc is 4
// units across.
const RAY_LENGTH = 1.6;
const INTERFACE_RADIUS = 2.4;
const VOLUME_DEPTH = 1.6;
const HIT_POINT = new THREE.Vector3(0, 0, 0);

// Build a single straight-line geometry between two points.
function lineGeometry(
  a: THREE.Vector3,
  b: THREE.Vector3,
): THREE.BufferGeometry {
  const positions = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

// Build a small arc in the XY plane (z = 0). Each i-th point sits at
// (sin(a) * r, cos(a) * r, 0) where a sweeps from startRad to endRad. A
// startRad of 0 puts the first point straight up the +Y axis (along the
// surface normal), which matches our convention "angle measured from the
// normal".
function arcGeometry(
  startRad: number,
  endRad: number,
  radius: number,
  segments = 32,
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = startRad + (endRad - startRad) * t;
    positions.push(Math.sin(a) * radius, Math.cos(a) * radius, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return g;
}

// Build a closed circle in the XZ plane (y = 0) &mdash; the rim of the
// interface disc.
function discRimGeometry(radius: number, segments = 96): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return g;
}

function Stage({ n1, n2, incidentDeg }: Props) {
  const incidentRad = incidentDeg * DEG;
  const refractDegOrNull = refractionAngle(incidentDeg, n1, n2);
  const tir = isTIR(incidentDeg, n1, n2);
  const R = fresnelReflectance(incidentDeg, n1, n2);

  // The incident ray comes IN to the origin from the upper-left. Its
  // direction-from-source-to-hit is (sin(theta), -cos(theta), 0). The
  // source point is therefore (-sin(theta) * L, +cos(theta) * L, 0).
  const incidentSource = useMemo(() => {
    return new THREE.Vector3(
      -Math.sin(incidentRad) * RAY_LENGTH,
      Math.cos(incidentRad) * RAY_LENGTH,
      0,
    );
  }, [incidentRad]);

  // The reflected ray leaves the origin to the upper-right, mirroring the
  // incident ray across the normal (the +Y axis).
  const reflectedEnd = useMemo(() => {
    return new THREE.Vector3(
      Math.sin(incidentRad) * RAY_LENGTH,
      Math.cos(incidentRad) * RAY_LENGTH,
      0,
    );
  }, [incidentRad]);

  // The refracted ray leaves the origin into the lower half-space.
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

  // Angle arcs. Incident on the upper-left, reflected on the upper-right,
  // refracted in the lower half-space sweeping right from straight-down.
  const arcRadius = 0.3;
  const incidentArcGeom = useMemo(
    () => arcGeometry(-incidentRad, 0, arcRadius),
    [incidentRad],
  );
  const reflectedArcGeom = useMemo(
    () => arcGeometry(0, incidentRad, arcRadius),
    [incidentRad],
  );
  const refractedArcGeom = useMemo(() => {
    if (refractDegOrNull === null) return null;
    const r = refractDegOrNull * DEG;
    // Lower-half arc: sweep from straight-down (0, -r, 0) to the
    // refracted direction.
    const segs = 32;
    const positions: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const a = r * t;
      positions.push(
        Math.sin(a) * arcRadius,
        -Math.cos(a) * arcRadius,
        0,
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return g;
  }, [refractDegOrNull]);

  // Refracted-ray opacity scaled by Fresnel transmittance. A purely
  // normal-incidence ray comes through near-fully; a near-critical ray is
  // dim. The minimum floor keeps the ray legible.
  const refractedOpacity = Math.max(0.18, 1 - R);

  return (
    <group>
      {/* The interface disc &mdash; a thin chrome-cyan circle at y = 0. */}
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

      {/* Disc rim so the interface reads as a plane, not a smudge. */}
      <lineSegments geometry={discRimGeom}>
        <lineBasicMaterial
          color="#00f3ff"
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </lineSegments>

      {/* Upper-medium volume hint &mdash; a transparent chrome-tint slab
          marking the denser medium above the interface. */}
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

      {/* The vertical normal. Solid muted line through the hit point so
          the angles read as &ldquo;from the normal&rdquo; rather than
          &ldquo;from the surface&rdquo;. */}
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
        <RayLabel
          text={`θᵢ ${incidentDeg.toFixed(1)}°`}
          color="#00f3ff"
        />
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

      {/* TIR badge &mdash; floats near the hit point when engaged. */}
      {tir ? (
        <Html
          position={[0.45, 0.45, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "10px",
              color: "#0c0a12",
              background: "#fbcfe8",
              padding: "3px 7px",
              borderRadius: "2px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              boxShadow: "0 0 14px rgba(251, 207, 232, 0.45)",
            }}
          >
            TIR
          </div>
        </Html>
      ) : null}

      {/* Medium labels &mdash; one for each half-space, just so the
          visitor knows which side is which. */}
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

function RayLabel({ text, color }: { text: string; color: string }) {
  return (
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
      {text}
    </div>
  );
}

function MediumLabel({ text }: { text: string }) {
  return (
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
      {text}
    </div>
  );
}

export default function TIRScene({ n1, n2, incidentDeg }: Props) {
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800"
      style={{ backgroundColor: "#0c0a12" }}
    >
      <Canvas
        camera={{ position: [0, 0.4, 4.2], fov: 50 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.7} />
        <Stage n1={n1} n2={n2} incidentDeg={incidentDeg} />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.2}
          maxDistance={9}
          autoRotate={false}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-chrome-500">
        Drag to rotate &middot; scroll to zoom
      </div>
    </div>
  );
}
