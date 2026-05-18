import { promises as fs } from "node:fs";
import path from "node:path";
import { createLogger, errToObject } from "lib/log";
import type { Card } from "./types";

const CARDS_DIR = path.join(process.cwd(), "data", "cards");

const log = createLogger("ar.cards");

/**
 * Load a single card by slug. Two-tier lookup:
 *
 *  1. File-system tier (studio-hosted, canonical): JSON file at
 *     data/cards/<slug>.json.
 *  2. Firestore tier (user-saved via /cards/design): document at
 *     cards/<slug> in Firestore.
 *
 * The file tier wins — studio-hosted cards are the immutable
 * production catalogue. The Firestore tier covers the long tail of
 * user-saved cards. Returns null only if neither source has the slug.
 *
 * Server-only: imports node:fs and firebase-admin lazily so this file
 * doesn't bleed into client bundles.
 */
export async function getCard(slug: string): Promise<Card | null> {
  // Defence-in-depth: don't let `..` traverse out of cards/.
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return null;

  // Tier 1: file system.
  const file = path.join(CARDS_DIR, `${slug}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as Card;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== "ENOENT") throw err;
    // Fall through to Firestore.
  }

  // Tier 2: Firestore (only available server-side, only when admin
  // SDK creds are configured).
  try {
    const { getCardServer } = await import("../cards/firestore-server");
    const doc = await getCardServer(slug);
    return doc?.card ?? null;
  } catch (err) {
    // Firestore failures should not break the page — log and treat as not-found.
    log.warn("Firestore lookup failed", { slug, err: errToObject(err) });
    return null;
  }
}

/**
 * List every file-based card slug. Does NOT include Firestore-stored
 * user cards — used only for the static-generation pass on /c/<slug>
 * (Firestore cards render dynamically on first request).
 */
export async function listCardSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(CARDS_DIR);
    return entries
      .filter((e) => e.endsWith(".json"))
      .map((e) => e.replace(/\.json$/, ""));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "ENOENT") return [];
    throw err;
  }
}

/** Load every file-based card. Used for the /cards index. */
export async function getAllCards(): Promise<Card[]> {
  const slugs = await listCardSlugs();
  const cards = await Promise.all(slugs.map((s) => getCard(s)));
  return cards.filter((c): c is Card => c !== null);
}
