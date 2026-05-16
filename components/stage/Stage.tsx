"use client";

/**
 * components/stage/Stage.tsx — Top-level Stage composer.
 *
 * Mounts the R3F Canvas with ACES tone mapping + shadows, drops in
 * the room's environment / ground / avatar / props, and optionally
 * wraps everything in `<XR>` so the same scene can be entered from a
 * headset.
 *
 * Design rule: this component is the only place that knows about the
 * Canvas, tone mapping, and the flat-vs-XR split. Everything below
 * (StageEnvironment, StageGround, StageAvatar, StageProps, StagePost)
 * is pure scene content and is identical between modes.
 *
 * Post-processing intentionally skips when an XR session is active —
 * stereoscopic bloom on a 90Hz headset doubles the per-frame GPU
 * cost and produces dropped frames on mid-range hardware. The scene
 * stays the same; the rendering chain is what differs.
 */

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { createXRStore, useXR, XR } from "@react-three/xr";

import { StageAvatar } from "./StageAvatar";
import { StageEnvironment } from "./StageEnvironment";
import { StageGround } from "./StageGround";
import { StagePost } from "./StagePost";
import { StageProps } from "./StageProps";
import { StageXRBar } from "./StageXRBar";

import type { RoomConfig } from "lib/stage/types";

export type StageProps = {
  room: RoomConfig;
  /**
   * When true, an XR enter button appears over the Canvas. The scene
   * itself is always XR-compatible; this prop just controls whether
   * we render the entry UI + the <XR> provider.
   */
  xr?: boolean;
  /**
   * Optional className applied to the wrapping <div>. The Canvas
   * always fills its parent; size from the outside.
   */
  className?: string;
};

/**
 * Inner content. Lifted out so it can mount either inside or outside
 * <XR> with the same shape.
 */
function StageContent({ room }: { room: RoomConfig }) {
  const orbit = room.camera.orbit ?? true;

  return (
    <>
      {room.fallbackBackground && (
        <color attach="background" args={[room.fallbackBackground]} />
      )}

      <PerspectiveCamera
        makeDefault
        position={room.camera.position}
        fov={room.camera.fov ?? 35}
      />
      {orbit && (
        <OrbitControls
          target={room.camera.target}
          minDistance={0.6}
          maxDistance={8}
          maxPolarAngle={Math.PI * 0.55}
          enablePan={false}
        />
      )}

      <Suspense fallback={null}>
        <StageEnvironment spec={room.environment} />
      </Suspense>

      <StageGround spec={room.ground} />
      <StageAvatar spec={room.avatar} />
      <StageProps specs={room.props} />

      {/* PostGate decides at runtime whether to mount post-processing.
          When an XR session is active, it returns null. */}
      <PostGate post={room.post} />
    </>
  );
}

/**
 * Runs inside the Canvas. Reads the XR session state from useXR()
 * and only mounts <StagePost> when no XR session is active.
 */
function PostGate({ post }: { post: RoomConfig["post"] }) {
  const session = useXR((s) => s.session);
  if (session) return null;
  return <StagePost spec={post} />;
}

export function Stage({ room, xr = false, className }: StageProps) {
  // The XR store has to be stable across renders — recreating it
  // would tear down any active session. Memoise it per Stage mount.
  const xrStore = useMemo(() => createXRStore(), []);

  return (
    <div className={className ?? "relative h-full w-full"}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: SRGBColorSpace,
        }}
      >
        {xr ? (
          <XR store={xrStore}>
            <StageContent room={room} />
          </XR>
        ) : (
          <StageContent room={room} />
        )}
      </Canvas>

      {xr && (
        <div className="absolute right-3 top-3 z-10">
          <StageXRBar store={xrStore} />
        </div>
      )}
    </div>
  );
}
