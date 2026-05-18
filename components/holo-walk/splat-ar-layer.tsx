"use client";

/**
 * components/holo-walk/splat-ar-layer.tsx — Gaussian Splat layer for
 * the HoloWalk magic-window AR view.
 *
 * Mounts mkkellogg's `DropInViewer` inside an existing R3F `<Canvas>`
 * so the splat composites with the camera feed + the algorithmic
 * sculpture (when both are present).
 *
 * # Why DropInViewer not Viewer
 *
 * The standalone `SplatViewer` in `components/ar/SplatViewer.tsx` owns
 * its own three.js renderer + camera + animation loop. That's right
 * for AR-card embeds. For the AR window — which already has an R3F
 * scene with the camera feed underneath and other meshes around the
 * splat — we want to add the splat *into* that scene. mkkellogg's
 * `DropInViewer` is a `THREE.Object3D` that does exactly that.
 *
 * # Format preference
 *
 * Reads `splat.spzUrl ?? splat.ksplatUrl ?? splat.plyUrl` so mobile
 * gets the smallest format the deploy bundle provides. SPZ is ~10×
 * smaller than PLY with no perceptible loss.
 *
 * # Lifecycle
 *
 * The DropInViewer attaches as a scene object, owns its own splat
 * resources, and is disposed on unmount. The dependency array
 * deliberately includes the splat URL so swapping splats triggers a
 * full teardown + reload (avoids the half-loaded-state edge case).
 */

import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { createLogger, errToObject } from "lib/log";
import type { SplatAsset } from "lib/holo-walk/locations";

const log = createLogger("holo-walk.SplatArLayer");

type Props = {
  splat: SplatAsset;
  /** Position in scene-local metres. Default origin. */
  position?: [number, number, number];
  /** Quaternion. Default identity. */
  rotation?: [number, number, number, number];
  /** Uniform scale. Default 1. */
  scale?: number;
  /** Optional callback when the splat finishes loading. */
  onLoaded?: () => void;
  /** Optional callback when loading fails. */
  onError?: (err: Error) => void;
};

export default function SplatArLayer({
  splat,
  position = [0, 0, 0],
  rotation = [0, 0, 0, 1],
  scale = 1,
  onLoaded,
  onError,
}: Props) {
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group | null>(null);
  const [loaded, setLoaded] = useState(false);

  const splatUrl = splat.spzUrl ?? splat.ksplatUrl ?? splat.plyUrl;

  useEffect(() => {
    let cancelled = false;
    let dropIn: { dispose: () => void } | null = null;
    const group = new THREE.Group();
    group.position.set(position[0], position[1], position[2]);
    group.quaternion.set(rotation[0], rotation[1], rotation[2], rotation[3]);
    group.scale.setScalar(scale);
    groupRef.current = group;
    scene.add(group);

    (async () => {
      try {
        const GaussianSplats3D = await import("@mkkellogg/gaussian-splats-3d");
        if (cancelled) return;

        const viewer = new GaussianSplats3D.DropInViewer({
          sharedMemoryForWorkers: false,
          gpuAcceleratedSort: true,
          enableSIMDInSort: true,
          dynamicScene: false,
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
          renderMode: GaussianSplats3D.RenderMode.OnChange,
        });
        // Register the dispose hook BEFORE awaiting addSplatScene so an
        // exception (or a fast unmount) on that await doesn't orphan the
        // already-allocated DropInViewer + its WebGL context. Narrowed
        // to `{ dispose }` deliberately — the cleanup ref only needs
        // that one method.
        dropIn = viewer as unknown as { dispose: () => void };

        await viewer.addSplatScene(splatUrl, {
          progressiveLoad: splatUrl.endsWith(".ply") || splatUrl.endsWith(".splat"),
          showLoadingUI: false,
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        });
        if (cancelled) return; // cleanup runs from the returned ref

        // The DropInViewer is a THREE.Object3D; cast through unknown
        // because the package's .d.ts shim doesn't widen to Object3D.
        group.add(viewer as unknown as THREE.Object3D);
        setLoaded(true);
        onLoaded?.();
      } catch (err) {
        if (cancelled) return;
        const wrapped = err instanceof Error ? err : new Error(String(err));
        log.error("failed to load", { err: errToObject(wrapped) });
        onError?.(wrapped);
        // dropIn was wired before addSplatScene — cleanup will release it.
      }
    })();

    return () => {
      cancelled = true;
      if (dropIn) {
        // Dispose may run mid-load (viewer constructed, addSplatScene
        // still pending). The mkkellogg library handles partial init
        // by no-op'ing dispose on uninitialised internals, but log so
        // we see if a real leak ever surfaces from this path.
        if (!loaded) {
          log.info("disposing mid-load", { splatUrl });
        }
        try {
          dropIn.dispose();
        } catch (err) {
          log.warn("dispose threw on unmount", { err: errToObject(err) });
        }
      }
      if (groupRef.current) {
        scene.remove(groupRef.current);
        groupRef.current = null;
      }
    };
    // Re-mount whenever the splat URL or transform changes. Position
    // updates that don't change identity should be applied imperatively
    // by the caller via a ref pattern — for v0 a full teardown is fine.
  }, [splatUrl, position, rotation, scale, scene, onLoaded, onError]);

  // React tree owns nothing visible — the actual splat lives in the
  // three.js scene as a side-effect of the useEffect above. We render
  // an invisible fragment so React Strict Mode and HMR have something
  // to track.
  return null;
}

/** Hint the parent can show while the splat loads. Mounted next to
 *  `<SplatArLayer>` and torn down via `onLoaded`. */
export function SplatLoadingHint({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-pink-200/40 bg-warm-black-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-pink-200 backdrop-blur">
      loading splat &middot; <span className="opacity-60">first paint in ~5s</span>
    </div>
  );
}
