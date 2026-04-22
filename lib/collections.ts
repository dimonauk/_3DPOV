import fs from "node:fs";
import path from "node:path";
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

export function getCollectionSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

export function getCollection(slug: string): Collection {
  const mdxPath = path.join(CONTENT_DIR, `${slug}.mdx`);
  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;
  const raw = fs.readFileSync(filePath, "utf8");
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
}

export function getCollections(): Collection[] {
  return getCollectionSlugs()
    .map((s) => getCollection(s))
    .sort((a, b) => a.code.localeCompare(b.code));
}
