"use client";

/**
 * components/type3d/MeshProseLayer.tsx — body-text mesh wrapper.
 *
 * Wraps a block of body text. The HTML is always rendered (server
 * + client) so screen readers, search bots, and select-to-copy
 * keep working unchanged. When the page lives under a
 * `MeshSceneProvider` AND the device + user preferences permit,
 * the component additionally builds an SDF text mesh via
 * troika-three-text, registers it with the shared scene, and
 * drops the HTML's opacity so the mesh paints in its place.
 *
 * The HTML stays in the DOM at its original size. That means
 * layout doesn't shift when the mesh joins — the page is laid out
 * by HTML, the mesh just paints over the same rectangle. The
 * MeshSceneProvider re-parks the mesh to that rectangle once per
 * frame, so scroll/resize/reflow tracks for free.
 *
 * This is body text only. For forms, links the reader clicks,
 * anything interactive — keep using plain HTML. See MESH-PROSE.md.
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { useMeshScene } from "components/type3d/MeshSceneProvider";
import { useMeshSceneAvailable } from "hooks/useMeshSceneAvailable";
import { rectToSceneCoords, type SdfFontKind } from "lib/type3d/sdf-text";

const FOV_DEG = 35;
const CAMERA_BASE_Z = 6;

export type MeshProseLayerProps = {
  children: ReactNode;
  /** Font family — defaults to "sans" (Inter). */
  font?: SdfFontKind;
  /** Material treatment — matte by default. */
  material?: "matte" | "chrome" | "foil";
  /** Extrusion / billboard depth in scene units. Default 2.
   *  SDF text is a billboard, so depth controls the per-frame
   *  z-offset added when the layer "lifts" toward the reader. */
  depth?: number;
  /** Override the line-height multiplier. Default 1.45. */
  lineHeight?: number;
  /** Optional className applied to the outer wrapper. */
  className?: string;
};

export function MeshProseLayer({
  children,
  font = "sans",
  material = "matte",
  depth = 2,
  lineHeight = 1.45,
  className,
}: MeshProseLayerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const meshRegRef = useRef<(() => void) | null>(null);
  const [meshOn, setMeshOn] = useState(false);

  const scene = useMeshScene();
  const { available } = useMeshSceneAvailable();

  useEffect(() => {
    if (!available || !scene) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let cancelled = false;
    let registered: (() => void) | null = null;
    let textInstance: import("lib/type3d/sdf-text").SdfTextInstance | null =
      null;

    (async () => {
      try {
        // Extract the text content from the HTML the wrapper
        // already laid out. We do not re-walk on every change —
        // body prose is static once mounted in this codebase. If
        // a caller does mutate, they should remount the wrapper.
        const text = wrapper.textContent?.trim() ?? "";
        if (!text) return;

        const initialRect = wrapper.getBoundingClientRect();
        if (initialRect.width <= 0 || initialRect.height <= 0) return;

        const { createSdfText } = await import("lib/type3d/sdf-text");
        if (cancelled) return;

        // World-space sizing — convert the wrapper's CSS rect into
        // scene units once at construction. The provider re-parks
        // the group every frame, so we don't need to update the
        // troika instance's sizing unless the wrapper itself
        // resizes. ResizeObserver handles that.
        const coords = rectToSceneCoords({
          rect: initialRect,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          cameraZ: CAMERA_BASE_Z,
          fovDeg: FOV_DEG,
        });

        // Pull a reasonable font size from the wrapper's computed
        // line-height. Body text in this codebase sits around
        // 16-18px line; troika expects world units.
        const cs = window.getComputedStyle(wrapper);
        const cssFontSize = parseFloat(cs.fontSize) || 18;
        const fontSizeWorld = cssFontSize * coords.pxToWorld;

        textInstance = await createSdfText({
          font,
          fontSize: fontSizeWorld,
          maxWidth: coords.widthWorld,
          lineHeight,
          material,
          anchorX: "left",
          anchorY: "top",
        });
        textInstance.text = text;
        // Lift the layer in z by the requested depth — keeps the
        // mesh layer in front of any sibling layers parked at z=0.
        (textInstance as unknown as { position: { z: number } }).position.z =
          depth * coords.pxToWorld;

        await new Promise<void>((resolve) => {
          textInstance!.sync(() => resolve());
        });
        if (cancelled) {
          textInstance.dispose();
          return;
        }

        registered = scene.addGlyphGroup({
          group: textInstance,
          getRect: () => {
            const el = wrapperRef.current;
            if (!el) return null;
            return el.getBoundingClientRect();
          },
        });
        meshRegRef.current = registered;
        setMeshOn(true);

        // ResizeObserver re-syncs the troika instance when the
        // wrapper's width or font-size changes (column reflow,
        // viewport resize, font swap). The provider already
        // re-parks position every frame, so this only fires for
        // the cases that change layout geometry.
        const resizeObs = new ResizeObserver(() => {
          const el = wrapperRef.current;
          const t = textInstance;
          if (!el || !t) return;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0) return;
          const next = rectToSceneCoords({
            rect,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
            cameraZ: CAMERA_BASE_Z,
            fovDeg: FOV_DEG,
          });
          const csNext = window.getComputedStyle(el);
          const cssFontSizeNext = parseFloat(csNext.fontSize) || 18;
          t.fontSize = cssFontSizeNext * next.pxToWorld;
          t.maxWidth = next.widthWorld;
          t.sync();
        });
        resizeObs.observe(wrapper);

        return () => resizeObs.disconnect();
      } catch (err) {
        console.warn(
          "[MeshProseLayer] mesh upgrade failed; staying on HTML:",
          err,
        );
        if (!cancelled) setMeshOn(false);
      }
    })();

    return () => {
      cancelled = true;
      if (registered) registered();
      meshRegRef.current = null;
      // troika instance disposed by the unregister callback
      setMeshOn(false);
    };
  }, [available, scene, font, material, depth, lineHeight]);

  const style: CSSProperties = meshOn
    ? {
        // HTML stays in the DOM at full size for layout, but its
        // glyph pixels go transparent so the mesh underneath
        // shows through. We keep `color: transparent` instead of
        // `opacity: 0` so the bounding rect we read for the
        // anchor stays accurate — opacity:0 would still report
        // the rect but some browsers stop computing exact glyph
        // metrics on fully-transparent elements.
        color: "transparent",
        // text-shadow nukes any inherited shadow that would
        // otherwise show through despite the transparent fill.
        textShadow: "none",
        // Keep selection / copy working — the selection layer
        // sits above the colour layer in every browser the studio
        // ships to, so the highlight remains visible.
      }
    : {};

  return (
    <div
      ref={wrapperRef}
      data-mesh-prose={meshOn ? "mesh" : "html"}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
