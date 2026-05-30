'use client';

import { useState } from 'react';
import { CldImage } from 'next-cloudinary';
import clsx from 'clsx';

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
}

export function CldImageGallery({ images }: { images: GalleryImage[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedIndex = selectedId ? images.findIndex((img) => img.id === selectedId) : -1;

  const currentImage = selectedIndex >= 0 ? images[selectedIndex] : null;
  const prevImage = selectedIndex > 0 ? images[selectedIndex - 1] : null;
  const nextImage = selectedIndex < images.length - 1 ? images[selectedIndex + 1] : null;

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => setSelectedId(img.id)}
            className="group relative aspect-square overflow-hidden rounded-sm bg-warm-black-800"
          >
            <CldImage
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              crop="fill"
              gravity="auto"
            />
            <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/20" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="relative max-h-screen max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedId(null)}
              className="absolute -top-10 right-0 text-2xl text-white hover:text-pink-200 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Image */}
            <div className="relative aspect-auto w-full bg-warm-black-900">
              <CldImage
                src={currentImage.src}
                alt={currentImage.alt}
                width={1200}
                height={800}
                className="w-full h-auto"
              />
            </div>

            {/* Counter + Navigation */}
            <div className="mt-4 flex items-center justify-between text-sm text-chrome-300">
              <span>{selectedIndex + 1} / {images.length}</span>

              <div className="flex gap-3">
                {prevImage && (
                  <button
                    onClick={() => setSelectedId(prevImage.id)}
                    className="px-4 py-2 rounded border border-chrome-400 hover:border-pink-200 hover:text-pink-200 transition-colors"
                  >
                    ← Previous
                  </button>
                )}

                {nextImage && (
                  <button
                    onClick={() => setSelectedId(nextImage.id)}
                    className="px-4 py-2 rounded border border-chrome-400 hover:border-pink-200 hover:text-pink-200 transition-colors"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
