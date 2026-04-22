import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";

export type Collection = {
  slug: string;
  code: string;
  title: string;
  kata: string;
  location: string;
  coordinates: string;
  hour: string;
  performedOn: string;
  editionSize: number;
  priceGBP: number;
  dimensions: string;
  paper: string;
  tint: string;
  heroCaption: string;
  body: string;
  plateRef: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "collections");

export const getCollectionSlugs = cache((): string[] => {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
});

export const getCollection = cache((slug: string): Collection | null => {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  return {
    slug,
    code: data.code,
    title: data.title,
    kata: data.kata,
    location: data.location,
    coordinates: data.coordinates,
    hour: data.hour,
    performedOn: data.performedOn,
    editionSize: data.editionSize,
    priceGBP: data.priceGBP,
    dimensions: data.dimensions,
    paper: data.paper,
    tint: data.tint,
    heroCaption: data.heroCaption,
    plateRef: data.plateRef,
    body: content,
  };
});

export const getCollections = cache((): Collection[] =>
  getCollectionSlugs()
    .map((s) => getCollection(s))
    .filter((c): c is Collection => c !== null)
    .sort((a, b) => a.code.localeCompare(b.code))
);
