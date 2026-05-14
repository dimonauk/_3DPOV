import { promises as fs } from "node:fs";
import path from "node:path";
import type { Card } from "./types";

const CARDS_DIR = path.join(process.cwd(), "data", "cards");

/** Load a single card by slug. Returns null if the slug isn't found. */
export async function getCard(slug: string): Promise<Card | null> {
  // Defence-in-depth: don't let `..` traverse out of cards/
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;

  const file = path.join(CARDS_DIR, `${slug}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as Card;
  } catch (err: any) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

/** List every card slug present on disk. */
export async function listCardSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(CARDS_DIR);
    return entries
      .filter((e) => e.endsWith(".json"))
      .map((e) => e.replace(/\.json$/, ""));
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

/** Load every card. Useful for sitemap / index pages. */
export async function getAllCards(): Promise<Card[]> {
  const slugs = await listCardSlugs();
  const cards = await Promise.all(slugs.map((s) => getCard(s)));
  return cards.filter((c): c is Card => c !== null);
}
