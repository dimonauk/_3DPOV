"use client";

/**
 * components/atelier/voxel-image/voxel-image.tsx — Each pixel of an
 * image becomes one voxel in 3D space.
 *
 * No depth inference — purely cosmetic 1:1 mapping. Two layouts:
 *
 *   - "plane" — voxel grid on the XY plane, default for flat images
 *   - "sphere" — equirectangular pixels mapped to their lat/lon
 *     position on a unit sphere, default for confirmed 360s
 *
 * Pixel-stream animation (optional): each voxel has a phase that
 * advances over time; position interpolates from its home position
 * toward the mirror point on the opposite edge (sphere: across the
 * sphere; plane: across the long axis), then snaps back. Different
 * phase offsets per voxel produce a continuous flow.
 *
 * Rendering: InstancedMesh of small cubes. Per-instance colour is
 * sampled from the image once at load time and held in an
 * InstancedBufferAttribute. Per-instance position recomputes per
 * frame when animation is on.
 *
 * Resolution: default 1024x512 = 524K voxels — smooth on any modern
 * GPU. Slider exposes 256/512/1024/2048 width buckets.
 *
 * Mount with next/dynamic + ssr:false (sampled OffscreenCanvas needs
 * the browser).
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export type VoxelLayout = "plane" | "sphere";

export type VoxelImageProps = {
  imageUrl: string;
  /** Voxel grid width — image is downsampled to this resolution.
   *  Height computed from aspect (plane) or 2:1 (sphere). Default 1024. */
  resolution?: number;
  /** Voxel cube size in world units. Default 0.005 for plane, auto for sphere. */
  voxelSize?: number;
  /** Sphere radius in world units. Only used for layout="sphere". Default 1.5. */
  sphereRadius?: number;
  /** Plane width in world units. Only used for layout="plane". Default 3. */
  planeWidth?: number;
  layout?: VoxelLayout;
  /** Enable the pixel-stream animation. Default false. */
  animate?: boolean;
  /** Animation cycle in seconds (one full out-and-back). Default 6. */
  cycleSeconds?: number;
  /** Maximum displacement amplitude as a fraction of the surface
   *  (0..1). 1 = full travel to mirror point. Default 0.6. */
  animationAmplitude?: number;
  background?: string;
  className?: string;
};

export default function VoxelImage(props: VoxelImageProps) {
  const {
    imageUrl,
    resolution = 1024,
    layout = "sphere",
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
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={0.6} />
        <VoxelField
          imageUrl={imageUrl}
          resolution={resolution}
          layout={layout}
          voxelSize={props.voxelSize}
          sphereRadius={props.sphereRadius ?? 1.5}
          planeWidth={props.planeWidth ?? 3}
          animate={props.animate ?? false}
          cycleSeconds={props.cycleSeconds ?? 6}
          animationAmplitude={props.animationAmplitude ?? 0.6}
        />
        <OrbitControls
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.4}
          minDistance={1.2}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}

// ---------- VoxelField ----------

type VoxelFieldProps = {
  imageUrl: string;
  resolution: number;
  layout: VoxelLayout;
  voxelSize?: number;
  sphereRadius: number;
  planeWidth: number;
  animate: boolean;
  cycleSeconds: number;
  animationAmplitude: number;
};

