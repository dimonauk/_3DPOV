import { readdir } from "node:fs/promises";
import path from "node:path";
import { GalleryClient } from "./gallery-client";

const IMAGE_EXTS = /\.(jpe?g|png|webp|avif)$/i;

async function readGallery(category: string): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), "public", "gallery", category);
    const files = await readdir(dir);
    return files
      .filter((f) => IMAGE_EXTS.test(f))
      .sort()
      .map((f) => `/gallery/${category}/${f}`);
  } catch {
    return [];
  }
}

export async function GallerySection({
  category,
  title,
  caption,
}: {
  category: string;
  title: string;
  caption: string;
}) {
  const images = await readGallery(category);
  if (images.length === 0) return null;

  return (
    <div className="flex w-full flex-col items-center gap-5 border-t border-warm-black-800 pt-8">
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-chrome-500">
          {title}
        </span>
        <p className="max-w-md text-xs leading-relaxed text-chrome-400 md:text-sm">
          {caption}
        </p>
      </div>
      <GalleryClient images={images} />
    </div>
  );
}
