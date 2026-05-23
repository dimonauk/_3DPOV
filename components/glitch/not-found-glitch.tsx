"use client";

/**
 * components/glitch/not-found-glitch.tsx
 *
 * One-purpose client component: fire `error.four-oh-four` once when
 * mounted. The 404 page itself is server-rendered; this sits inside it
 * to credit the visitor with the glitch token without making the
 * whole route client-side.
 */

import { useEffect } from "react";

import { useGlitchStore } from "lib/state/glitch";

export function NotFoundGlitch() {
  useEffect(() => {
    useGlitchStore.getState().fireEvent("error.four-oh-four", {
      pathname:
        typeof window !== "undefined" ? window.location.pathname : null,
    });
  }, []);
  return null;
}
