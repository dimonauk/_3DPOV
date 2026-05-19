"use client";

/**
 * templates/webxr-game-starter/scene.tsx — Root scene for the WebXR
 * Game Starter.
 *
 * What it draws.
 *   - A 4x4 m faceted floor (MeshStandardMaterial, flatShading).
 *   - Two low-poly props (icosahedron, torus knot) at fixed positions
 *     so you know where the geometry sits when you start moving the
 *     camera around.
 *   - Three pickup targets — small glowing octahedra at known spots.
 *     Walk near one and press `interact`; it vanishes and the pickup
 *     counter ticks. Collect them all and `onPickup` fires with
 *     `done: true`.
 *
 * What it does NOT do.
 *   - It does not own the SceneStage wrapper — page.tsx wraps the
 *     scene so this file stays portable between routes.
 *   - It does not draw a HUD. The HUD is HTML and lives next to the
 *     canvas; rendering HUD text inside the canvas via Html drei is
 *     fine but stops the layout cascading from the page.
 *
 * Input.
 *   - The router from `inputs.ts` is constructed on mount and torn
 *     down on unmount. `interact` fires the pickup check; `menu` is
 *     wired by page.tsx so the Restart button and Escape agree.
 *
 * Win condition.
 *   - `proximityRadius` is the m-distance from a pickup that counts
 *     as "near enough to grab". The camera's world position is
 *     sampled each frame; if any uncollected pickup is in range AND
 *     `interact` is pressed, we collect it.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Color,
  type Group,
  type Mesh,
  Vector3,
} from "three";

import { createStarterInputRouter } from "./inputs";
import { recordPickup, startGame } from "./state";

/** A single pickup target in world space. */
type Pickup = {
  id: string;
  position: [number, number, number];
};

const PICKUPS: Pickup[] = [
  { id: "alpha", position: [-1.4, 0.6, -0.8] },
  { id: "beta", position: [1.3, 0.6, 0.9] },
  { id: "gamma", position: [0.2, 0.6, 1.6] },
];

export type GameSceneProps = {
  /** Distance in metres at which an `interact` press collects. */
  proximityRadius?: number;
  /** Fired every time a pickup is collected. `done` flips on the last. */
  onPickup?: (collected: number, total: number, done: boolean) => void;
};

export function GameScene({
  proximityRadius = 1.2,
  onPickup,
}: GameSceneProps) {
  // Live world-space camera position. R3F gives us the camera object
  // through useThree, and we read its world matrix each frame.
  const { camera } = useThree();

  // Which pickup ids have been collected this session. Local state
  // keeps the meshes hidden without round-tripping through the store.
  const [collected, setCollected] = useState<Set<string>>(new Set());

  // Router lives for the lifetime of the scene. The starter uses
  // refs because we read the `isPressed` flag inside useFrame, where
  // useState would defeat the closure.
  const interactPressedRef = useRef(false);

  useEffect(() => {
    const router = createStarterInputRouter();
    const off = router.onAction("interact", () => {
      interactPressedRef.current = true;
      // The edge-handler fires on the rising edge; clear the flag a
      // frame later so the rAF loop can read it once.
      requestAnimationFrame(() => {
        interactPressedRef.current = false;
      });
    });
    return () => {
      off();
      router.destroy();
    };
  }, []);

  // First-mount: record the start time so the HUD timer ticks.
  useEffect(() => {
    startGame();
  }, []);

  // Per-frame proximity + interact check. The body is intentionally
  // small — fork-and-edit forks add proximity-only collection,
  // gaze-pickup, or per-pickup challenges here.
  const tmp = useMemo(() => new Vector3(), []);
  useFrame(() => {
    if (!interactPressedRef.current) return;
    if (collected.size >= PICKUPS.length) return;

    camera.getWorldPosition(tmp);

    for (const p of PICKUPS) {
      if (collected.has(p.id)) continue;
      const dx = tmp.x - p.position[0];
      const dy = tmp.y - p.position[1];
      const dz = tmp.z - p.position[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance <= proximityRadius) {
        const next = new Set(collected);
        next.add(p.id);
        setCollected(next);
        recordPickup();
        const done = next.size >= PICKUPS.length;
        onPickup?.(next.size, PICKUPS.length, done);
        break;
      }
    }
  });

  return (
    <group>
      <FacetedFloor />

      {/* Two static low-poly props for visual anchor. Fork-edits
          swap them for the actual level geometry. */}
      <mesh position={[-1.8, 0.45, 0.6]} castShadow>
        <icosahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial
          color="#ffc4d9"
          flatShading
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      <mesh position={[1.6, 0.55, -0.7]} castShadow>
        <torusKnotGeometry args={[0.32, 0.11, 96, 8]} />
        <meshStandardMaterial
          color="#a7b3ff"
          flatShading
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>

      {/* Pickups — hidden once collected. */}
      {PICKUPS.map((p) => (
        <PickupMarker
          key={p.id}
          position={p.position}
          hidden={collected.has(p.id)}
        />
      ))}

      {/* A second key light keys the pickup glints. */}
      <pointLight
        position={[2, 3.5, 2]}
        intensity={0.6}
        color="#ffe5cd"
      />
    </group>
  );
}

// ---------------------------------------------------------------------
// Small subcomponents kept in-file so the starter is one open tab. If
// you grow them past ~40 lines apiece, split into ./components/.
// ---------------------------------------------------------------------

function FacetedFloor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[4, 4, 12, 12]} />
      <meshStandardMaterial
        color="#1c1626"
        flatShading
        metalness={0}
        roughness={0.95}
      />
    </mesh>
  );
}

function PickupMarker({
  position,
  hidden,
}: {
  position: [number, number, number];
  hidden: boolean;
}) {
  const ref = useRef<Mesh>(null);

  // Gentle bob so a pickup reads as "collectable" not "set dressing".
  useFrame((state) => {
    const m = ref.current;
    if (!m || hidden) return;
    const t = state.clock.elapsedTime;
    m.position.y = position[1] + Math.sin(t * 2.2 + position[0]) * 0.08;
    m.rotation.y = t * 0.8;
  });

  // Emissive standard material — visible without post-processing,
  // reads under both WebGPU and WebGL2 fallbacks.
  const emissive = useMemo(() => new Color("#ffc4d9"), []);

  return (
    <mesh ref={ref} position={position} visible={!hidden}>
      <octahedronGeometry args={[0.18, 0]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive={emissive}
        emissiveIntensity={1.4}
        metalness={0.3}
        roughness={0.2}
      />
    </mesh>
  );
}

/**
 * Wrap the scene with a group so callers can position the whole game
 * world if they want to mount it inside a larger composition. Re-export
 * pickups so the README can render the same data in docs.
 */
export const STARTER_PICKUPS: ReadonlyArray<Pickup> = PICKUPS;

export default GameScene;
