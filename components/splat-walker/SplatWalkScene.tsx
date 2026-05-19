"use client";

/**
 * components/splat-walker/SplatWalkScene.tsx — WebXR-capable Gaussian
 * splat walker.
 *
 * The R3F scene mounts a Spark.js `SplatMesh` plus an invisible
 * ground plane the user can teleport onto. The wrapper hands the
 * scene over to SceneStage so it inherits the dual-mode chrome:
 *
 *   - 2D mode: OrbitControls (drei) for desk-bound inspection.
 *   - WebXR VR / AR: standard `<XR>` controllers + thumbstick
 *     locomotion (via XRCameraRig) plus `<TeleportTarget>` over a
 *     virtual ground plane (splats have no triangles to raycast).
 *
 * Reduced motion: when the OS reports `prefers-reduced-motion`, the
 * smooth thumbstick locomotion is disabled inside the XR session —
 * teleport remains because it's the discrete-step alternative.
 * Visibility: the R3F frame loop pauses automatically through the
 * existing SceneStage's `frameloop="always"` + Suspense bridge.
 *
 * WebGPU-first / WebGL2 fallback is handled by `createSceneRenderer`
 * inside SceneStage; we don't need to feature-detect here.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Object3D, Vector3 } from "three";
import { TeleportTarget } from "@react-three/xr";

import SceneStage from "components/xr-scene/SceneStage";

import { loadSpark, pickSparkExport } from "lib/splat-walker/spark-loader";
import {
  groundMeshSide,
  resolveTeleportLanding,
} from "lib/splat-walker/teleport-controller";

import { SplatPicker } from "./SplatPicker";

export type SplatWalkSceneProps = {
  /** Splat asset URL. Omit to render the picker only. */
  src?: string;
  /** Wrapper height. Default 80vh. */
  height?: string;
  /** Camera defaults forwarded to SceneStage. */
  initialCamera?: {
    position?: [number, number, number];
    target?: [number, number, number];
  };
  /** Display label for the SceneStage toolbar. */
  label?: string;
};

type LoadedSplat =
  | { kind: "idle" }
  | { kind: "loading"; label: string }
  | { kind: "ready"; label: string; url: string }
  | { kind: "error"; message: string };

export function SplatWalkScene({
  src,
  height = "80vh",
  initialCamera,
  label = "Splat walk",
}: SplatWalkSceneProps) {
  const [splat, setSplat] = useState<LoadedSplat>(
    src ? { kind: "loading", label: "Splat" } : { kind: "idle" },
  );
  const objectUrlRef = useRef<string | null>(null);

  // Promote the src prop into the loaded state.
  useEffect(() => {
    if (!src) return;
    setSplat({ kind: "ready", label: extractLabel(src), url: src });
  }, [src]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    },
    [],
  );

  const reducedMotion = usePrefersReducedMotion();

  const handlePick = (file: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSplat({ kind: "ready", label: file.name, url });
  };

  const activeUrl = splat.kind === "ready" ? splat.url : null;

  return (
    <div className="splat-walker-shell" style={{ width: "100%" }}>
      <div className="splat-walker-bar">
        <SplatPicker
          onPick={handlePick}
          currentLabel={splat.kind === "ready" ? splat.label : null}
        />
        {splat.kind === "loading" && (
          <span className="splat-walker-status">Loading splat…</span>
        )}
        {splat.kind === "error" && (
          <span className="splat-walker-status splat-walker-error">
            {splat.message}
          </span>
        )}
        {reducedMotion && (
          <span
            className="splat-walker-status"
            title="OS asks for reduced motion — use teleport (point + trigger) rather than the thumbstick."
          >
            Teleport only · reduced motion
          </span>
        )}
      </div>

      <SceneStage
        label={label}
        webxr
        ambient={false}
        camera={{
          position: initialCamera?.position ?? [0, 1.6, 3.5],
          target: initialCamera?.target ?? [0, 1, 0],
          fov: 50,
        }}
        height={height}
        background="#050309"
      >
        {activeUrl && (
          <SplatNode
            url={activeUrl}
            onError={(message) => setSplat({ kind: "error", message })}
          />
        )}
        <TeleportGround />
      </SceneStage>

      {!activeUrl && splat.kind === "idle" && (
        <p className="splat-walker-empty">
          Pick a splat file above to begin. Bytes stay on this device —
          no upload, no server processing.
        </p>
      )}

      <style>{`
        .splat-walker-shell {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .splat-walker-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .splat-walker-status {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 0.7rem;
          color: rgba(255, 210, 220, 0.6);
        }
        .splat-walker-error { color: #ff8585; }
        .splat-walker-empty {
          margin-top: 0.4rem;
          font-size: 0.8rem;
          color: rgba(255, 210, 220, 0.55);
        }
      `}</style>
    </div>
  );
}

