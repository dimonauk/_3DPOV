"use client";

import Image from "next/image";

import { ParallaxLayer } from "components/parallax/ParallaxLayer";
import { MeshText3D } from "components/type3d/MeshText3D";

/**
 * The headline magazine-cover plate. A `.lux-stage` perspective box
 * with the image at the back, a radial vignette over it for legibility,
 * and the supertitle / title / subtitle / issue chip floating forward
 * on their own z-planes. Tilts a touch on hover (reduced-motion-safe),
 * carries the paper-stack shadow so it reads as a sheet sitting above
 * the page rather than welded to it.
 *
 * Parallax showcase: every floating element here is wrapped in a
 * ParallaxLayer with a descending speed so the cover separates into
 * depth bands as the reader scrolls. The image drifts slowest (0.4)
 * and the issue chip drifts fastest (1.0), so the title appears to
 * lift up off the photograph and into the page. See docs/PARALLAX.md
 * for the wider story.
 *
 * Client component because the parallax hooks subscribe to a window-
 * level scroll store. The wrapper is the only state-bearing part —
 * the visual content is all static markup.
 */
export type LuxCoverProps = {
  /** Optional background image. Rendered with priority since it's hero. */
  image?: { src: string; alt: string };
  /** Foreground display title on the top z-plane. */
  title: string;
  /** Optional supertitle band — small-caps mono above the title. */
  supertitle?: string;
  /** Optional one-line subtitle below the title. Italic. */
  subtitle?: string;
  /** Optional small-caps issue chip pinned to the top-right corner. */
  issueChip?: string;
  /** Frame aspect ratio. Defaults to 3/2 for hero plates. */
  aspect?: "3/2" | "4/5" | "1/1" | "16/9";
};

const aspectClass: Record<NonNullable<LuxCoverProps["aspect"]>, string> = {
  "3/2": "aspect-[3/2]",
  "4/5": "aspect-[4/5]",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
};

export function LuxCover({
  image,
  title,
  supertitle,
  subtitle,
  issueChip,
  aspect = "3/2",
}: LuxCoverProps) {
  return (
    <div className="lux-stage lux-tilt-on-hover lux-paper-stack lux-shadow-lg">
      <div
        className={`lux-card relative w-full overflow-hidden border border-warm-black-800 bg-warm-black-950 md:rounded-sm ${aspectClass[aspect]}`}
      >
        {/* Backplate — image if supplied, otherwise the same chrome-sheen
            gradient fallback the writing hero plate uses, so empty
            covers still have weight at the top of the column.

            Parallax speed 0.4 — the image drifts slowest, sitting
            visibly "behind" everything else as the page moves. */}
        {image ? (
          <ParallaxLayer
            speed={0.4}
            className="lux-z-0 absolute inset-0"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 960px, 100vw"
              priority
            />
          </ParallaxLayer>
        ) : (
          <ParallaxLayer
            speed={0.4}
            className="lux-z-0 absolute inset-0"
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-[#0c0a12]"
              style={{
                backgroundImage:
                  "radial-gradient(600px 320px at 70% 30%, rgba(0,243,255,0.15), transparent 60%), radial-gradient(540px 360px at 20% 80%, rgba(255,77,255,0.18), transparent 60%), radial-gradient(420px 280px at 50% 100%, rgba(255,215,0,0.10), transparent 65%)",
              }}
            />
          </ParallaxLayer>
        )}

        {/* Vignette over the image — keeps the foiled title legible
            even when the photograph behind is busy. Static (no
            parallax) so the legibility floor is uniform. */}
        <div
          aria-hidden
          className="lux-z-1 hero-vignette pointer-events-none absolute inset-0"
        />

        {/* Top-right issue chip — pinned to the corner, sits on its own
            forward plane so it lifts cleanly on hover.

            Parallax speed 1.0 — fastest in the stack, so the chip
            stays locked to the page as the reader scrolls past
            (relative to the slower image behind, it appears to
            rush forward). */}
        {issueChip && (
          <ParallaxLayer
            speed={1.0}
            className="lux-z-4 absolute top-4 right-4 md:top-6 md:right-6"
          >
            <span className="chrome-label rounded-full border border-pink-300/40 bg-warm-black-950/60 px-3 py-1 text-pink-200 backdrop-blur-sm">
              {issueChip}
            </span>
          </ParallaxLayer>
        )}

        {/* Title stack — bottom-anchored. Supertitle, then the big
            foiled serif, then the italic subtitle. Each line gets
            its own ParallaxLayer at a slightly different speed so
            the stack fans apart as the reader scrolls. */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 md:p-10">
          {supertitle && (
            <ParallaxLayer speed={0.6} className="lux-z-2">
              <span className="chrome-label text-pink-200">{supertitle}</span>
            </ParallaxLayer>
          )}
          <ParallaxLayer speed={0.8} className="lux-z-3">
            {/* Display register goes to 3D mesh per the type3d kit
                (components/type3d/) — extruded foil letters instead
                of an HTML glyph. The MeshText3D mirrors the title
                into an sr-only `h1` so screen readers, search bots,
                and select-to-copy still see real text; the mesh
                canvas next to it is aria-hidden. Falls back to the
                same `lux-foil` HTML heading if WebGL/WebGPU is
                unavailable. */}
            <MeshText3D
              tag="h1"
              material="foil"
              motion="drift"
              align="left"
              size={96}
              depth={14}
              className="lux-foil"
            >
              {title}
            </MeshText3D>
          </ParallaxLayer>
          {subtitle && (
            <ParallaxLayer speed={0.85} className="lux-z-3">
              <p className="max-w-xl text-base text-chrome-200 italic md:text-lg">
                {subtitle}
              </p>
            </ParallaxLayer>
          )}
        </div>
      </div>
    </div>
  );
}
