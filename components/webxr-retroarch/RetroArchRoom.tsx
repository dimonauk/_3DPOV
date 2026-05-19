"use client";

/**
 * components/webxr-retroarch/RetroArchRoom.tsx — The virtual game-room
 * R3F scene. CRT TV on a stand, console-and-controller on a side
 * table, floor under the feet, three-light setup, EmulatorJS canvas
 * piped onto the TV's screen plane.
 *
 * The texture is owned at this level so the per-frame `needsUpdate`
 * flip lives next to the render code that reads it. The XR-controller
 * input poll runs in the same `useFrame` for the same reason — one
 * place to budget the per-frame cost. Quest 3 measured ~1-2 ms for
 * the texture upload on a 256×240 NES surface, ~2-3 ms on 640×480
 * PSX; the input poll is sub-100 µs.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BackSide,
  CanvasTexture,
  DoubleSide,
  type MeshBasicMaterial,
} from "three";

import { DeviceMesh } from "components/devices/DeviceMesh";
import { DEVICE_CATALOGUE } from "lib/devices/catalogue";
import {
  buildEmulatorTexture,
  pollXRInput,
  type BridgeInputState,
} from "lib/webxr-retroarch/emulator-bridge";
import { hasSeparateController } from "lib/webxr-retroarch/devices-fallback";
import { getMapping } from "lib/webxr-retroarch/input-mappings";
import { buildRoomLayout } from "lib/webxr-retroarch/room-layout";

export type RetroArchRoomProps = {
  systemSlug: string;
  emulatorCanvas: HTMLCanvasElement | null;
  paused?: boolean;
};

export function RetroArchRoom({
  systemSlug,
  emulatorCanvas,
  paused = false,
}: RetroArchRoomProps) {
  const layout = useMemo(() => buildRoomLayout(), []);
  const mapping = useMemo(() => getMapping(systemSlug), [systemSlug]);

  const texture = useMemo<CanvasTexture | null>(() => {
    if (!emulatorCanvas) return null;
    return buildEmulatorTexture(emulatorCanvas);
  }, [emulatorCanvas]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  const screenMatRef = useRef<MeshBasicMaterial>(null);
  const inputStateRef = useRef<BridgeInputState>(new Map());

  useFrame(() => {
    if (paused) return;
    if (texture && screenMatRef.current) {
      texture.needsUpdate = true;
    }
    inputStateRef.current = pollXRInput(mapping, inputStateRef.current);
  });

  const consoleEntry = useMemo(
    () =>
      DEVICE_CATALOGUE.find(
        (d) => d.slug === systemSlug && d.category === "console",
      ),
    [systemSlug],
  );
  const controllerEntry = useMemo(
    () =>
      DEVICE_CATALOGUE.find(
        (d) =>
          d.slug === `${systemSlug}-controller` &&
          d.category === "console-controller",
      ),
    [systemSlug],
  );

  return (
    <group>
      {/* Floor — matte concrete plate. */}
      <mesh
        position={[
          layout.floorCenter[0],
          layout.floorCenter[1],
          layout.floorCenter[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[layout.floorRadius * 2, layout.floorRadius * 2]} />
        <meshStandardMaterial color="#1c1620" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Skybox — inside-out icosahedron painted near-black. */}
      <mesh scale={32}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#0c0a14"
          roughness={1}
          metalness={0}
          side={BackSide}
        />
      </mesh>

      {/* TV stand — wood-toned box. */}
      <mesh
        position={[
          layout.standCenter[0],
          layout.standCenter[1],
          layout.standCenter[2],
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={layout.standSize as unknown as [number, number, number]}
        />
        <meshStandardMaterial color="#3a2418" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* CRT TV chassis. */}
      <mesh
        position={[
          layout.tvCenter[0],
          layout.tvCenter[1],
          layout.tvCenter[2],
        ]}
        castShadow
      >
        <boxGeometry
          args={layout.tvSize as unknown as [number, number, number]}
        />
        <meshStandardMaterial color="#19191e" roughness={0.55} metalness={0.4} />
      </mesh>

      {/* Two dial knobs — a small period tell. */}
      {[0.08, -0.08].map((dy, i) => (
        <mesh
          key={i}
          position={[
            layout.tvCenter[0] + layout.tvSize[0] / 2 - 0.05,
            layout.tvCenter[1] + dy,
            layout.tvCenter[2] + layout.tvSize[2] / 2 + 0.012,
          ]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.018, 0.018, 0.024, 24]} />
          <meshStandardMaterial color="#c9c2b8" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}

      {/* Screen plane — load-bearing object. CanvasTexture from
          EmulatorJS canvas via the bridge; basic material so the
          framebuffer doesn't get re-lit (lighting on emulator pixels
          looks wrong). */}
      <mesh
        position={[
          layout.screenCenter[0],
          layout.screenCenter[1],
          layout.screenCenter[2],
        ]}
      >
        <planeGeometry
          args={layout.screenSize as unknown as [number, number]}
        />
        <meshBasicMaterial
          ref={screenMatRef}
          map={texture ?? undefined}
          color={texture ? "#ffffff" : "#040408"}
          toneMapped={false}
          side={DoubleSide}
        />
      </mesh>

      {/* Soft glow plane behind the screen — fakes CRT bloom. */}
      <mesh
        position={[
          layout.screenCenter[0],
          layout.screenCenter[1],
          layout.screenCenter[2] - 0.01,
        ]}
      >
        <planeGeometry
          args={[layout.screenSize[0] * 1.4, layout.screenSize[1] * 1.4]}
        />
        <meshBasicMaterial color="#3a285a" transparent opacity={0.35} />
      </mesh>

      {/* Side table — thin chrome slab. */}
      <mesh
        position={[
          layout.tableCenter[0],
          layout.tableCenter[1],
          layout.tableCenter[2],
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={layout.tableSize as unknown as [number, number, number]}
        />
        <meshStandardMaterial color="#1a1822" roughness={0.25} metalness={0.85} />
      </mesh>
      {/* Table legs — four thin uprights. */}
      {([
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ] as const).map(([sx, sz], i) => (
        <mesh
          key={i}
          position={[
            layout.tableCenter[0] + sx * (layout.tableSize[0] / 2 - 0.03),
            layout.tableCenter[1] / 2,
            layout.tableCenter[2] + sz * (layout.tableSize[2] / 2 - 0.03),
          ]}
          castShadow
        >
          <cylinderGeometry args={[0.018, 0.018, layout.tableCenter[1], 8]} />
          <meshStandardMaterial color="#1a1822" roughness={0.3} metalness={0.85} />
        </mesh>
      ))}

      {/* Console body on the table — via DeviceMesh (GLB or primitive
          fallback). */}
      <group
        position={[
          layout.consolePosition[0],
          layout.consolePosition[1] + 0.04,
          layout.consolePosition[2],
        ]}
      >
        {consoleEntry ? (
          <DeviceMesh entry={consoleEntry} spin={0.3} />
        ) : (
          <FallbackConsole />
        )}
      </group>

      {/* Controller resting on the table — for systems with a
          separate controller. The next pass attaches the period
          controller to the XR gripSpace; for now the default XR
          controllers are in the visitor's hand and this prop sets
          the period look on the table. */}
      {hasSeparateController(systemSlug) && controllerEntry ? (
        <group
          position={[
            layout.tableCenter[0] - 0.18,
            layout.tableCenter[1] + 0.07,
            layout.tableCenter[2] + 0.1,
          ]}
          rotation={[0, 0.5, 0]}
        >
          <DeviceMesh entry={controllerEntry} />
        </group>
      ) : null}

      {/* Three-light setup pulled from the layout. */}
      <pointLight
        position={
          layout.keyLight.position as unknown as [number, number, number]
        }
        intensity={layout.keyLight.intensity}
        color={layout.keyLight.colour}
      />
      <pointLight
        position={
          layout.fillLight.position as unknown as [number, number, number]
        }
        intensity={layout.fillLight.intensity}
        color={layout.fillLight.colour}
      />
      <pointLight
        position={
          layout.rimLight.position as unknown as [number, number, number]
        }
        intensity={layout.rimLight.intensity}
        color={layout.rimLight.colour}
      />

      {/* TV-glow point light at the screen. */}
      {texture ? (
        <pointLight
          position={[
            layout.screenCenter[0],
            layout.screenCenter[1],
            layout.screenCenter[2] + 0.3,
          ]}
          intensity={0.7}
          color="#aab8ff"
          distance={3.5}
          decay={2}
        />
      ) : null}
    </group>
  );
}

/** Inlined fallback for systems with no DEVICE_CATALOGUE entry. */
function FallbackConsole() {
  return (
    <mesh castShadow>
      <boxGeometry args={[0.32, 0.07, 0.22]} />
      <meshStandardMaterial color="#c8c8d0" roughness={0.55} metalness={0.2} />
    </mesh>
  );
}

export default RetroArchRoom;