/**
 * Spark.js splat node — mounted inside the R3F scene graph. The
 * Spark module is loaded once via `loadSpark`, then a `SplatMesh`
 * (or whatever the running version spells it) is constructed with
 * the URL and added via R3F's `<primitive>` helper.
 */
function SplatNode({
  url,
  onError,
}: {
  url: string;
  onError: (message: string) => void;
}) {
  const [object, setObject] = useState<Object3D | null>(null);

  useEffect(() => {
    let cancelled = false;
    let mesh: Object3D | null = null;
    (async () => {
      try {
        const spark = await loadSpark();
        const Ctor = pickSparkExport<
          new (opts: Record<string, unknown>) => Object3D
        >(spark, "SplatMesh", "Splat", "GaussianSplat");
        if (typeof Ctor !== "function") {
          throw new Error(
            "Spark.js: SplatMesh constructor not found in exports",
          );
        }
        mesh = new Ctor({ url });
        if (cancelled) {
          disposeMesh(mesh);
          return;
        }
        setObject(mesh);
      } catch (err) {
        if (cancelled) return;
        onError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
      if (mesh) disposeMesh(mesh);
      setObject(null);
    };
  }, [url, onError]);

  if (!object) return null;
  return <primitive object={object} />;
}

/**
 * Invisible ground plane wrapped in @react-three/xr's
 * `TeleportTarget`. Splats lack walkable geometry, so this plane is
 * the only thing the teleport ray can hit. We clamp the landing
 * point through `resolveTeleportLanding` to keep the user inside
 * the capture's working radius.
 */
function TeleportGround() {
  const side = useMemo(() => groundMeshSide(), []);
  const handleTeleport = (point: Vector3) => {
    const { landing } = resolveTeleportLanding(point);
    // Mutate in place — TeleportTarget consumes the Vector3 after
    // this callback returns and applies it to the XROrigin.
    point.set(landing.x, landing.y, landing.z);
  };
  // The mesh stays visible (raycaster skips invisible) but uses a
  // fully transparent material with depthWrite off so it doesn't
  // tint or occlude the splat. Inside an XR session the
  // TeleportTarget routes the controller ray onto it.
  return (
    <TeleportTarget onTeleport={handleTeleport}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[side, side]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </TeleportTarget>
  );
}

function extractLabel(url: string): string {
  try {
    const tail = url.split(/[/\\?]/).pop() ?? "Splat";
    return tail.length > 64 ? tail.slice(0, 61) + "…" : tail;
  } catch {
    return "Splat";
  }
}

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefers(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return prefers;
}

function disposeMesh(object: Object3D): void {
  // Spark's SplatMesh extends Object3D and owns GPU buffers behind a
  // `.dispose()` method on most versions. Call it defensively.
  const maybe = object as Object3D & { dispose?: () => void };
  try {
    maybe.dispose?.();
  } catch {
    // ignore — some Spark builds clean up on parent removal
  }
  object.parent?.remove(object);
}

export default SplatWalkScene;
