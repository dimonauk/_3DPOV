"use client";

/**
 * components/stage/StageXRBar.tsx — Enter-VR / Enter-AR button row.
 *
 * Sits over the Canvas (HTML, not R3F). Calls `xrStore.enterVR()` or
 * `xrStore.enterAR()` when clicked; both no-op gracefully when WebXR
 * isn't supported. The same Stage scene renders inside the resulting
 * XR session — that's the whole "build the world once, switch web for
 * vr" point.
 *
 * When inside an active session, the bar shows an "Exit" button.
 * Browsers that don't support a given mode hide its button.
 */

import { useEffect, useState } from "react";
import type { XRStore } from "@react-three/xr";

type SupportRecord = {
  vr: boolean;
  ar: boolean;
};

export function StageXRBar({ store }: { store: XRStore }) {
  const [support, setSupport] = useState<SupportRecord>({ vr: false, ar: false });
  const [active, setActive] = useState<"vr" | "ar" | null>(null);

  // Probe support after mount. navigator.xr exists only in browsers
  // that support WebXR at all; the per-mode `isSessionSupported` call
  // is what tells us whether a headset (or AR-capable phone) is
  // actually reachable.
  useEffect(() => {
    let cancelled = false;
    const nav = navigator as Navigator & {
      xr?: { isSessionSupported: (mode: string) => Promise<boolean> };
    };
    if (!nav.xr) return;
    Promise.all([
      nav.xr.isSessionSupported("immersive-vr").catch(() => false),
      nav.xr.isSessionSupported("immersive-ar").catch(() => false),
    ]).then(([vr, ar]) => {
      if (!cancelled) setSupport({ vr, ar });
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  if (!support.vr && !support.ar) {
    return (
      <span
        className="pointer-events-none rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-500"
        title="WebXR is not available in this browser. Try Chrome on Android, Quest browser, or Edge with a headset connected."
      >
        XR · unavailable
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {active ? (
        <button
          type="button"
          onClick={() => store.getState().session?.end()}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.6rem] text-pink-100 transition-colors hover:bg-pink-200/20"
        >
          Exit {active.toUpperCase()}
        </button>
      ) : (
        <>
          {support.vr && (
            <button
              type="button"
              onClick={() => store.enterVR()}
              className="rounded-sm border border-chrome-400/40 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-200 transition-colors hover:border-pink-200 hover:text-pink-200"
            >
              Enter VR
            </button>
          )}
          {support.ar && (
            <button
              type="button"
              onClick={() => store.enterAR()}
              className="rounded-sm border border-chrome-400/40 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-200 transition-colors hover:border-pink-200 hover:text-pink-200"
            >
              Enter AR
            </button>
          )}
        </>
      )}
    </div>
  );
}
