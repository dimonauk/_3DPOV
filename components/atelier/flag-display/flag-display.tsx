"use client";

/**
 * components/atelier/flag-display/flag-display.tsx — React component
 * that hangs any image as a cloth flag.
 *
 * The default display surface for uploaded images in the studio's
 * chambers (per docs/360-MODEL-PLAN.md). Image hangs as a draped silk
 * cloth pinned at the top, animated by gentle gravity + breeze.
 * Users can grab any vertex and drag it to reshape the cloth.
 *
 * Two view modes:
 *   - "flag" (default): the cloth display described above
 *   - "sphere": image wrapped on a sphere for confirmed 360s
 *
 * This is the WebGL2 / r3f implementation. A WebGPU/TSL variant can
 * later swap in behind the same prop surface — cloth physics is CPU
 * (small grid), so the GPU path mostly affects rendering polish.
 *
 * Mount with next/dynamic + ssr: false:
 *
 *   const FlagDisplay = dynamic(
 *     () => import("components/atelier/flag-display/flag-display"),
 *     { ssr: false },
 *   );
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { XR, type XRStore } from "@react-three/xr";
import * as THREE from "three";
import { TextureLoader } from "three";

import {
  type ClothState,
  createCloth,
  dragVertex,
  findClosestVertex,
  setPinned,
  stepCloth,
} from "./flag-cloth";

export type FlagDisplayMode = "flag" | "sphere";

export type FlagDisplayProps = {
  /** Image URL — loaded once on mount, used as the cloth's albedo. */
  imageUrl: string;
  /** "flag" hangs the image as a cloth; "sphere" wraps it onto a sphere
   *  (for confirmed 360 equirectangular images). Default "flag". */
  mode?: FlagDisplayMode;
  /** Aspect ratio (width / height). When known, the cloth dimensions
   *  match. Default 1.5 (3:2). */
  aspect?: number;
  /** Cloth physics resolution along the long edge. Default 24. */
  resolution?: number;
  /** Enable user-drag of vertices. Default true. */
  draggable?: boolean;
  /** Auto-rotate the orbit camera. Default true. */
  autoRotate?: boolean;
  /** Background fill colour. Default warm-black-950 equivalent. */
  background?: string;
  /** CSS class for the wrapping div. */
  className?: string;
  /** Optional WebXR store from createXRStore(). When supplied, the scene
   *  wraps in <XR store={store}> and the cloth becomes manipulable via
   *  hand-tracking / controllers in VR or AR. The caller is responsible
   *  for rendering the enter/exit bar over the canvas. */
  xrStore?: XRStore;
  /** Called when the user grabs a vertex — useful for inverse-kata. */
  onVertexGrab?: (vertIdx: number, x: number, y: number, z: number) => void;
  /** Called continuously while a vertex is dragged. */
  onVertexDrag?: (vertIdx: number, x: number, y: number, z: number) => void;
};

export type FlagDisplayHandle = {
  /** Lock or unlock a vertex from the outside (used by silk-loom tools). */
  setPinned: (vertIdx: number, isPinned: boolean) => void;
  /** Snap any vertex to a position. */
  forceVertex: (vertIdx: number, x: number, y: number, z: number) => void;
  /** Reset cloth to rest pose. */
  reset: () => void;
};

const FlagDisplay = forwardRef<FlagDisplayHandle, FlagDisplayProps>(
  function FlagDisplay(props, ref) {
    const {
      imageUrl,
      mode = "flag",
      aspect = 1.5,
      background = "#0c0c10",
      className,
    } = props;

    const xrStore = props.xrStore;

    const sceneContents = (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[3, 4, 5]}
          intensity={1.1}
          castShadow={false}
        />
        <directionalLight
          position={[-3, -2, 3]}
          intensity={0.4}
          castShadow={false}
        />
        {mode === "sphere" ? (
          <SphereWrap imageUrl={imageUrl} />
        ) : (
          <FlagCloth
            ref={ref as React.Ref<FlagDisplayHandle>}
            imageUrl={imageUrl}
            aspect={aspect}
            resolution={props.resolution}
            draggable={props.draggable}
            onVertexGrab={props.onVertexGrab}
            onVertexDrag={props.onVertexDrag}
          />
        )}
      </>
    );

    return (
      <div
        // role+aria-label on the wrapper give screen readers something
        // to announce for the R3F canvas inside (the @react-three/fiber
        // <Canvas> renders a raw <canvas> element with no surface for
        // aria attributes that survive a re-render).
        role="img"
        aria-label="Flag-loom: interactive cloth simulation surface"
        className={
          className ??
          "h-full w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950"
        }
      >
        <Canvas
          camera={{ position: [0, 0, 4], fov: 38 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor(background);
          }}
        >
          {xrStore ? <XR store={xrStore}>{sceneContents}</XR> : sceneContents}
          {/* OrbitControls only render outside XR — they'd fight headset
              pose otherwise. Inside XR, the headset's own pose IS the
              camera; orbit is a flat-mode-only affordance. */}
          {!xrStore ? (
            <OrbitControls
              enablePan={false}
              autoRotate={props.autoRotate ?? mode === "sphere"}
              autoRotateSpeed={mode === "sphere" ? 1.4 : 0.3}
              minDistance={1.5}
              maxDistance={8}
            />
          ) : null}
        </Canvas>
      </div>
    );
  },
);

