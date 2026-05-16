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

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
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

    return (
      <div
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
          <OrbitControls
            enablePan={false}
            autoRotate={props.autoRotate ?? mode === "sphere"}
            autoRotateSpeed={mode === "sphere" ? 1.4 : 0.3}
            minDistance={1.5}
            maxDistance={8}
          />
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
    const { camera, raycaster, pointer } = useThree();

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

    // Drag state
    const dragRef = useRef<{ vertIdx: number } | null>(null);

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

      // Drag override applies after physics
      if (dragRef.current) {
        raycaster.setFromCamera(pointer, camera);
        // Drag plane is the camera-facing plane through the cloth's
        // origin. Simple but works for the user-grab gesture.
        const planeNormal = new THREE.Vector3();
        camera.getWorldDirection(planeNormal);
        const plane = new THREE.Plane(planeNormal.negate(), 0);
        const target = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, target)) {
          dragVertex(
            cloth,
            dragRef.current.vertIdx,
            target.x,
            target.y,
            target.z,
          );
          onVertexDrag?.(
            dragRef.current.vertIdx,
            target.x,
            target.y,
            target.z,
          );
        }
      }

      // Write positions into geometry
      const attr = geometry.attributes.position as THREE.BufferAttribute;
      (attr.array as Float32Array).set(cloth.positions);
      attr.needsUpdate = true;
      geometry.computeVertexNormals();
    });

    const onPointerDown = useCallback(
      (e: React.PointerEvent<THREE.Mesh>) => {
        if (!draggable) return;
        e.stopPropagation();
        const point = (e as unknown as { point: THREE.Vector3 }).point;
        const vertIdx = findClosestVertex(
          cloth,
          point.x,
          point.y,
          point.z,
          cloth.width * 0.1,
        );
        if (vertIdx < 0) return;
        // Pin during drag, release after
        setPinned(cloth, vertIdx, true);
        dragRef.current = { vertIdx };
        onVertexGrab?.(vertIdx, point.x, point.y, point.z);
      },
      [cloth, draggable, onVertexGrab],
    );

    const onPointerUp = useCallback(() => {
      if (!dragRef.current) return;
      const idx = dragRef.current.vertIdx;
      // Re-unpin unless this was originally pinned (e.g. top-row).
      const wasOriginallyPinned = idx < cloth.widthVertices;
      if (!wasOriginallyPinned) setPinned(cloth, idx, false);
      dragRef.current = null;
    }, [cloth]);

    const onPointerLeave = useCallback(() => {
      onPointerUp();
    }, [onPointerUp]);

    return (
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerDown={onPointerDown}
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
