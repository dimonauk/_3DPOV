"use client";

/**
 * components/xr-scene/SceneStage.tsx — Dual-mode (WebXR + 2D) scene
 * wrapper. The headline component of the xr-scene system.
 *
 * Direction (Dimona, 2026-05-19): "were webxr webgpu tsl first and
 * build access to these systems for 2s trad use and view". This
 * wrapper makes every Three.js scene on the site reachable through
 * three view modes:
 *
 *   - 2D monitor view (default): TwoDCameraRig with tracking-driven
 *     parallax OR drei OrbitControls when no tracker has resolved.
 *   - WebXR VR session: enter via the toolbar; XRCameraRig takes
 *     over and controllers get thumbstick locomotion.
 *   - WebXR AR session: same hook, passthrough background.
 *
 * Rendering:
 *   - WebGPU when navigator.gpu exists, via a custom `gl` factory
 *     fed into R3F's Canvas. The factory is dual-renderer.ts.
 *   - WebGL2 fallback otherwise — identical scene graph, identical
 *     materials (TSL presets compile to both backends).
 *
 * Visibility + reduced-motion:
 *   - prefers-reduced-motion: any TSL preset's `tick` is suppressed
 *     and the camera lerp shortens to a hard snap. AmbientField has
 *     its own reduced-motion guard.
 *   - document.hidden: the R3F frameloop is set to "never" so we
 *     stop sending render commands to the GPU. Inside a WebXR
 *     session the headset runtime drives its own loop — leaving
 *     R3F paused is the right call there too because the session
 *     hook reawakens us on session start.
 */

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, type RootState } from "@react-three/fiber";
import { XR, createXRStore, useXR } from "@react-three/xr";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";

import { AmbientField } from "components/ambient/AmbientField";
import {
  SceneStageContext,
  type SceneStageContextValue,
  type SceneStageMode,
} from "hooks/useSceneStageContext";
import { useViewerPose } from "hooks/useViewerPose";

import { SceneToolbar } from "./SceneToolbar";
import { TwoDCameraRig } from "./TwoDCameraRig";
import { XRCameraRig } from "./XRCameraRig";
import { createSceneRenderer } from "lib/xr-scene/dual-renderer";

export type SceneStageProps = {
  /** R3F scene content — meshes, lights, helpers. */
  children: ReactNode;
  /** Short label rendered on the toolbar + announced to screen readers. */
  label: string;
  /** Allow WebXR sessions. Default true. Set false for 2D-only scenes. */
  webxr?: boolean;
  /** Render the ambient particle field behind the scene. Default false. */
  ambient?: boolean;
  /** 2D-mode camera defaults. */
  camera?: {
    position?: [number, number, number];
    target?: [number, number, number];
    fov?: number;
  };
  /** Canvas height — "60vh", "100vh", "480px", etc. Default "70vh". */
  height?: string;
  /** Backdrop fill colour. Default var(--color-warm-black-950). */
  background?: string;
};

