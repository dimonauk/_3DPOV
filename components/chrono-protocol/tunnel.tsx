"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Tunnel stub for the Chrono-Protocol run scene.
 *
 * v0.1: ten arched ribs receding into the distance, a horizon line, a
 * dark base plane. No motion, no shaders, no obstacles. The geometry
 * register matches the prototype's World.tsx: half-torus ribs, instanced
 * along the negative Z axis.
 *
 * TODO &mdash; Wave 2 (combat-and-motion):
 *   - Recycle 40 ribs forward as the camera dollies (matches the
 *     prototype's 100-unit tunnel length).
 *   - Magenta bloom on every tenth rib.
 *   - Sub-floor grid sliding beneath.
 *   - Per-zone skin recolour driven by the zone slug.
 *
 * TODO &mdash; Wave 5 (splat backdrops):
 *   - Render a SHARP-generated splat skybox behind the tunnel when the
 *     active zone has hasSplat:true; otherwise the plain dark
 *     background stays.
 */

export type TunnelStubProps = {
  /** Number of ribs to draw. Default 10. */
  ribCount?: number;
  /** Per-zone accent colour for the rim and grid. */
  accentColor?: string;
  /** Distance between ribs along Z. */
  ribSpacing?: number;
};

export function TunnelStub({
  ribCount = 10,
  accentColor = "#9900ff",
  ribSpacing = 4,
}: TunnelStubProps) {
  const ribs = useMemo(() => {
    const out: Array<{ z: number; key: string }> = [];
    for (let i = 0; i < ribCount; i++) {
      out.push({ z: -i * ribSpacing, key: `rib-${i}` });
    }
    return out;
  }, [ribCount, ribSpacing]);

  return (
    <group>
      {/* Half-torus arch ribs &mdash; the prototype's signature geometry. */}
      {ribs.map((rib, i) => {
        const fade = 1 - i / ribs.length;
        return (
          <mesh
            key={rib.key}
            position={[0, 0, rib.z]}
            rotation={[0, 0, 0]}
          >
            <torusGeometry args={[3, 0.05, 8, 32, Math.PI]} />
            <meshBasicMaterial
              color={accentColor}
              transparent
              opacity={0.25 + fade * 0.55}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Ground plane &mdash; the tunnel floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, -20]}>
        <planeGeometry args={[10, 60]} />
        <meshBasicMaterial color="#0c0a12" />
      </mesh>

      {/* Horizon line &mdash; a thin glowing strip where the tunnel ends. */}
      <mesh position={[0, 0, -ribs.length * ribSpacing - 2]}>
        <planeGeometry args={[6, 0.05]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>
    </group>
  );
}
