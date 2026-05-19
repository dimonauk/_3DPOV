"use client";

/**
 * components/parallax/ParallaxCover.tsx — magazine-cover composition.
 *
 * Three stacked ParallaxLayer slots, each running at a different
 * scroll speed so the cover separates into depth bands as the reader
 * scrolls. Default speeds are tuned for the luxury-magazine feel:
 *
 *   backdrop  0.2  — almost still, like a sky behind the page
 *   midground 0.6  — drifts with the page but lazily
 *   foreground 1.0 — locked to scroll (title sits on the page)
 *
 * Push `foreground` above 1.0 (e.g. 1.2) and the title drifts UP as
 * the reader scrolls, leaving the image behind. That's the cinematic
 * "credits roll" trick — handy for hero sections but easy to
 * over-use. Defaults keep it tame.
 */

import type { CSSProperties, ReactNode } from "react";

import { ParallaxLayer } from "./ParallaxLayer";

export type ParallaxCoverSpeeds = {
  backdrop?: number;
  midground?: number;
  foreground?: number;
};

export type ParallaxCoverProps = {
  /** Slowest layer — ambient backdrop, atmospheric tint. */
  backdrop?: ReactNode;
  /** Mid-speed layer — usually the hero image. */
  midground?: ReactNode;
  /** Top layer — title, supertitle, chips. Locked to scroll by default. */
  foreground?: ReactNode;
  speeds?: ParallaxCoverSpeeds;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_SPEEDS: Required<ParallaxCoverSpeeds> = {
  backdrop: 0.2,
  midground: 0.6,
  foreground: 1.0,
};

export function ParallaxCover({
  backdrop,
  midground,
  foreground,
  speeds,
  className,
  style,
}: ParallaxCoverProps) {
  const resolved = { ...DEFAULT_SPEEDS, ...(speeds ?? {}) };

  // All three layers are absolutely positioned in the same box so
  // they share a stacking context. The wrapper supplies the size.
  return (
    <div
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      {backdrop !== undefined && (
        <ParallaxLayer
          speed={resolved.backdrop}
          className="absolute inset-0"
          style={{ zIndex: 0 }}
        >
          {backdrop}
        </ParallaxLayer>
      )}
      {midground !== undefined && (
        <ParallaxLayer
          speed={resolved.midground}
          className="absolute inset-0"
          style={{ zIndex: 1 }}
        >
          {midground}
        </ParallaxLayer>
      )}
      {foreground !== undefined && (
        <ParallaxLayer
          speed={resolved.foreground}
          className="relative"
          style={{ zIndex: 2 }}
        >
          {foreground}
        </ParallaxLayer>
      )}
    </div>
  );
}
