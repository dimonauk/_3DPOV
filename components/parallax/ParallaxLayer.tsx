"use client";

/**
 * components/parallax/ParallaxLayer.tsx — Drop-in parallax wrapper.
 *
 * Applies useParallax to a div that wraps its children. The div is
 * pre-flagged with `will-change: transform` so the browser promotes
 * it to its own compositor layer before scroll starts — without this
 * the first frame of parallax causes a layer creation hiccup.
 *
 * Use this for any single layer that should drift at a non-1.0 speed
 * relative to scroll. For a composed magazine cover see ParallaxCover.
 */

import type { CSSProperties, ReactNode } from "react";

import { useParallax, type UseParallaxOptions } from "hooks/useParallax";

export type ParallaxLayerProps = UseParallaxOptions & {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Tag override. Default "div". */
  as?: "div" | "section" | "article" | "header" | "footer";
};

export function ParallaxLayer({
  children,
  className,
  style,
  as: Tag = "div",
  speed,
  axis,
  offset,
  rotate,
  respectsReducedMotion,
}: ParallaxLayerProps) {
  const { ref } = useParallax<HTMLDivElement>({
    speed,
    axis,
    offset,
    rotate,
    respectsReducedMotion,
  });

  const mergedStyle: CSSProperties = {
    // Promote the layer to its own GPU compositor before scroll starts.
    willChange: "transform",
    // backface-visibility hidden + transform-style preserve-3d together
    // keep subpixel rendering clean when the layer carries text.
    backfaceVisibility: "hidden",
    ...style,
  };

  return (
    <Tag ref={ref as never} className={className} style={mergedStyle}>
      {children}
    </Tag>
  );
}
