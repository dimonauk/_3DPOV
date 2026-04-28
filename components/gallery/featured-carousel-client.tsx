"use client";

import { useEffect, useMemo, useState } from "react";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FeaturedCarouselClient({ images }: { images: string[] }) {
  const shuffled = useMemo(() => shuffle(images), [images]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || shuffled.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % shuffled.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [paused, shuffled.length]);

  if (shuffled.length === 0) return null;

  return (
    <div
      className="relative mx-auto aspect-[16/9] w-full max-w-xl overflow-hidden rounded-md border border-warm-black-800 bg-warm-black-900 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      aria-label="Featured work carousel"
    >
      {shuffled.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {shuffled.length > 1 && (
        <div className="absolute right-0 bottom-3 left-0 flex justify-center gap-1.5">
          {shuffled.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1} of ${shuffled.length}`}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === index
                  ? "bg-pink-200"
                  : "bg-warm-black-600 hover:bg-chrome-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
