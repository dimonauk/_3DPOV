"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

/**
 * ZoneScene &mdash; the gaussian-splat viewer stub.
 *
 * The studio runs Apple SHARP locally and drops the resulting .ply
 * file under /public/splats/{slug}.ply. This component is the
 * placeholder that this page will replace once a real splat renderer
 * is wired in. For v0.1 it mounts a Canvas with a chrome-cyan
 * placeholder mesh and an overlay explaining what is pending.
 *
 * The splat side is its own piece of work; the scaffold&rsquo;s value
 * is in being the route + the state machine + the data model that is
 * ready to receive output. The integration spec below is the contract
 * v0.2 implements against.
 *
 * --------------------------------------------------------------------
 * INTEGRATION SPEC (v0.2)
 * --------------------------------------------------------------------
 *
 * Two routes for the v0.2 viewer, depending on appetite:
 *
 * Option A (recommended) &mdash; install mkkellogg/GaussianSplats3D
 *   `pnpm add @mkkellogg/gaussian-splats-3d`
 *
 *   Replace the placeholder mesh below with:
 *
 *     import { GaussianSplats3D } from "@mkkellogg/gaussian-splats-3d";
 *
 *     const viewer = new GaussianSplats3D.Viewer({
 *       cameraUp: [0, 1, 0],
 *       sharedMemoryForWorkers: false,
 *     });
 *     await viewer.addSplatScene(plyUrl, {
 *       splatAlphaRemovalThreshold: 5,
 *       showLoadingUI: false,
 *     });
 *     viewer.start();
 *
 *   The renderer handles its own RAF loop. Mount it imperatively into
 *   the same DOM node R3F&rsquo;s Canvas would; or swap to a useEffect
 *   that mounts the viewer&rsquo;s own renderer/camera and skip R3F
 *   for this scene.
 *
 * Option B &mdash; inline PLY point-cloud renderer
 *   Use three/examples/jsm/loaders/PLYLoader to parse the binary
 *   point cloud into a BufferGeometry, render with THREE.Points and
 *   a small additive-blended ShaderMaterial. This is a point cloud,
 *   not a true splat (no radiance projection), but the studio can
 *   ship a recognisable preview of the geometry while the proper
 *   renderer lands. ~150 lines.
 *
 * Either way the component&rsquo;s public surface stays:
 *   <ZoneScene plyUrl={...} meshUrl={...} />
 *
 * Optional next steps when gameplay lands:
 *   - meshUrl loads a companion GLB for collision (see TripoSR step
 *     in docs/SHARP_PIPELINE.md)
 *   - first-person controls swap in for OrbitControls
 *   - the splat renders as the world; the GLB drives navmesh
 * --------------------------------------------------------------------
 */

type ZoneSceneProps = {
  plyUrl: string;
  meshUrl?: string;
  zoneName: string;
};

function PlaceholderSplat() {
  // Three concentric translucent shells suggesting a point cloud
  // without rendering one; rotates slowly so the placeholder reads
  // as a live scene rather than a still.
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.08 * delta;
      groupRef.current.rotation.x += 0.02 * delta;
    }
  });

  // Deterministic point positions on a sphere &mdash; a golden-spiral
  // distribution, same pattern the sphere page uses.
  const POINT_COUNT = 1200;
  const positions = new Float32Array(POINT_COUNT * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < POINT_COUNT; i++) {
    const y = 1 - (i / (POINT_COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const radius = 1.4 + (Math.sin(i * 0.7) + 1) * 0.35;
    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={POINT_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00f3ff"
          size={0.025}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <mesh>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshBasicMaterial
          color="#ff4dff"
          wireframe
          transparent
          opacity={0.18}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function ZoneScene({ plyUrl, meshUrl, zoneName }: ZoneSceneProps) {
  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-[#0c0a12]">
      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[18rem]">
        <div className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/85 px-3 py-1.5 text-[0.6rem] text-chrome-300">
          Splat viewer &middot; placeholder
        </div>
        <div className="mt-2 rounded-sm border border-warm-black-700 bg-warm-black-900/85 p-3 text-[0.7rem] leading-relaxed text-chrome-400">
          <p>
            <span className="text-chrome-200">{zoneName}.</span> The
            point-cloud spin above is a stand-in. The real renderer
            lands once{" "}
            <code className="font-mono text-chrome-200">
              mkkellogg/GaussianSplats3D
            </code>{" "}
            is installed; integration spec is in the file header.
          </p>
          <p className="mt-2 text-chrome-500">
            PLY: <code className="font-mono">{plyUrl}</code>
            {meshUrl ? (
              <>
                <br />
                Mesh: <code className="font-mono">{meshUrl}</code>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-chrome-500">
        Drag to orbit &middot; scroll to zoom
      </div>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 50 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["#0c0a12"]} />
        <ambientLight intensity={0.4} />
        <PlaceholderSplat />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.4}
          maxDistance={9}
        />
      </Canvas>
    </div>
  );
}
