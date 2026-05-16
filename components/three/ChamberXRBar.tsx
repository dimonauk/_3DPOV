"use client";

/**
 * components/three/ChamberXRBar.tsx — Reusable XR enter/exit bar for
 * atelier chambers.
 *
 * Lifted from components/stage/StageXRBar.tsx so the same chrome strip
 * can sit over any chamber Canvas without each chamber rolling its own
 * copy. The bar is HTML (not R3F) — caller is responsible for placement
 * (typically `absolute right-3 top-3` over the Canvas).
 *
 * # Usage
 *
 *     import { createXRStore, XR } from "@react-three/xr";
 *     import { ChamberXRBar } from "components/three/ChamberXRBar";
 *
 *     const xrStore = useMemo(() => createXRStore(), []);
 *
 *     return (
 *       <div className="relative h-[70vh] w-full">
 *         <div className="absolute right-3 top-3 z-20">
 *           <ChamberXRBar store={xrStore} />
 *         </div>
 *         <Canvas>
 *           <XR store={xrStore}>
 *             <SceneContents />
 *           </XR>
 *         </Canvas>
 *       </div>
 *     );
 *
 * # Behaviour
 *
 * - Probes `navigator.xr.isSessionSupported` for both `immersive-vr`
 *   and `immersive-ar` after mount. Hides modes the browser can't enter.
 * - When neither mode is supported, renders a single "XR · unavailable"
 *   pill with a tooltip explaining where WebXR does work.
 * - Subscribes to the XR store to flip the buttons into a single
 *   "Exit VR" / "Exit AR" button while a session is active.
 *
 * # Post-processing gate
 *
 * Chambers that mount post-processing inside the Canvas should gate it
 * with the `XRPostGate` helper (also exported from this file):
 *
 *     function MyPost() { return <EffectComposer>…</EffectComposer> }
 *     <XR store={xrStore}>
 *       …scene…
 *       <XRPostGate>
 *         <MyPost />
 *       </XRPostGate>
 *     </XR>
 *
 * Inside an active XR session, `XRPostGate` returns null. Stereoscopic
 * bloom on a 90Hz headset doubles per-frame GPU cost and drops frames
 * on mid-range hardware; the scene stays the same, only the rendering
 * chain differs.
 */

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useXR } from "@react-three/xr";
import type { XRStore } from "@react-three/xr";

import { createLogger } from "lib/log";

const log = createLogger("three:chamber-xr-bar");

const UNAVAILABLE_TOOLTIP =
  "WebXR not detected. Try Chrome on Android, Quest browser, or Edge with a headset.";

type SupportRecord = {
  vr: boolean;
  ar: boolean;
};

export type ChamberXRBarProps = {
  /** Stable XR store created with `createXRStore()`. */
  store: XRStore;
  /**
   * Override the probed VR support. Useful when the caller has already
   * detected support elsewhere; defaults to internal probe.
   */
  vrSupported?: boolean;
  /** Override the probed AR support. Defaults to internal probe. */
  arSupported?: boolean;
};

export function ChamberXRBar({
  store,
  vrSupported,
  arSupported,
}: ChamberXRBarProps) {
  const [probed, setProbed] = useState<SupportRecord>({ vr: false, ar: false });
  const [active, setActive] = useState<"vr" | "ar" | null>(null);

  // Probe support after mount. navigator.xr exists only in browsers
  // that support WebXR at all; the per-mode `isSessionSupported` call
  // is what tells us whether a headset (or AR-capable phone) is
  // actually reachable. Skip if the caller passed explicit overrides
  // for both modes.
  useEffect(() => {
    if (vrSupported !== undefined && arSupported !== undefined) return;
    let cancelled = false;
    const nav = navigator as Navigator & {
      xr?: { isSessionSupported: (mode: string) => Promise<boolean> };
    };
    if (!nav.xr) return;
    Promise.all([
      nav.xr.isSessionSupported("immersive-vr").catch(() => false),
      nav.xr.isSessionSupported("immersive-ar").catch(() => false),
    ]).then(([vr, ar]) => {
      if (!cancelled) setProbed({ vr, ar });
    });
    return () => {
      cancelled = true;
    };
  }, [vrSupported, arSupported]);

  // Subscribe to the store to track session state for the Exit button.
  useEffect(() => {
    const unsub = store.subscribe((s) => {
      if (s.session) {
        const mode = s.mode === "immersive-ar" ? "ar" : "vr";
        setActive(mode);
      } else {
        setActive(null);
      }
    });
    return () => unsub();
  }, [store]);

  const vr = vrSupported ?? probed.vr;
  const ar = arSupported ?? probed.ar;

  if (!vr && !ar) {
    return (
      <span
        className="pointer-events-none rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-500"
        title={UNAVAILABLE_TOOLTIP}
      >
        XR &middot; unavailable
      </span>
    );
  }

  if (active) {
    return (
      <button
        type="button"
        onClick={() => {
          log.info("exit xr", { mode: active });
          store.getState().session?.end();
        }}
        className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.6rem] text-pink-100 transition-colors hover:bg-pink-200/20"
      >
        Exit XR
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {vr ? (
        <button
          type="button"
          onClick={() => {
            log.info("enter vr");
            store.enterVR();
          }}
          className="rounded-sm border border-chrome-400/40 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-200 transition-colors hover:border-pink-200 hover:text-pink-200"
        >
          Enter VR
        </button>
      ) : null}
      {ar ? (
        <button
          type="button"
          onClick={() => {
            log.info("enter ar");
            store.enterAR();
          }}
          className="rounded-sm border border-chrome-400/40 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-200 transition-colors hover:border-pink-200 hover:text-pink-200"
        >
          Enter AR
        </button>
      ) : null}
    </div>
  );
}

/**
 * Mounts inside the Canvas (and inside the <XR> provider). Returns
 * `children` when no XR session is active, returns null when a session
 * is live. Use to gate post-processing chains that are too expensive
 * for headset framerates.
 */
export function XRPostGate({ children }: { children: ReactNode }) {
  const session = useXR((s) => s.session);
  if (session) return null;
  return <>{children}</>;
}
