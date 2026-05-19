import Image from "next/image";

/**
 * The headline magazine-cover plate. A `.lux-stage` perspective box
 * with the image at the back, a radial vignette over it for legibility,
 * and the supertitle / title / subtitle / issue chip floating forward
 * on their own z-planes. Tilts a touch on hover (reduced-motion-safe),
 * carries the paper-stack shadow so it reads as a sheet sitting above
 * the page rather than welded to it.
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
            covers still have weight at the top of the column. */}
        {image ? (
          <div className="lux-z-0 absolute inset-0">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 960px, 100vw"
              priority
            />
          </div>
        ) : (
          <div
            aria-hidden
            className="lux-z-0 absolute inset-0 bg-[#0c0a12]"
            style={{
              backgroundImage:
                "radial-gradient(600px 320px at 70% 30%, rgba(0,243,255,0.15), transparent 60%), radial-gradient(540px 360px at 20% 80%, rgba(255,77,255,0.18), transparent 60%), radial-gradient(420px 280px at 50% 100%, rgba(255,215,0,0.10), transparent 65%)",
            }}
          />
        )}

        {/* Vignette over the image — keeps the foiled title legible
            even when the photograph behind is busy. */}
        <div
          aria-hidden
          className="lux-z-1 hero-vignette pointer-events-none absolute inset-0"
        />

        {/* Top-right issue chip — pinned to the corner, sits on its own
            forward plane so it lifts cleanly on hover. */}
        {issueChip && (
          <div className="lux-z-4 absolute top-4 right-4 md:top-6 md:right-6">
            <span className="chrome-label rounded-full border border-pink-300/40 bg-warm-black-950/60 px-3 py-1 text-pink-200 backdrop-blur-sm">
              {issueChip}
            </span>
          </div>
        )}

        {/* Title stack — bottom-anchored. Supertitle, then the big
            foiled serif, then the italic subtitle. */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 md:p-10">
          {supertitle && (
            <span className="lux-z-2 chrome-label text-pink-200">
              {supertitle}
            </span>
          )}
          <h1
            className="lux-z-3 lux-foil font-display text-4xl leading-[0.95] md:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="lux-z-3 max-w-xl text-base text-chrome-200 italic md:text-lg">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
