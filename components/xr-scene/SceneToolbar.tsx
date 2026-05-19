"use client";

/**
 * components/xr-scene/SceneToolbar.tsx — Overlay chrome for SceneStage.
 *
 * Renders over the canvas (HTML, not R3F) with:
 *   - View-mode buttons: "2D" pill (always active), "Enter VR" /
 *     "Enter AR" when supported. Inside an active session, "Exit" +
 *     mode-name pill.
 *   - Tracking-source pill — reads lib/tracking via useViewerPose so
 *     the operator can see which sensor is driving the camera lerp
 *     in 2D mode.
 *   - Ambient toggle — only when the SceneStage allowed it.
 *   - Recenter — bumps the context's recenterTick.
 *   - WebGPU / WebGL badge — small mono pill so the operator can
 *     tell which renderer landed without opening devtools.
 *
 * Styling: warm-black plate with pink-200 accent, same chrome family
 * as StageXRBar and .lux-* classes elsewhere on the site. No new CSS.
 */

import { useEffect, useState } from "react";
import type { XRStore } from "@react-three/xr";

import { useSceneStage } from "hooks/useSceneStageContext";
import { useWebXRSupport } from "hooks/useWebXRSupport";

const PILL_BASE =
  "rounded-sm border px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-wider transition-colors";
const PILL_IDLE =
  "border-chrome-400/40 bg-warm-black-900/80 text-chrome-200 hover:border-pink-200 hover:text-pink-200";
const PILL_ACTIVE =
  "border-pink-200/60 bg-pink-200/15 text-pink-100";
const PILL_DIM =
  "pointer-events-none border-warm-black-700 bg-warm-black-900/70 text-chrome-500";

export type SceneToolbarProps = {
  /** Display label echoed in the toolbar — same as SceneStage's `label`. */
  label: string;
  /** XR store. Pass null when SceneStage was configured without webxr. */
  store: XRStore | null;
  /** Whether the ambient toggle is available. */
  ambientControl: boolean;
};

export function SceneToolbar({ label, store, ambientControl }: SceneToolbarProps) {
  const ctx = useSceneStage();
  const support = useWebXRSupport();
  const [sessionMode, setSessionMode] = useState<"vr" | "ar" | null>(null);

  // Subscribe to the XR store to swap the buttons for an Exit pill
  // when a session is active. Without a store (webxr={false}) the
  // hook is a no-op.
  useEffect(() => {
    if (!store) return;
    const unsub = store.subscribe((s) => {
      if (!s.session) {
        setSessionMode(null);
        return;
      }
      setSessionMode(s.mode === "immersive-ar" ? "ar" : "vr");
    });
    return () => unsub();
  }, [store]);

  if (!ctx) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3"
      role="toolbar"
      aria-label={`${label} scene controls`}
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <span
          className="rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-chrome-300"
          title={label}
        >
          {label}
        </span>
        <span
          className="rounded-sm border border-warm-black-700 bg-warm-black-900/70 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-wider text-chrome-500"
          title={
            ctx.isWebGPU
              ? "WebGPU renderer active"
              : "WebGL 2 fallback active (no WebGPU on this device)"
          }
        >
          {ctx.isWebGPU ? "GPU · WebGPU" : "GPU · WebGL 2"}
        </span>
        {ctx.trackingLabel && (
          <span
            className="rounded-sm border border-pink-200/30 bg-warm-black-900/70 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-wider text-pink-200"
            title={`Camera in 2D mode follows the ${ctx.trackingLabel} source.`}
          >
            Track · {ctx.trackingLabel}
          </span>
        )}
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        {ambientControl && (
          <button
            type="button"
            onClick={() => ctx.setAmbient(!ctx.ambient)}
            className={`${PILL_BASE} ${ctx.ambient ? PILL_ACTIVE : PILL_IDLE}`}
            title="Toggle the ambient particle field behind the scene"
          >
            Ambient · {ctx.ambient ? "on" : "off"}
          </button>
        )}

        <button
          type="button"
          onClick={ctx.requestRecenter}
          className={`${PILL_BASE} ${PILL_IDLE}`}
          title="Reset the camera to the scene's default pose"
        >
          Recenter
        </button>

        <ViewModeControls
          store={store}
          support={support}
          sessionMode={sessionMode}
        />
      </div>
    </div>
  );
}

function ViewModeControls({
  store,
  support,
  sessionMode,
}: {
  store: XRStore | null;
  support: ReturnType<typeof useWebXRSupport>;
  sessionMode: "vr" | "ar" | null;
}) {
  if (!store) {
    // Scene is 2D-only by design.
    return (
      <span className={`${PILL_BASE} ${PILL_ACTIVE}`} title="Scene runs in 2D only">
        2D
      </span>
    );
  }
  if (sessionMode) {
    return (
      <button
        type="button"
        onClick={() => store.getState().session?.end()}
        className={`${PILL_BASE} ${PILL_ACTIVE}`}
      >
        Exit {sessionMode.toUpperCase()}
      </button>
    );
  }
  if (!support.ready) {
    return (
      <span className={`${PILL_BASE} ${PILL_DIM}`} title="Probing WebXR…">
        XR · probing
      </span>
    );
  }
  if (!support.vr && !support.ar) {
    return (
      <span
        className={`${PILL_BASE} ${PILL_DIM}`}
        title="WebXR is not available in this browser. Try Quest browser, or Chromium with a headset connected."
      >
        XR · unavailable
      </span>
    );
  }
  return (
    <>
      <span className={`${PILL_BASE} ${PILL_ACTIVE}`} title="Currently in 2D mode">
        2D
      </span>
      {support.vr && (
        <button
          type="button"
          onClick={() => store.enterVR()}
          className={`${PILL_BASE} ${PILL_IDLE}`}
        >
          Enter VR
        </button>
      )}
      {support.ar && (
        <button
          type="button"
          onClick={() => store.enterAR()}
          className={`${PILL_BASE} ${PILL_IDLE}`}
        >
          Enter AR
        </button>
      )}
    </>
  );
}