export default FlagDisplay;

// ---------- Flag cloth sub-component ----------

type FlagClothProps = {
  imageUrl: string;
  aspect: number;
  resolution?: number;
  draggable?: boolean;
  onVertexGrab?: (vertIdx: number, x: number, y: number, z: number) => void;
  onVertexDrag?: (vertIdx: number, x: number, y: number, z: number) => void;
};

const FlagCloth = forwardRef<FlagDisplayHandle, FlagClothProps>(
  function FlagCloth(
    {
      imageUrl,
      aspect,
      resolution = 24,
      draggable = true,
      onVertexGrab,
      onVertexDrag,
    },
    ref,
  ) {
    const texture = useLoader(TextureLoader, imageUrl);
    texture.colorSpace = THREE.SRGBColorSpace;

    const meshRef = useRef<THREE.Mesh | null>(null);
    const geometryRef = useRef<THREE.PlaneGeometry | null>(null);

    // Build cloth state once per (resolution, aspect) change.
    const cloth = useMemo<ClothState>(() => {
      // Cloth lives in a 3-unit box for the camera to frame nicely.
      const targetHeight = 2.6;
      const targetWidth = targetHeight * aspect;
      const widthVerts = resolution;
      const heightVerts = Math.max(2, Math.round(resolution / aspect));
      return createCloth({
        widthVertices: widthVerts,
        heightVertices: heightVerts,
        width: targetWidth,
        height: targetHeight,
      });
    }, [aspect, resolution]);

    // Build the matching geometry once cloth state is set.
    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(
        cloth.width,
        cloth.height,
        cloth.widthVertices - 1,
        cloth.heightVertices - 1,
      );
      // Copy cloth.positions into the geometry to start from the rest pose.
      const attr = geo.attributes.position as THREE.BufferAttribute;
      attr.array.set(cloth.positions);
      attr.needsUpdate = true;
      geo.computeVertexNormals();
      return geo;
    }, [cloth]);

    geometryRef.current = geometry;

    useEffect(() => {
      return () => {
        geometry.dispose();
      };
    }, [geometry]);

    // Drag state — vertIdx + pointerId so we only respect the pointer
    // that started the drag (relevant for XR with hand+controller mixed).
    const dragRef = useRef<{ vertIdx: number; pointerId: number } | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        setPinned: (idx: number, isPinned: boolean) => setPinned(cloth, idx, isPinned),
        forceVertex: (idx: number, x: number, y: number, z: number) => {
          dragVertex(cloth, idx, x, y, z);
        },
        reset: () => {
          cloth.positions.set(cloth.restPositions);
          cloth.prevPositions.set(cloth.restPositions);
        },
      }),
      [cloth],
    );

    useFrame((_state, deltaSec) => {
      // Cap dt so the cloth doesn't explode on a long stall.
      const dt = Math.min(deltaSec, 1 / 30);
      // Run two sub-steps per frame for stability at 60fps.
      stepCloth(cloth, performance.now() / 1000);
      stepCloth(cloth, performance.now() / 1000 + dt * 0.5);

      // Note: drag is applied directly in onPointerMove using the
      // event's world-space point. Works identically for mouse, touch,
      // and XR (hand pinch / controller ray) because r3f translates all
      // input sources to the same pointer-event shape.

      // Write positions into geometry
      const attr = geometry.attributes.position as THREE.BufferAttribute;
      (attr.array as Float32Array).set(cloth.positions);
      attr.needsUpdate = true;
      geometry.computeVertexNormals();
    });

    const onPointerDown = useCallback(
      (e: ThreeEvent<PointerEvent>) => {
        if (!draggable) return;
        e.stopPropagation();
        const { x, y, z } = e.point;
        const vertIdx = findClosestVertex(
          cloth,
          x,
          y,
          z,
          cloth.width * 0.1,
        );
        if (vertIdx < 0) return;
        setPinned(cloth, vertIdx, true);
        dragRef.current = { vertIdx, pointerId: e.pointerId };
        onVertexGrab?.(vertIdx, x, y, z);
      },
      [cloth, draggable, onVertexGrab],
    );

    const onPointerMove = useCallback(
      (e: ThreeEvent<PointerEvent>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;
        e.stopPropagation();
        const { x, y, z } = e.point;
        dragVertex(cloth, drag.vertIdx, x, y, z);
        onVertexDrag?.(drag.vertIdx, x, y, z);
      },
      [cloth, onVertexDrag],
    );

    const onPointerUp = useCallback(
      (e: ThreeEvent<PointerEvent>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;
        const idx = drag.vertIdx;
        const wasOriginallyPinned = idx < cloth.widthVertices;
        if (!wasOriginallyPinned) setPinned(cloth, idx, false);
        dragRef.current = null;
      },
      [cloth],
    );

    const onPointerLeave = useCallback(
      (e: ThreeEvent<PointerEvent>) => {
        onPointerUp(e);
      },
      [onPointerUp],
    );

    return (
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>
    );
  },
);

// ---------- Sphere mode (for 360 equirectangulars) ----------

function SphereWrap({ imageUrl }: { imageUrl: string }) {
  const texture = useLoader(TextureLoader, imageUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return (
    <mesh>
      <sphereGeometry args={[2, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}
