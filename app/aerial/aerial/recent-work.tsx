/**
 * app/aerial/aerial/recent-work.tsx — The recent-work section: a
 * single reel video (first available) plus a grid of still
 * thumbnails (up to 8). Falls back to a "first work pending"
 * placeholder when the media library is empty.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

import type { GalleryItem } from "./gallery";

export function RecentWork({ gallery }: { gallery: GalleryItem[] }) {
  const reel = gallery.find((g) => g.isVideo);
  const stillItems = gallery.filter((g) => !g.isVideo);

  return (
    <section id="recent-work" className="mt-16 scroll-mt-20">
      <div className="chrome-label mb-4">Recent work</div>

      {/*
        Reel — first available video item, inlined with controls.
        Poster falls back to the thumbnail variant when present.
        Muted + playsInline so iOS Safari doesn't block autoplay
        from the start-of-page intersection.
      */}
      {reel ? (
        <figure className="mb-6 overflow-hidden rounded-md border border-warm-black-800 bg-warm-black-950">
          <video
            src={reel.media.url}
            {...(reel.poster ? { poster: reel.poster } : {})}
            className="aspect-video w-full bg-warm-black-950"
            controls
            preload="metadata"
            playsInline
            muted
          />
          {reel.media.title || reel.media.description ? (
            <figcaption className="border-t border-warm-black-800 p-4 text-sm text-chrome-300">
              {reel.media.title ? (
                <div className="text-chrome-100">{reel.media.title}</div>
              ) : null}
              {reel.media.description ? (
                <div className="mt-1 text-chrome-400">
                  {reel.media.description}
                </div>
              ) : null}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {stillItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stillItems.slice(0, 8).map((item) => (
            <a
              key={item.media.id}
              href={item.media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-[4/5] overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950"
              aria-label={
                item.media.title ?? `Aerial photograph ${item.media.id}`
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.poster ?? item.media.url}
                alt={item.media.title ?? ""}
                className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-80"
                loading="lazy"
              />
              {item.media.title ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-warm-black-950/90 to-transparent p-2 text-[11px] text-chrome-100">
                  {item.media.title}
                </span>
              ) : null}
            </a>
          ))}
        </div>
      ) : !reel ? (
        <div className="rounded-md border border-warm-black-800 bg-warm-black-950/60 p-6">
          <div className="chrome-label">First work pending</div>
          <p className="mt-3 max-w-xl text-sm text-chrome-300">
            Reel and editorial stills go here as the bench promotes them
            from the local archive to public storage. Briefs are open in
            the meantime.
          </p>
        </div>
      ) : null}
    </section>
  );
}
