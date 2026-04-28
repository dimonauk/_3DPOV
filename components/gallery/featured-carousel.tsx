import { readdir } from "node:fs/promises";
import path from "node:path";
import { FeaturedCarouselClient } from "./featured-carousel-client";

const IMAGE_EXTS = /\.(jpe?g|png|webp|avif)$/i;
const CATEGORIES = ["drone", "holographic"] as const;

async function readCategory(category: string): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), "public", "gallery", category);
    const files = await readdir(dir);
    return files
      .filter((f) => IMAGE_EXTS.test(f))
      .map((f) => `/gallery/${category}/${f}`);
  } catch {
    return [];
  }
}

export async function FeaturedCarousel() {
  const lists = await Promise.all(CATEGORIES.map(readCategory));
  const images = lists.flat();
  if (images.length === 0) return null;
  return <FeaturedCarouselClient images={images} />;
}
