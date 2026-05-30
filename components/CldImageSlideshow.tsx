'use client';

import { useState, useEffect } from 'react';
import { CldImage } from 'next-cloudinary';

interface SlideshowImage {
  id: number;
  src: string;
  alt: string;
}

export function CldImageSlideshow({ images }: { images: SlideshowImage[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isPlaying || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [isPlaying, isHovered, images.length]);

  const currentImage = images[currentIndex];
  const prevIndex = (currentIndex - 1 + images.length) % images.length;
  const nextIndex = (currentIndex + 1) % images.length;

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main slideshow */}
      <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-warm-black-900">
        <CldImage
          src={currentImage.src}
          alt={currentImage.alt}
          fill
          className="object-cover"
          sizes="100vw"
          crop="fill"
          gravity="auto"
        />

        {/* Auto-play indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-chrome-300">
          <span className={`inline-block h-2 w-2 rounded-full ${isPlaying ? 'bg-pink-200 animate-pulse' : 'bg-chrome-400'}`} />
          {isPlaying ? 'Auto-playing' : 'Paused'}
        </div>

        {/* Counter */}
        <div className="absolute bottom-4 right-4 text-sm text-chrome-200 bg-black/60 px-3 py-1 rounded">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Prev/Next overlays (appear on hover) */}
        {isHovered && (
          <>
            <button
              onClick={() => setCurrentIndex(prevIndex)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-3xl text-white hover:text-pink-200 transition-colors"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentIndex(nextIndex)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-3xl text-white hover:text-pink-200 transition-colors"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => {
              setCurrentIndex(idx);
              setIsPlaying(false);
            }}
            className={`relative h-16 w-24 flex-shrink-0 rounded-sm overflow-hidden transition-opacity ${
              idx === currentIndex ? 'ring-2 ring-pink-200 opacity-100' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <CldImage
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="96px"
              crop="fill"
              gravity="auto"
            />
          </button>
        ))}
      </div>

      {/* Playback controls */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1.5 text-sm rounded border border-chrome-400 hover:border-pink-200 hover:text-pink-200 transition-colors"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <span className="text-xs text-chrome-400">Auto-advances every 5 seconds</span>
      </div>
    </div>
  );
}
