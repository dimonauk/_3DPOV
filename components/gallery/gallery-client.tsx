"use client";

import { useCallback, useEffect, useState } from "react";

export function GalleryClient({ images }: { images: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex !== null;

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () =>
      setOpenIndex((i) =>
        i === null ? null : (i + 1) % images.length,
      ),
    [images.length],
  );
  const prev = useCallback(
    () =>
      setOpenIndex((i) =>
        i === null ? null : (i - 1 + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, next, prev]);

  return (
    <>
      <ul className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
        {images.map((src, i) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group block aspect-square w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-900 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-200"
              aria-label={`Open photograph ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {open && openIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-warm-black-950/95 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Gallery viewer"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-warm-black-700 bg-warm-black-900/70 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-chrome-200 transition-colors hover:border-pink-200 hover:text-pink-200 md:left-6 md:px-4 md:py-3"
            aria-label="Previous"
          >
            ‹
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[openIndex]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[92vw] object-contain shadow-2xl"
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-warm-black-700 bg-warm-black-900/70 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-chrome-200 transition-colors hover:border-pink-200 hover:text-pink-200 md:right-6 md:px-4 md:py-3"
            aria-label="Next"
          >
            ›
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute right-3 top-3 rounded-full border border-warm-black-700 bg-warm-black-900/70 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-chrome-300 transition-colors hover:border-pink-200 hover:text-pink-200 md:right-6 md:top-6"
            aria-label="Close"
          >
            Close · esc
          </button>

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-chrome-500">
            {openIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </>
  );
}
