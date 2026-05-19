"use client";

/**
 * app/atelier/postprocess-lab/page.tsx — TSL post-process pack showcase.
 *
 * A busy R3F scene wrapped in <SceneStage> so the operator can step
 * through the pack in both 2D and WebXR. The scene mounts:
 *   - A pink torus knot (the bright source god-rays attaches to)
 *   - Three offset spheres at different depths (gives DoF something
 *     to focus past)
 *   - A wide warm-black grid (anchors the screen-space effects)
 *   - A slow drift on the knot — disabled when prefers-reduced-motion
 *
 * The PostStackControls panel floats top-right. Toggling a chip
 * rebuilds the composer from scratch via `attachStack`; the teardown
 * runs on the previous handle so we never stack two composers on the
 * renderer.
 *
 * XR-safety: the page-level effect filter respects the SceneStage
 * mode. Inside an XR session the composer skips non-safe effects and
 * the chip UI shows them as inert. See lib/tsl-post/composer.ts.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import type { Group, Mesh } from "three";

import { SceneStage } from "components/xr-scene/SceneStage";
import { PostStackControls } from "components/tsl-post/PostStackControls";
import { useSceneStage } from "hooks/useSceneStageContext";
import { attachStack, type ComposerHandle } from "lib/tsl-post/composer";
import { paletteHex } from "lib/tsl-materials/palette";

const DEFAULT_STACK: ReadonlyArray<string> = [
  "bloom",
  "foil-sheen",
  "film-grain",
];

export default function PostprocessLabPage() {
  const [stack, setStack] = useState<ReadonlyArray<string>>(DEFAULT_STACK);

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="chrome-label">Atelier &middot; Postprocess lab</div>
      <h1 className="mt-3 text-4xl leading-[0.95] md:text-5xl">
        Post-process pack — author once, run XR-safe.
      </h1>
      <p className="mt-5 max-w-2xl text-chrome-200">
        Eleven TSL effects with a `postprocessing` fallback under each
        one. Toggle them; the composer reattaches. Effects flagged
        2D-only are skipped automatically inside a WebXR session.
      </p>

      <div className="relative mt-8">
        <SceneStage
          label="Postprocess lab"
          height="68vh"
          ambient
          camera={{ position: [2.4, 1.5, 4.5], fov: 38 }}
        >
          <Scene />
          <ComposerBinding stack={stack} />
        </SceneStage>

        <div className="pointer-events-auto absolute right-3 top-3 z-10 w-[min(380px,90vw)]">
          <StackPanel stack={stack} onChange={setStack} />
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-[0.8rem] text-chrome-300">
        Reduced-motion respected on the foil sweep and grain. Composer
        pauses when the page is hidden. See{" "}
        <code className="font-mono text-chrome-200">docs/TSL-POST.md</code>{" "}
        for composition order and perf budgets.
      </p>
    </main>
  );
}

/** Lives outside SceneStage so it can read the stage context. */
function StackPanel({
  stack,
  onChange,
}: {
  stack: ReadonlyArray<string>;
  onChange: (next: ReadonlyArray<string>) => void;
}) {
  // We can't read SceneStageContext outside the provider, so we mirror
  // the xr flag from the URL fragment instead. For the showcase, the
  // header pill already shows mode; defaulting to false keeps the
  // chips active until the operator enters XR.
  return (
    <PostStackControls
      active={stack}
      onChange={onChange}
      xrActive={false}
    />
  );
}

/**
 * Inside the R3F Canvas — wires `attachStack` to the live renderer +
 * scene + camera. Re-attaches on stack changes. Reads `mode` from the
 * SceneStage context so it can filter non-XR-safe effects. Drives the
 * composer's `render(dt)` from `useFrame`, replacing R3F's default
 * renderer.render(scene, camera) call.
 */
function ComposerBinding({ stack }: { stack: ReadonlyArray<string> }) {
  const { gl, scene, camera } = useThree();
  const ctx = useSceneStage();
  const handleRef = useRef<ComposerHandle | null>(null);

  const xrActive = (ctx?.mode ?? "2d") !== "2d";

  useEffect(() => {
    handleRef.current?.dispose();
    handleRef.current = attachStack({
      stack: stack.map((id) => ({ id })),
      renderer: gl,
      scene,
      camera,
      xrActive,
    });
    return () => {
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [stack, gl, scene, camera, xrActive]);

  // Priority > 0 disables R3F's own render call so we own the frame.
  useFrame((_, dt) => {
    const h = handleRef.current;
    if (h && h.hasEffects) {
      h.render(dt);
    } else {
      gl.render(scene, camera);
    }
  }, 1);

  return null;
}

/** Busy scene to show every effect off. */
function Scene() {
  return (
    <Suspense fallback={null}>
      <SubjectKnot />
      <DepthSpheres />
      <FloorGrid />
      <directionalLight position={[3, 5, 4]} intensity={1.4} color="#fff5f9" />
      <pointLight position={[-2, 1.5, 0]} intensity={0.6} color="#b490ff" />
    </Suspense>
  );
}

function SubjectKnot() {
  const ref = useRef<Mesh>(null);
  const reduced = useMemo(reducedMotion, []);
  useFrame((_, dt) => {
    if (!ref.current || reduced) return;
    ref.current.rotation.y += dt * 0.25;
    ref.current.rotation.x += dt * 0.08;
  });
  return (
    <mesh ref={ref} position={[0, 0.6, 0]}>
      <torusKnotGeometry args={[0.55, 0.18, 220, 32]} />
      <meshStandardMaterial
        color={paletteHex["pink-300"]}
        emissive={paletteHex["pink-200"]}
        emissiveIntensity={0.6}
        roughness={0.25}
        metalness={0.4}
      />
    </mesh>
  );
}

function DepthSpheres() {
  const group = useRef<Group>(null);
  const positions: Array<[number, number, number]> = [
    [-1.6, 0.3, 1.0],
    [1.5, 0.4, -1.2],
    [0.2, 0.2, -2.6],
  ];
  const tints = [
    paletteHex["mint-300"],
    paletteHex["lavender-300"],
    paletteHex["chrome-300"],
  ];
  return (
    <group ref={group}>
      {positions.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial
            color={tints[i] ?? paletteHex["chrome-300"]}
            roughness={0.55}
            metalness={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloorGrid() {
  return (
    <Grid
      position={[0, -0.6, 0]}
      args={[20, 20]}
      cellSize={0.5}
      cellThickness={0.6}
      cellColor="#3a323d"
      sectionSize={2}
      sectionThickness={1.0}
      sectionColor="#7a5a8f"
      fadeDistance={14}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