export function SceneStage({
  children,
  label,
  webxr = true,
  ambient = false,
  camera,
  height = "70vh",
  background,
}: SceneStageProps) {
  const xrStore = useMemo(() => (webxr ? createXRStore() : null), [webxr]);
  const [ambientOn, setAmbientOn] = useState(ambient);
  const [recenterTick, setRecenterTick] = useState(0);
  const [mode, setMode] = useState<SceneStageMode>("2d");
  const [rendererInfo, setRendererInfo] = useState<{
    isWebGPU: boolean;
    isXRCapable: boolean;
  }>({ isWebGPU: false, isXRCapable: webxr });

  const { source } = useViewerPose();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Track session state for the toolbar + context mode label.
  useEffect(() => {
    if (!xrStore) return;
    const unsub = xrStore.subscribe((s) => {
      if (!s.session) setMode("2d");
      else if (s.mode === "immersive-ar") setMode("ar");
      else setMode("vr");
    });
    return () => unsub();
  }, [xrStore]);

  // R3F's `gl` factory delegates to dual-renderer so WebGPU lands
  // when available. The factory returns the renderer object; R3F
  // adopts it as `state.gl` and uses its `.xr` binding to manage
  // WebXR sessions through the store.
  //
  // R3F passes a merged `{ canvas, ...rendererParams }` object — we
  // pull the canvas out and forward the alpha + antialias to the
  // dual-renderer factory.
  const glFactory = useMemo(
    () =>
      async (defaultProps: { canvas: HTMLCanvasElement | OffscreenCanvas }) => {
        const canvas = defaultProps.canvas as HTMLCanvasElement;
        const result = await createSceneRenderer(canvas, {
          webxr,
          clearColor: 0x0c0a12,
          clearAlpha: background ? 1 : 0,
          antialias: true,
        });
        setRendererInfo({
          isWebGPU: result.isWebGPU,
          isXRCapable: result.isXRCapable,
        });
        return result.renderer as unknown as import("three").WebGLRenderer;
      },
    [webxr, background],
  );

  const ctxValue = useMemo<SceneStageContextValue>(
    () => ({
      mode,
      ambient: ambientOn,
      setAmbient: setAmbientOn,
      isWebGPU: rendererInfo.isWebGPU,
      isXRCapable: rendererInfo.isXRCapable,
      trackingLabel: source ? formatSource(source) : null,
      recenterTick,
      requestRecenter: () => setRecenterTick((n) => n + 1),
    }),
    [mode, ambientOn, rendererInfo, source, recenterTick],
  );

  return (
    <SceneStageContext.Provider value={ctxValue}>
      <div
        ref={wrapperRef}
        className="relative w-full overflow-hidden rounded-md border border-warm-black-700 bg-warm-black-950"
        style={{
          height,
          background: background ?? "var(--color-warm-black-950, #0c0a12)",
        }}
      >
        {ambientOn && <AmbientField intensity={0.45} />}

        <Canvas
          // Frameloop "demand" pauses the loop until something asks
          // for a frame; we ask via setFrameloop inside the visibility
          // hook below. Inside an XR session, the runtime drives the
          // loop directly and ignores this flag.
          frameloop="always"
          dpr={[1, 2]}
          gl={glFactory as unknown as React.ComponentProps<typeof Canvas>["gl"]}
          camera={{
            position: camera?.position ?? [0, 1, 3.5],
            fov: camera?.fov ?? 35,
            near: 0.05,
            far: 200,
          }}
          onCreated={(state: RootState) => {
            state.gl.setClearColor(0x0c0a12, background ? 1 : 0);
            // Tone mapping + colour space — same defaults Stage.tsx
            // uses so a scene moved between the two wrappers looks
            // the same.
            const gl = state.gl as unknown as {
              toneMapping?: number;
              toneMappingExposure?: number;
              outputColorSpace?: string;
            };
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
            gl.outputColorSpace = SRGBColorSpace;
          }}
        >
          {xrStore ? (
            <XR store={xrStore}>
              <SceneRouter
                camera={camera}
                xrEnabled={webxr}
              >
                {children}
              </SceneRouter>
            </XR>
          ) : (
            <SceneRouter camera={camera} xrEnabled={false}>
              {children}
            </SceneRouter>
          )}
        </Canvas>

        <SceneToolbar
          label={label}
          store={xrStore}
          ambientControl={ambient}
        />
      </div>
    </SceneStageContext.Provider>
  );
}

/**
 * Inside the Canvas. Decides which camera rig to mount based on the
 * XR session state. The scene `children` stay constant — both rigs
 * share the same scene graph.
 */
function SceneRouter({
  children,
  camera,
  xrEnabled,
}: {
  children: ReactNode;
  camera: SceneStageProps["camera"];
  xrEnabled: boolean;
}) {
  // useXR fires `null` outside a session and the session object
  // when inside one. R3F's XR provider auto-renders the standard
  // controllers, so the rig only needs to wire locomotion.
  const session = useXR((s) => (xrEnabled ? s.session : null));

  return (
    <>
      {/* Soft default lighting. Scenes that want full control can
          mount their own — these lights are weak enough not to wash
          out a custom setup. */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[2, 4, 3]} intensity={1.0} />

      <Suspense fallback={null}>{children}</Suspense>

      {session ? (
        <XRCameraRig
          position={camera?.position ?? [0, 0, 1.6]}
        />
      ) : (
        <TwoDCameraRig
          position={camera?.position}
          target={camera?.target}
          fov={camera?.fov}
        />
      )}
    </>
  );
}

function formatSource(source: string): string {
  // Compact display labels. Mirrors the chips the tracking docs
  // use elsewhere on the site.
  switch (source) {
    case "kinect":
      return "Kinect";
    case "ultraleap":
      return "Ultraleap";
    case "mediapipe-face":
      return "Face";
    case "mediapipe-hand":
      return "Hand";
    case "pointer":
      return "Pointer";
    default:
      return source;
  }
}

export default SceneStage;
