"use client";

/**
 * components/stage/StageEnvironment.tsx — HDRI / preset environment lighting.
 *
 * Wraps Drei's <Environment>. Takes the room's EnvironmentSpec and
 * dispatches to the right Drei configuration:
 *   - `kind: "preset"` -> Drei's built-in CC0 envmap (fetched from
 *     drei-assets jsdelivr CDN, cached by Drei).
 *   - `kind: "url"` -> custom .hdr / .exr loaded from public/.
 *
 * Image-based lighting is the single biggest lever on "this scene looks
 * real". A character lit by HDRI looks photographed; a character lit
 * by a couple of <directionalLight>s looks like a video game from 2008.
 * Always prefer the HDRI path.
 */

import { Environment } from "@react-three/drei";

import type { EnvironmentSpec } from "lib/stage/types";

export function StageEnvironment({ spec }: { spec: EnvironmentSpec }) {
  const background = spec.background ?? false;
  const blur = spec.blur ?? 0;

  if (spec.kind === "preset") {
    return (
      <Environment
        preset={spec.preset}
        background={background}
        backgroundBlurriness={blur}
      />
    );
  }

  return (
    <Environment
      files={spec.url}
      background={background}
      backgroundBlurriness={blur}
    />
  );
}
