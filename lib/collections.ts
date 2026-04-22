import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import type { Work } from "./works";
import { CollectionFrontmatterSchema } from "./schemas";

export type Collection = {
  slug: string;
  code: string;
  title: string;
  kata: string;
  location: string;
  coordinates: string;
  hour: string;
  performedOn: string;
  tint: string;
  heroCaption: string;
  plateRef: string;
  body: string;
  work: Work;
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
  const parsed = CollectionFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid frontmatter in content/collections/${slug}.mdx:\n${issues}`);
  }
  return {
    slug,
    ...parsed.data,
    body: content,
  };
});

export const getCollections = cache((): Collection[] =>
  getCollectionSlugs()
    .map((s) => getCollection(s))
    .filter((c): c is Collection => c !== null)
    .sort((a, b) => a.code.localeCompare(b.code))
);
