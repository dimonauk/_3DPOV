"use client";

/**
 * hooks/useWebXRSupport.ts — Probe the current browser for WebXR
 * session support.
 *
 * Returns `{ vr, ar, ready }`. `ready` flips true after the probe
 * resolves so consumers can hide the "Enter VR" / "Enter AR" buttons
 * (or render an "unavailable" pill) without flashing the wrong state
 * on first paint.
 *
 * Why a hook rather than a per-component effect: every scene that
 * opts into XR needs the same probe. The hook coalesces it into one
 * call per consumer and keeps the navigator-feature-detection
 * boilerplate out of every scene wrapper.
 *
 * Limitations baked in:
 *   - `navigator.xr.isSessionSupported` is the only honest signal
 *     for VR. AR is more spicy — Meta Quest browser reports `ar`
 *     true even when the device is in passthrough-disabled mode.
 *     We surface the raw answer and let the SceneToolbar render
 *     a tooltip when the user clicks Enter AR and the session
 *     rejects.
 *   - Vision Pro's Safari doesn't expose `navigator.xr` at all and
 *     instead expects the page to call `requestSession` on a model
 *     viewer attribute. That's outside SceneStage's scope; pages
 *     that target Vision Pro need to wire their own entry button.
 */

import { useEffect, useState } from "react";

export type WebXRSupport = {
  /** Headset / mobile VR session reachable. */
  vr: boolean;
  /** Passthrough / handheld AR session reachable. */
  ar: boolean;
  /** Probe has resolved (one way or the other). */
  ready: boolean;
};

type XRNav = Navigator & {
  xr?: {
    isSessionSupported: (mode: string) => Promise<boolean>;
  };
};

export function useWebXRSupport(): WebXRSupport {
  const [state, setState] = useState<WebXRSupport>({
    vr: false,
    ar: false,
    ready: false,
  });

  useEffect(() => {
    if (typeof navigator === "undefined") {
      setState({ vr: false, ar: false, ready: true });
      return;
    }
    const xr = (navigator as XRNav).xr;
    if (!xr) {
      setState({ vr: false, ar: false, ready: true });
      return;
    }

    let cancelled = false;
    void Promise.all([
      xr.isSessionSupported("immersive-vr").catch(() => false),
      xr.isSessionSupported("immersive-ar").catch(() => false),
    ])
      .then(([vr, ar]) => {
        if (cancelled) return;
        setState({ vr, ar, ready: true });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ vr: false, ar: false, ready: true });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