function VoxelField(props: VoxelFieldProps) {
  const {
    imageUrl,
    resolution,
    layout,
    sphereRadius,
    planeWidth,
    animate,
    cycleSeconds,
    animationAmplitude,
  } = props;

  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const [data, setData] = useState<VoxelData | null>(null);

  // Sample the image into a voxel grid when imageUrl or resolution change.
  useEffect(() => {
    let cancelled = false;
    void sampleImage(imageUrl, resolution, layout).then((sampled) => {
      if (cancelled) return;
      setData(sampled);
    });
    return () => {
      cancelled = true;
    };
  }, [imageUrl, resolution, layout]);

  // Compute home + mirror positions per voxel when data, layout, or
  // sizing changes.
  const positions = useMemo(() => {
    if (!data) return null;
    return computePositions(
      data,
      layout,
      sphereRadius,
      planeWidth,
    );
  }, [data, layout, sphereRadius, planeWidth]);

  // Set the colour attribute when data changes.
  useEffect(() => {
    if (!data || !meshRef.current) return;
    const mesh = meshRef.current;
    const colourAttr = new THREE.InstancedBufferAttribute(data.colours, 3);
    mesh.geometry.setAttribute("instanceColor", colourAttr);
    // Use vertex colours through a custom material setup.
    (mesh.material as THREE.MeshLambertMaterial).vertexColors = true;
  }, [data]);

  // Set initial instance matrices.
  useEffect(() => {
    if (!data || !positions || !meshRef.current) return;
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();
    const voxelSize = props.voxelSize ?? defaultVoxelSize(layout, planeWidth, sphereRadius, data);
    dummy.scale.setScalar(voxelSize);
    for (let i = 0; i < data.count; i++) {
      const o = i * 3;
      dummy.position.set(positions.home[o]!, positions.home[o + 1]!, positions.home[o + 2]!);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [data, positions, layout, planeWidth, sphereRadius, props.voxelSize]);

  // Per-frame animation update.
  useFrame((_state, _delta) => {
    if (!animate || !data || !positions || !meshRef.current) return;
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();
    const voxelSize = props.voxelSize ?? defaultVoxelSize(layout, planeWidth, sphereRadius, data);
    dummy.scale.setScalar(voxelSize);
    const tSec = performance.now() / 1000;
    const cycle = Math.max(0.1, cycleSeconds);
    const amp = animationAmplitude;
    for (let i = 0; i < data.count; i++) {
      const off = i * 3;
      // Per-voxel phase offset so voxels stagger.
      const phase = ((tSec / cycle) + positions.phaseOffset[i]!) % 1;
      // Ease: sin(π · phase) peaks at mid-cycle, returns to 0 at edges.
      const t = Math.sin(phase * Math.PI) * amp;
      dummy.position.set(
        positions.home[off]! + (positions.mirror[off]! - positions.home[off]!) * t,
        positions.home[off + 1]! + (positions.mirror[off + 1]! - positions.home[off + 1]!) * t,
        positions.home[off + 2]! + (positions.mirror[off + 2]! - positions.home[off + 2]!) * t,
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!data || !positions) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, data.count]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  );
}

// ---------- Sampling + position math ----------

type VoxelData = {
  width: number;
  height: number;
  /** Flattened RGB colours, [r0,g0,b0, r1,g1,b1, ...]. Length = count*3. */
  colours: Float32Array;
  count: number;
};

async function sampleImage(
  url: string,
  targetWidth: number,
  layout: VoxelLayout,
): Promise<VoxelData> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`Failed to load ${url}`));
    im.src = url;
  });
  // Sphere layout always expects 2:1; clamp height accordingly. Plane
  // layout uses the image's actual aspect.
  const srcAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
  const width = Math.max(8, Math.min(2048, targetWidth | 0));
  const height =
    layout === "sphere"
      ? Math.round(width / 2)
      : Math.max(4, Math.round(width / srcAspect));

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });
  const ctx = (canvas as OffscreenCanvas | HTMLCanvasElement).getContext("2d") as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  ctx.drawImage(img as CanvasImageSource, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const count = width * height;
  const colours = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const src = i * 4;
    const dst = i * 3;
    colours[dst] = pixels[src]! / 255;
    colours[dst + 1] = pixels[src + 1]! / 255;
    colours[dst + 2] = pixels[src + 2]! / 255;
  }
  return { width, height, colours, count };
}

type Positions = {
  /** Home positions, [x0,y0,z0, x1,y1,z1, ...]. */
  home: Float32Array;
  /** Mirror positions (target end of pixel-stream travel). */
  mirror: Float32Array;
  /** Per-voxel phase offset 0..1 so voxels stagger across the animation. */
  phaseOffset: Float32Array;
};

function computePositions(
  data: VoxelData,
  layout: VoxelLayout,
  sphereRadius: number,
  planeWidth: number,
): Positions {
  const { width, height, count } = data;
  const home = new Float32Array(count * 3);
  const mirror = new Float32Array(count * 3);
  const phaseOffset = new Float32Array(count);

  if (layout === "sphere") {
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const idx = j * width + i;
        const off = idx * 3;
        // Equirectangular → spherical:
        //   lon (φ) = (i / width) * 2π   ∈ [0, 2π]
        //   lat (θ) = (j / height) * π   ∈ [0, π]
        const lon = (i / width) * Math.PI * 2;
        const lat = (j / height) * Math.PI;
        const x = sphereRadius * Math.sin(lat) * Math.cos(lon);
        const y = sphereRadius * Math.cos(lat);
        const z = sphereRadius * Math.sin(lat) * Math.sin(lon);
        home[off] = x;
        home[off + 1] = y;
        home[off + 2] = z;
        // Mirror = antipode (other side of the sphere).
        mirror[off] = -x;
        mirror[off + 1] = -y;
        mirror[off + 2] = -z;
        // Phase offset: hash of (i, j) into 0..1 so neighbours stagger.
        phaseOffset[idx] = pseudoRandom(i, j);
      }
    }
  } else {
    // Plane: voxels on XY at z=0; mirror = same y, flipped x (so they
    // travel left↔right).
    const cellSize = planeWidth / width;
    const planeHeight = cellSize * height;
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const idx = j * width + i;
        const off = idx * 3;
        const x = -planeWidth / 2 + (i + 0.5) * cellSize;
        const y = planeHeight / 2 - (j + 0.5) * cellSize;
        home[off] = x;
        home[off + 1] = y;
        home[off + 2] = 0;
        // Mirror = same row, opposite edge.
        mirror[off] = -x;
        mirror[off + 1] = y;
        mirror[off + 2] = 0;
        phaseOffset[idx] = pseudoRandom(i, j);
      }
    }
  }
  return { home, mirror, phaseOffset };
}

function defaultVoxelSize(
  layout: VoxelLayout,
  planeWidth: number,
  sphereRadius: number,
  data: VoxelData,
): number {
  if (layout === "sphere") {
    // Each voxel covers roughly the angular span of one pixel.
    return (sphereRadius * Math.PI * 2) / data.width * 0.5;
  }
  return (planeWidth / data.width) * 0.9;
}

/** Cheap hash → 0..1 for staggered animation. */
function pseudoRandom(i: number, j: number): number {
  const h = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return h - Math.floor(h);
}
