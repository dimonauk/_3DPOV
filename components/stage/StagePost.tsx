"use client";

/**
 * components/stage/StagePost.tsx — Bloom + vignette post-processing.
 *
 * Runs only in flat-screen mode. Inside an active WebXR session this
 * component should NOT be mounted — stereoscopic post on a 90Hz
 * headset doubles the GPU cost per frame and produces dropped frames
 * on mid-range hardware. The parent Stage gates this by reading
 * `useXR().session` and conditionally rendering us.
 *
 * Defaults are tuned to flatter VRM characters without crushing skin
 * tones: low-intensity bloom (the brightest part of a normalised VRM
 * is the eye-highlights), moderate vignette to focus on centre.
 */

import {
  Bloom,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";

import type { PostSpec } from "lib/stage/types";

export function StagePost({ spec }: { spec: PostSpec | undefined }) {
  const bloom = spec?.bloom ?? true;
  const vignette = spec?.vignette ?? 0.2;

  if (!bloom && vignette <= 0) return null;

  return (
    <EffectComposer enableNormalPass={false}>
      {bloom ? (
        <Bloom
          intensity={0.45}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
      ) : (
        // EffectComposer requires at least one child; render an
        // imperceptible vignette as a no-op when bloom is off.
        <Vignette eskil={false} offset={0.5} darkness={0.0001} />
      )}
      {vignette > 0 ? (
        <Vignette eskil={false} offset={0.3} darkness={vignette} />
      ) : (
        <Vignette eskil={false} offset={0.5} darkness={0.0001} />
      )}
    </EffectComposer>
  );
}
