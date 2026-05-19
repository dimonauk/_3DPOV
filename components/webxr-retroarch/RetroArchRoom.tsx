"use client";

/**
 * components/webxr-retroarch/RetroArchRoom.tsx — The virtual game-room
 * R3F scene. CRT TV on a stand, console + controller on a side table,
 * floor under the feet, three-light setup, EmulatorJS canvas piped
 * onto the TV's screen plane.
 *
 * The texture is owned at this level so the per-frame `needsUpdate`
 * flip lives next to the render code that reads it. The XR-controller
 * input poll runs in the same `useFrame` for the same reason — one
 * place to budget the per-frame cost. Quest 3 measured ~1-2 ms for
 * the texture upload on a 256×240 NES surface, ~2-3 ms on 640×480
 * PSX; the input poll is sub-100 µs.
 *
 * The furniture (floor, sky, CRT chassis, stand, table, lights) lives
 * in room-furniture.tsx to keep this file under the studio's 300-line
 * per-file rule.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
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

import {
  CRTChassisAndStand,
  FallbackConsole,
  RoomFloorAndSky,
  RoomLights,
  SideTable,
} from "./room-furniture";

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
      <RoomFloorAndSky layout={layout} />
      <CRTChassisAndStand layout={layout} />
      <SideTable layout={layout} />

      {/* Screen plane — the load-bearing object. CanvasTexture from
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
          args={[layout.screenSize[0], layout.screenSize[1]]}
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

      <RoomLights layout={layout} />

      {/* TV-glow point light at the screen — only on once the picture
          is live, otherwise the dark TV reads more correctly. */}
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

export default RetroArchRoom;
